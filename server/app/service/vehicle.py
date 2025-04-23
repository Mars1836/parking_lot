import requests
from werkzeug.utils import secure_filename
import os
from ..models import Vehicle, VehicleDB, ParkingSession, Transaction
from datetime import datetime
import pytz
from .door import set_door_status, get_door_status
from flask import current_app
from sqlalchemy import func
import logging
import sqlite3

# Define Vietnam timezone
VIETNAM_TZ = pytz.timezone('Asia/Ho_Chi_Minh')

def get_vietnam_time():
    """Get current time in Vietnam timezone"""
    return datetime.now(VIETNAM_TZ)

def sanitize_license_plate(plate: str) -> str:
    """Sanitize license plate number for Firebase path compatibility."""
    # Replace invalid characters with underscores
    return plate.replace('.', '_').replace('/', '_').replace('#', '_').replace('$', '_').replace('[', '_').replace(']', '_')

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('parking.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

def set_image_src_last_scan(db, image_src, license_plate):
    try:
        db.child("lastScan").set({"imageSrc": image_src, "licensePlate": license_plate})
        logger.info(f"Successfully updated last scan for vehicle {license_plate}")
        return True
    except Exception as e:
        logger.error(f"Failed to update last scan: {str(e)}")
        return False

def set_vehicle_last_action(db, vehicle_data, action):
    try:
        db.child("vehicle_last_action").child("action").set(action)
        db.child("vehicle_last_action").child("infor").set(vehicle_data)
        logger.info(f"Successfully set last action '{action}' for vehicle {vehicle_data['licensePlate']}")
        return True
    except Exception as e:
        logger.error(f"Failed to set last action: {str(e)}")
        return False

def get_vehicle_action(db,vehicle_data,action):
    try:
        db.child("vehicles").child(vehicle_data["licensePlate"]).set(vehicle_data)
        return db.child("vehicle_last_action").child("infor").set(vehicle_data)
    except Exception as e:
        print(f"Vehicle data retrieval error: {e}")
        return None

def store_vehicle_data(vehicle_data):
    try:
        sql_db.session.add(vehicle_data)
        sql_db.session.commit()
        return True
    except Exception as e:
        print(f"Vehicle data retrieval error: {e}")
        return False

def update_vehicle_data(vehicle_data):
    try:
        sql_db.session.commit()
        return True
    except Exception as e:
        print(f"Vehicle data retrieval error: {e}")
        return False

def log_sqlite_data(vehicle_data, action):
    """Log current state of SQLite database"""
    try:
        db_path = os.path.join(current_app.instance_path, 'example.db')
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        # Log vehicles table
        cursor.execute("SELECT * FROM vehicles")
        vehicles = cursor.fetchall()
        
        # Log parking_sessions table
        cursor.execute("SELECT * FROM parking_sessions")
        sessions = cursor.fetchall()
        
        # Log transactions table
        cursor.execute("SELECT * FROM transactions")
        transactions = cursor.fetchall()
        
        conn.close()
    except Exception as e:
        logger.error(f"Error logging SQLite data: {str(e)}")

class VehicleService:
    @staticmethod
    def store_image(image_url, static_folder):
        try:
            response = requests.get(image_url)
            if response.status_code != 200:
                raise ValueError("Failed to download image")
            
            image_name = secure_filename(image_url.split("/")[-1])
            image_path = os.path.join(static_folder, image_name)
            
            with open(image_path, "wb") as f:
                f.write(response.content)
            
            return image_name
        except Exception as e:
            print(f"Image storage error: {e}")
            return None

    @staticmethod
    def handle_vehicle_scan(db, license_plate, rfid_code=None, image_src=None):
        try:
            sqldb = current_app.config['SQLDB']
            
            # Find or create vehicle in SQL database
            vehicle = VehicleDB.query.filter_by(plate_number=license_plate).first()
            if not vehicle:
                vehicle = VehicleDB(plate_number=license_plate)
                sqldb.session.add(vehicle)
                sqldb.session.commit()

            # Check if vehicle has an active session
            active_session = ParkingSession.query.filter_by(
                vehicle_id=vehicle.id,
                checkout_time=None
            ).first()

            if active_session:
                # Vehicle is exiting
                active_session.checkout_time = get_vietnam_time()
                
                # Calculate fee based on time difference
                time_diff = active_session.checkout_time - active_session.checkin_time
                hours = time_diff.total_seconds() / 3600
                fee = hours * 10  # $10 per hour
                active_session.fee = fee

                # Create transaction record
                transaction = Transaction(
                    session_id=active_session.id,
                    amount=fee,
                    payment_method='cash',  # Default payment method
                    paid_at=get_vietnam_time()
                )
                sqldb.session.add(transaction)
            else:
                # Vehicle is entering
                new_session = ParkingSession(
                    vehicle_id=vehicle.id,
                    rfid_code=rfid_code,
                    image_src=image_src,
                    checkin_time=get_vietnam_time()
                )
                sqldb.session.add(new_session)

            sqldb.session.commit()

            # Update Firebase data
            vehicle_data = db.child("vehicles").child(license_plate).get()
            if vehicle_data.val():
                # Vehicle is exiting
                db.child("vehicles").child(license_plate).update({
                    "exitTime": get_vietnam_time().isoformat()
                })
                set_vehicle_last_action(db, vehicle_data, "exit")
            else:
                # Vehicle is entering
                vehicle_data = Vehicle.create(license_plate)
                db.child("vehicles").child(license_plate).set(vehicle_data)
                set_image_src_last_scan(db, vehicle_data["imageSrc"], vehicle_data["licensePlate"])
                set_vehicle_last_action(db, vehicle_data, "enter")

            return True
        except Exception as e:
            print(f"Vehicle scan error: {e}")
            sqldb.session.rollback()
            return False

    @staticmethod
    def add_new_vehicle(db, vehicle_data):
        try:
            sqldb = current_app.config['SQLDB']
            
            # Create vehicle in SQL database
            vehicle = VehicleDB(plate_number=vehicle_data["licensePlate"])
            sqldb.session.add(vehicle)
            sqldb.session.commit()

            # Create parking session
            session = ParkingSession(
                vehicle_id=vehicle.id,
                checkin_time=get_vietnam_time(),
                image_src=vehicle_data["imageSrc"]
            )
            sqldb.session.add(session)
            sqldb.session.commit()

            # Update Firebase
            db.child("vehicles").child(vehicle_data["licensePlate"]).set(vehicle_data)
            set_image_src_last_scan(db, vehicle_data["imageSrc"], vehicle_data["licensePlate"])
            set_vehicle_last_action(db, vehicle_data, "enter")
            return True
        except Exception as e:
            logger.error(f"Failed to add new vehicle {vehicle_data['licensePlate']}: {str(e)}")
            sqldb.session.rollback()
            return False

    @staticmethod
    def handle_vehicle_exit(db,license_plate):
        try:
            vehicle_data = db.child("vehicles").child(license_plate).get().val()
            time_exit = get_vietnam_time().isoformat()
            db.child("vehicles").child(license_plate).update({"exitTime": time_exit})
            vehicle_data["exitTime"] = time_exit
            set_vehicle_last_action(db,vehicle_data,"exit")
            return True
        except Exception as e:
            print(f"Vehicle exit error: {e}")
            return False

    @staticmethod   
    def handle_vehicle_enter(db,vehicle_data):
        print("vehicle_data: ",vehicle_data)
        try:
            db.child("vehicles").child(vehicle_data["licensePlate"]).set(vehicle_data)
            set_vehicle_last_action(db,vehicle_data,"enter")
            return True
        except Exception as e:
            print(f"Vehicle enter error: {e}")
            return False

    @staticmethod
    def handle_vehicle_conflict(db,vehicle_data):
        try:
            set_vehicle_last_action(db,vehicle_data,"conflict")
            return True
        except Exception as e:
            print(f"Vehicle conflict error: {e}")
            return False

    @staticmethod
    def handle_vehicle(db, vehicle_data, action):
        try:
            sqldb = current_app.config['SQLDB']            
            # Log current state before changes
            log_sqlite_data(vehicle_data, action)
            
            if action == "enter":
                try:
                    # SQLite operations
                    vehicle = VehicleDB.query.filter_by(plate_number=vehicle_data["licensePlate"]).first()
                    if not vehicle:
                        vehicle = VehicleDB(plate_number=vehicle_data["licensePlate"])
                        sqldb.session.add(vehicle)
                        sqldb.session.commit()

                    session = ParkingSession(
                        vehicle_id=vehicle.id,
                        checkin_time=get_vietnam_time(),
                        rfid_code=vehicle_data.get("rfid"),
                        image_src=vehicle_data["imageSrc"]
                    )
                    sqldb.session.add(session)
                    sqldb.session.commit()

                    VehicleService.handle_vehicle_enter(db,vehicle_data)        
                    log_sqlite_data(vehicle_data, action)
                    return True
                    
                except Exception as e:
                    logger.error(f"Error in enter operation: {str(e)}")
                    sqldb.session.rollback()
                    return False

            elif action == "exit":
                try:
                    # SQLite operations
                    vehicle = VehicleDB.query.filter_by(plate_number=vehicle_data["licensePlate"]).first()
                    if not vehicle:
                        logger.warning(f"Vehicle {vehicle_data['licensePlate']} not found in database")
                        return False

                    active_session = ParkingSession.query.filter_by(
                        vehicle_id=vehicle.id,
                        checkout_time=None
                    ).first()

                    if active_session:
                        active_session.checkout_time = get_vietnam_time()
                        
                        # Get price from Firebase
                        price_data = db.child("price").get()
                        fee = 1.0  # Default fee
                        if price_data.val() is not None:
                            fee = float(price_data.val())
                            
                        active_session.fee = fee

                        transaction = Transaction(
                            session_id=active_session.id,
                            amount=fee,
                            payment_method='cash',
                            paid_at=get_vietnam_time()
                        )
                        sqldb.session.add(transaction)
                        sqldb.session.commit()
                        logger.info(f"Created transaction for vehicle {vehicle_data['licensePlate']} with fee ${fee}")

                    VehicleService.handle_vehicle_exit(db,vehicle_data["licensePlate"])
                    log_sqlite_data(vehicle_data, action)
                    return True
                    
                except Exception as e:
                    logger.error(f"Error in exit operation: {str(e)}")
                    sqldb.session.rollback()
                    return False

            elif action == "conflict":
                try:
                    VehicleService.handle_vehicle_conflict(db, vehicle_data)
                    logger.warning(f"Vehicle conflict detected for {vehicle_data['licensePlate']}")
                    return True
                except Exception as e:
                    logger.error(f"Error in conflict operation: {str(e)}")
                    return False

            return False
        except Exception as e:
            logger.error(f"Error processing vehicle {vehicle_data['licensePlate']}: {str(e)}")
            sqldb.session.rollback()
            return False

    @staticmethod
    def sync_vehicles_to_firebase(db):
        """
        Synchronize vehicles from SQLite to Firebase.
        Only sync vehicles that are currently parked and have sessions from today.
        Clears existing Firebase data before syncing.
        Returns a dictionary with sync results.
        """
        try:
            sqldb = current_app.config['SQLDB']
            sync_results = {
                'synced_vehicles': 0,
                'errors': []
            }

            # Clear existing Firebase data
            try:
                db.child("vehicles").remove()
                logger.info("Cleared existing Firebase vehicles data")
            except Exception as e:
                logger.error(f"Error clearing Firebase data: {str(e)}")
                sync_results['errors'].append(f"Error clearing Firebase data: {str(e)}")
                return sync_results

            # Get today's date in Vietnam timezone
            today = get_vietnam_time().date()

            # Get all active sessions from today
            active_sessions = ParkingSession.query.filter(
                ParkingSession.checkin_time >= today,
                ParkingSession.checkout_time.is_(None)  # Only sessions that haven't checked out
            ).all()

            # Sync each vehicle to Firebase
            for session in active_sessions:
                try:
                    vehicle = session.vehicle
                    # Sanitize plate for Firebase path
                    sanitized_plate = sanitize_license_plate(vehicle.plate_number)
                    
                    # Prepare vehicle data for Firebase
                    vehicle_data = {
                        'licensePlate': vehicle.plate_number,
                        'entryTime': session.checkin_time.astimezone(VIETNAM_TZ).isoformat(),
                        'imageSrc': session.image_src,
                        'rfid': session.rfid_code
                    }

                    # Add to Firebase
                    db.child("vehicles").child(sanitized_plate).set(vehicle_data)
                    sync_results['synced_vehicles'] += 1
                    logger.info(f"Synced vehicle {vehicle.plate_number} to Firebase")
                except Exception as e:
                    error_msg = f"Error syncing vehicle {vehicle.plate_number} to Firebase: {str(e)}"
                    logger.error(error_msg)
                    sync_results['errors'].append(error_msg)

            logger.info(f"Sync completed: {sync_results}")
            return sync_results

        except Exception as e:
            error_msg = f"Error during sync: {str(e)}"
            logger.error(error_msg)
            return {
                'synced_vehicles': 0,
                'errors': [error_msg]
            }
     
