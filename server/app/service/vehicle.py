import requests
from werkzeug.utils import secure_filename
import os
from ..models import Vehicle
from datetime import datetime
from .door import set_door_status, get_door_status
def set_image_src_last_scan(db,image_src,license_plate):
    try:
        db.child("lastScan").set({"imageSrc": image_src,"licensePlate":license_plate})
        return True
    except Exception as e:
        print(f"Vehicle data retrieval error: {e}")
        return False

def set_vehicle_last_action(db, vehicle_data, action):
    try:
        db.child("vehicle_last_action").child("action").set(action)
        return db.child("vehicle_last_action").child("infor").set(vehicle_data)
    except Exception as e:
        print(f"Vehicle data retrieval error: {e}")
        return None
def get_vehicle_action(db,vehicle_data,action):
    try:
        db.child("vehicles").child(vehicle_data["licensePlate"]).set(vehicle_data)

        return db.child("vehicle_last_action").child("infor").set(vehicle_data)
    except Exception as e:
        print(f"Vehicle data retrieval error: {e}")
        return None
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
    def add_new_vehicle(db,vehicle_data):
        try:
            vehicle_data = Vehicle.create()
            db.child("vehicles").child(vehicle_data["licensePlate"]).set(vehicle_data)
            set_image_src_last_scan(db,vehicle_data["imageSrc"],vehicle_data["licensePlate"])
            set_vehicle_last_action(db,vehicle_data,"enter")
            return True
        except Exception as e:
            print(f"Vehicle data retrieval error: {e}")
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
    def handle_vehicle(db,vehicle_data,action):
        if(action == "enter"):
            return VehicleService.handle_vehicle_enter(db,vehicle_data)
        elif(action == "exit"):
            return VehicleService.handle_vehicle_exit(db,vehicle_data["licensePlate"])
        elif(action == "conflict"):
            return VehicleService.handle_vehicle_conflict(db,vehicle_data)
        else:
            return False
     
