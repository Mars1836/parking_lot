from app import create_app
from app.models import UserDB, VehicleDB, ParkingSession, Transaction, db
from datetime import datetime, timedelta
import random
from werkzeug.security import generate_password_hash

def create_sample_vehicles():
    """Tạo dữ liệu mẫu cho bảng vehicles"""
    sample_plates = [
        "51F-123.45", "51F-678.90", "51F-246.80",
        "51F-135.79", "51F-864.20", "51F-975.31",
        "51F-642.13", "51F-357.91", "51F-468.02",
        "51F-579.13", "51F-123.46", "51F-678.91",
        "51F-246.81", "51F-135.80", "51F-864.21",
        "51F-975.32", "51F-642.14", "51F-357.92",
        "51F-468.03", "51F-579.14"
    ]
    
    for plate in sample_plates:
        vehicle = VehicleDB.query.filter_by(plate_number=plate).first()
        if not vehicle:
            vehicle = VehicleDB(plate_number=plate)
            db.session.add(vehicle)
            print(f"Created vehicle: {plate}")
    
    db.session.commit()

def create_sample_parking_sessions():
    """Tạo dữ liệu mẫu cho bảng parking_sessions và transactions"""
    vehicles = VehicleDB.query.all()
    payment_methods = ['cash', 'card', 'e-wallet']
    
    # Lấy ngày đầu tháng và cuối tháng trước
    today = datetime.utcnow()
    first_day_prev_month = (today.replace(day=1) - timedelta(days=1)).replace(day=1)
    last_day_prev_month = today.replace(day=1) - timedelta(days=1)
    
    for vehicle in vehicles:
        # Tạo 5-8 phiên đỗ xe cho mỗi xe trong tháng trước
        num_sessions = random.randint(5, 8)
        
        for i in range(num_sessions):
            # Tạo thời gian checkin ngẫu nhiên trong tháng trước
            checkin_time = first_day_prev_month + timedelta(
                days=random.randint(0, (last_day_prev_month - first_day_prev_month).days),
                hours=random.randint(0, 23),
                minutes=random.randint(0, 59)
            )
            
            # Thời gian đỗ từ 1-12 tiếng
            duration = timedelta(hours=random.randint(1, 12))
            checkout_time = checkin_time + duration
            
            session = ParkingSession(
                vehicle_id=vehicle.id,
                checkin_time=checkin_time,
                checkout_time=checkout_time,
                rfid_code=f"RFID{random.randint(1000, 9999)}",
                image_src=f"/static/images/{vehicle.plate_number.replace('.', '_')}.jpg"
            )
            db.session.add(session)
            db.session.flush()  # Lưu session để có ID
            print(f"Created parking session for {vehicle.plate_number}")
            
            # Tạo transaction cho mỗi phiên
            amount = 1.00
            payment_method = random.choice(payment_methods)
            transaction = Transaction(
                session_id=session.id,
                amount=amount,
                payment_method=payment_method,
                paid_at=checkout_time + timedelta(minutes=random.randint(1, 30))
            )
            db.session.add(transaction)
            print(f"Created transaction for session {session.id}: ${amount} via {payment_method}")
    
    db.session.commit()

def create_default_users():
    """Tạo tài khoản mặc định cho admin và bảo vệ"""
    try:
        # Tạo tài khoản admin
        admin = UserDB.query.filter_by(username='admin').first()
        if not admin:
            admin = UserDB(
                name='Administrator',
                username='admin',
                password=generate_password_hash('admin123'),
                role='admin'
            )
            db.session.add(admin)
            print("Created default admin account")

        # Tạo tài khoản bảo vệ
        security = UserDB.query.filter_by(username='security').first()
        if not security:
            security = UserDB(
                name='Security Guard',
                username='security',
                password=generate_password_hash('security123'),
                role='security'
            )
            db.session.add(security)
            print("Created default security account")

        db.session.commit()
        print("Successfully created default user accounts")
    except Exception as e:
        print(f"Error creating default users: {e}")
        db.session.rollback()

def create_data():
    app = create_app()
    with app.app_context():
        # Tạo users mặc định
        create_default_users()
        
        # Tạo vehicles mẫu
        create_sample_vehicles()
        
        # Tạo parking sessions và transactions mẫu
        create_sample_parking_sessions()
        
        print("Successfully created all sample data")

if __name__ == '__main__':
    create_data() 