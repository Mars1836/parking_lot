# app/models.py
from datetime import datetime
import random
import string
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy import Enum
from decimal import Decimal
from werkzeug.security import generate_password_hash

db = SQLAlchemy()   

class UserDB(db.Model):
    __tablename__ = 'users'  # Tên bảng
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)  # Khóa chính
    name = db.Column(db.String(80), nullable=False)  # Tên người dùng
    username = db.Column(db.String(80), nullable=False, unique=True)
    password = db.Column(db.String(120), nullable=False)  # Mật khẩu
    role = db.Column(Enum('admin', 'security', name='user_role_enum'), nullable=False, default='security')
    created_at = db.Column(db.DateTime, default=db.func.now())  # Thời gian tạo
    updated_at = db.Column(db.DateTime, default=db.func.now(), onupdate=db.func.now())

class VehicleDB(db.Model):
    __tablename__ = 'vehicles'
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    plate_number = db.Column(db.String(20), unique=True, nullable=False)
    parking_sessions = db.relationship('ParkingSession', back_populates='vehicle', lazy=True)

class ParkingSession(db.Model):
    __tablename__ = 'parking_sessions'
    
    id = db.Column(db.Integer, primary_key=True)
    vehicle_id = db.Column(db.Integer, db.ForeignKey('vehicles.id'), nullable=False)
    checkin_time = db.Column(db.DateTime, nullable=False)
    checkout_time = db.Column(db.DateTime)
    rfid_code = db.Column(db.String(50))
    image_src = db.Column(db.String(255))
    
    # Relationships
    vehicle = db.relationship('VehicleDB', back_populates='parking_sessions')
    transactions = db.relationship('Transaction', backref='parking_session', lazy=True)

class Transaction(db.Model):
    __tablename__ = 'transactions'
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    session_id = db.Column(db.Integer, db.ForeignKey('parking_sessions.id'), nullable=False)
    amount = db.Column(db.Numeric(10, 2), nullable=False)
    payment_method = db.Column(Enum('cash', 'card', 'e-wallet', name='payment_method_enum'), nullable=False)
    paid_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)

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
    def build(image,license_plate,rfid):
        return {
            "licensePlate": license_plate,
            "entryTime": datetime.now().isoformat(),
            "exitTime": None,
            "imageSrc": image,
            "rfid": rfid,
        }

class User:
    def __init__(self, name, password):
        self.name = name
        self.password = password

    @staticmethod
    def create(name, password):
        return User(name, password)

