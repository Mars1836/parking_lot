# app/models.py
from datetime import datetime
import random
import string

class Vehicle:
    @staticmethod
    def create(license_plate=None):
        if not license_plate:
            license_plate = ''.join(random.choices(string.ascii_uppercase + string.digits, k=6))
        
        return {
            "licensePlate": license_plate,
            "entryTime": datetime.now().isoformat(),
            "exitTime": None,
            "imageSrc": "/static/images/455-300x300.jpg",
        }
    @staticmethod
    def build(image,license_plate):
        return {
            "licensePlate": license_plate,
            "entryTime": datetime.now().isoformat(),
            "exitTime": None,
            "imageSrc": image,
        }
