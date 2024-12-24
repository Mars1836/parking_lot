# app/models.py
from datetime import datetime
import random
import string
from flask_sqlalchemy import SQLAlchemy
db = SQLAlchemy()   
class UserDB(db.Model):
    __tablename__ = 'users'  # Tên bảng
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)  # Khóa chính
    name = db.Column(db.String(80), nullable=False)  # Tên người dùng
    username = db.Column(db.String(80), nullable=False)
    password = db.Column(db.String(120), unique=True, nullable=False)  # Mật khẩu
    created_at = db.Column(db.DateTime, default=db.func.now())  # Thời gian tạo
    updated_at = db.Column(db.DateTime, default=db.func.now(), onupdate=db.func.now())  
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
class User:
    def __init__(self, name, password):
        self.name = name
        self.password = password

    @staticmethod
    def create(name, password):
        return User(name, password)

