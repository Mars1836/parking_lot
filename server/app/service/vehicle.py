import requests
from werkzeug.utils import secure_filename
import os
from ..models import Vehicle, VehicleDB, ParkingSession, Transaction
from datetime import datetime
from .door import set_door_status, get_door_status
from flask import current_app
from sqlalchemy import func
import logging
import sqlite3

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
        logger.info(f"Current vehicles in SQLite: {vehicles}")
        
        # Log parking_sessions table
        cursor.execute("SELECT * FROM parking_sessions")
        sessions = cursor.fetchall()
        logger.info(f"Current parking sessions in SQLite: {sessions}")
        
        # Log transactions table
        cursor.execute("SELECT * FROM transactions")
        transactions = cursor.fetchall()
        logger.info(f"Current transactions in SQLite: {transactions}")
        
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
                active_session.checkout_time = datetime.utcnow()
                
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
                    paid_at=datetime.utcnow()
                )
                sqldb.session.add(transaction)
            else:
                # Vehicle is entering
                new_session = ParkingSession(
                    vehicle_id=vehicle.id,
                    rfid_code=rfid_code,
                    image_src=image_src,
                    checkin_time=datetime.utcnow()
                )
                sqldb.session.add(new_session)

            sqldb.session.commit()

            # Update Firebase data
            vehicle_data = db.child("vehicles").child(license_plate).get()
            if vehicle_data.val():
                # Vehicle is exiting
                db.child("vehicles").child(license_plate).update({
                    "exitTime": datetime.now().isoformat()
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
            logger.info(f"Adding new vehicle {vehicle_data['licensePlate']}")
            
            # Create vehicle in SQL database
            vehicle = VehicleDB(plate_number=vehicle_data["licensePlate"])
            sqldb.session.add(vehicle)
            sqldb.session.commit()
            logger.info(f"Created vehicle record for {vehicle_data['licensePlate']}")

            # Create parking session
            session = ParkingSession(
                vehicle_id=vehicle.id,
                checkin_time=datetime.utcnow(),
                image_src=vehicle_data["imageSrc"]
            )
            sqldb.session.add(session)
            sqldb.session.commit()
            logger.info(f"Created parking session for {vehicle_data['licensePlate']}")

            # Update Firebase
            db.child("vehicles").child(vehicle_data["licensePlate"]).set(vehicle_data)
            set_image_src_last_scan(db, vehicle_data["imageSrc"], vehicle_data["licensePlate"])
            set_vehicle_last_action(db, vehicle_data, "enter")
            logger.info(f"Successfully added new vehicle {vehicle_data['licensePlate']} to both databases")
            return True
        except Exception as e:
            logger.error(f"Failed to add new vehicle {vehicle_data['licensePlate']}: {str(e)}")
            sqldb.session.rollback()
            return False

    @staticmethod
    def handle_vehicle_scan(db, license_plate):
        try:
            vehicle_data = db.child("vehicles").child(license_plate).get()
            
            if vehicle_data.val():
                # Vehicle is exiting
                db.child("vehicles").child(license_plate).update({
                    "exitTime": datetime.now().isoformat()
                })
                set_vehicle_last_action(db,vehicle_data,"exit")
            else:
                # Vehicle is entering
                vehicle_data = Vehicle.create(license_plate)
                db.child("vehicles").child(license_plate).set(vehicle_data)
                set_image_src_last_scan(db,vehicle_data["imageSrc"],vehicle_data["licensePlate"])
                set_vehicle_last_action(db,vehicle_data,"enter")
            
            return True
        except Exception as e:
            print(f"Vehicle scan error: {e}")
            return False
    @staticmethod
    def handle_vehicle_exit(db,license_plate):
        try:
            vehicle_data = db.child("vehicles").child(license_plate).get().val()
            time_exit = datetime.now().isoformat()
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
            logger.info(f"Processing {action} for vehicle {vehicle_data['licensePlate']}")
            
            # Log current state before changes
            log_sqlite_data(vehicle_data, action)
            
            # Sanitize license plate for Firebase
            safe_license_plate = vehicle_data["licensePlate"].replace(".", "_").replace("-", "_")
            
            if action == "enter":
                try:
                    # SQLite operations
                    vehicle = VehicleDB.query.filter_by(plate_number=vehicle_data["licensePlate"]).first()
                    if not vehicle:
                        vehicle = VehicleDB(plate_number=vehicle_data["licensePlate"])
                        sqldb.session.add(vehicle)
                        sqldb.session.commit()
                        logger.info(f"Created new vehicle record for {vehicle_data['licensePlate']}")

                    session = ParkingSession(
                        vehicle_id=vehicle.id,
                        checkin_time=datetime.utcnow(),
                        rfid_code=vehicle_data.get("rfid"),
                        image_src=vehicle_data["imageSrc"]
                    )
                    sqldb.session.add(session)
                    sqldb.session.commit()
                    logger.info(f"Created new parking session for vehicle {vehicle_data['licensePlate']}")

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
                        active_session.checkout_time = datetime.utcnow()
                        fee = 1.00
                        active_session.fee = fee

                        transaction = Transaction(
                            session_id=active_session.id,
                            amount=fee,
                            payment_method='cash',
                            paid_at=datetime.utcnow()
                        )
                        sqldb.session.add(transaction)
                        sqldb.session.commit()
                        logger.info(f"Created transaction for vehicle {vehicle_data['licensePlate']} with fee ${fee}")

                    VehicleService.handle_vehicle_exit(db,vehicle_data)
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
     
