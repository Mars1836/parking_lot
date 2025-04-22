from flask import request, jsonify, current_app, Blueprint, send_from_directory
from . import create_app
from .service.vehicle import VehicleService, set_door_status, get_door_status
from .models import Vehicle, VehicleDB, ParkingSession, Transaction
from .state.init import state
import os
from .utils.index import store_image
from werkzeug.security import generate_password_hash, check_password_hash
from .models import UserDB
from datetime import datetime, timedelta
from sqlalchemy import func

routes = Blueprint('main', __name__)
@routes.route('/test-connection', methods=['GET'])
def test_connection():
    try:
        db = current_app.config['DB']
        test_data = db.get().val()
        return jsonify({"success": True, "data": test_data}), 200
    except Exception as e:
        return jsonify({
            "success": False, 
            "error": str(e),
            "message": "Database connection failed"
        }), 500

# API Tạo User (Signup)
@routes.route('/signup', methods=['POST'])
def signup():
    sqldb = current_app.config['SQLDB']
    data = request.json  # Lấy dữ liệu từ body request
    name = data.get('name')
    username = data.get('username')
    password = data.get('password')

    if not name or not username or not password:
        return jsonify({"error": "Missing required fields"}), 400

    # Kiểm tra username đã tồn tại chưa
    existing_user = UserDB.query.filter_by(username=username).first()
    if existing_user:
        return jsonify({"error": "Username already exists"}), 400

    # Mã hóa mật khẩu trước khi lưu
    hashed_password = generate_password_hash(password)

    # Tạo user mới
    new_user = UserDB(name=name, username=username, password=hashed_password)
    sqldb.session.add(new_user)
    sqldb.session.commit()

    return jsonify({"message": "User created successfully!"}), 201
@routes.route('/login', methods=['POST'])
def login():
    sqldb = current_app.config['SQLDB']
    data = request.json  # Lấy dữ liệu từ body request
    username = data.get('username')
    password = data.get('password')

    if not username or not password:
        return jsonify({"error": "Missing required fields"}), 400

    # Tìm user theo username
    user = UserDB.query.filter_by(username=username).first()

    if not user or not check_password_hash(user.password, password):
        return jsonify({"error": "Invalid username or password"}), 401

    # Trả về thông báo đăng nhập thành công
    return jsonify({
        "message": "Login successful!",
        "user": {
            "id": user.id,
            "name": user.name,
            "username": user.username,
            "role": user.role,
            "created_at": user.created_at
        }
    }), 200
@routes.route('/vehicle', methods=['POST'])
def simulate_add_vehicle():
    try:
        db = current_app.config['DB']
        vehicle = Vehicle.create()
        
        VehicleService.add_new_vehicle(db,vehicle)
        
        return jsonify({
            "message": "Vehicle added successfully", 
            "data": vehicle
        }), 200
    except Exception as e:
        return jsonify({
            "error": "Vehicle addition failed", 
            "details": str(e)
        }), 500
@routes.route('/vehicle/exit', methods=['POST'])
def simulate_exit_vehicle():
    data = request.json
    db = current_app.config['DB']
    VehicleService.handle_vehicle_exit(db,data['licensePlate'])
    return jsonify({"message": "Vehicle exited successfully"}), 200

@routes.route('/toggle-door1', methods=['POST'])
def toggle_door1():
    db = current_app.config['DB']
    if (set_door_status(db, "door1", not state['door1']['isOpen'])):
        state['door1']['isOpen'] = not state['door1']['isOpen']
        return jsonify({"message": "Door 1 toggled successfully"}), 200
    else:
        return jsonify({"message": "Door 1 toggled failed"}), 500

@routes.route('/toggle-door2', methods=['POST'])
def toggle_door2():
    db = current_app.config['DB']
    print(state['door2']['isOpen'])
    if (set_door_status(db, "door2", not state ['door2']['isOpen'])):
        state['door2']['isOpen'] = not state['door2']['isOpen']
        return jsonify({"message": "Door 2 toggled successfully"}), 200
    else:
        return jsonify({"message": "Door 2 toggled failed"}), 500
@routes.route('/upload', methods=['POST'])
def upload_file():
    # Kiểm tra xem có file trong request không
    db = current_app.config['DB']
    if 'image' not in request.files:
        return jsonify({"error": "No file part"}), 400
    
    file = request.files['image']
    
    # Kiểm tra file có tên không
    if file.filename == '':
        return jsonify({"error": "No selected file"}), 400
    
    # Lưu file vào thư mục static/uploads
    save_path = os.path.join(current_app.config['IMAGE_FOLDER'], file.filename)
    file.save(save_path)
    licensePlate = request.form.get('licensePlate')
    status = request.form.get('status')
    VehicleService.set_image_src_last_scan(db,save_path,licensePlate,status)
    # Trả về đường dẫn file đã lưu
    return jsonify({"message": "File uploaded successfully", "path": save_path}), 200
@routes.route('/vehicle/handle', methods=['POST'])
def handle_vehicle():
    db = current_app.config['DB']
    # Kiểm tra file trong request
    if 'image' not in request.files:
        return jsonify({"error": "No file part"}), 400

    file = request.files['image']
    licensePlate = request.form.get('licensePlate')
    rfid = request.form.get('rfid')
    status = request.form.get('status')

    # Kiểm tra file có tên không
    if file.filename == '':
        return jsonify({"error": "No selected file"}), 400
    save_path = store_image(file,licensePlate)
    print(save_path)
    vehicle = Vehicle.build(save_path,licensePlate,rfid)
    print("vehicle:     ",vehicle)
    VehicleService.handle_vehicle(db,vehicle,status )
    return jsonify({"message": "Vehicle handled successfully"}), 200

@routes.route('/vehicles', methods=['GET'])
def get_vehicles():
    sqldb = current_app.config['SQLDB']
    try:
        vehicles = VehicleDB.query.all()
        result = [{
            'id': v.id,
            'plate_number': v.plate_number,
            'total_visits': len(v.parking_sessions),
            'last_visit': max([s.checkin_time for s in v.parking_sessions]) if v.parking_sessions else None
        } for v in vehicles]
        return jsonify(result), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@routes.route('/parking-sessions', methods=['GET'])
def get_parking_sessions():
    sqldb = current_app.config['SQLDB']
    try:
        # Get query parameters
        vehicle_id = request.args.get('vehicle_id')
        start_date = request.args.get('start_date')
        end_date = request.args.get('end_date')
        
        # Build query
        query = ParkingSession.query.join(VehicleDB)
        
        if vehicle_id:
            query = query.filter_by(vehicle_id=vehicle_id)
        
        if start_date:
            try:
                start_date = datetime.strptime(start_date, '%Y-%m-%d')
                query = query.filter(ParkingSession.checkin_time >= start_date)
            except ValueError:
                return jsonify({"error": "Invalid start_date format. Use YYYY-MM-DD"}), 400
        
        if end_date:
            try:
                end_date = datetime.strptime(end_date, '%Y-%m-%d')
                query = query.filter(ParkingSession.checkin_time <= end_date)
            except ValueError:
                return jsonify({"error": "Invalid end_date format. Use YYYY-MM-DD"}), 400
        
        sessions = query.order_by(ParkingSession.checkin_time.desc()).all()
        
        result = []
        for s in sessions:
            try:
                session_data = {
                    'id': s.id,
                    'vehicle_id': s.vehicle_id,
                    'plate_number': s.vehicle.plate_number,
                    'checkin_time': s.checkin_time.isoformat(),
                    'checkout_time': s.checkout_time.isoformat() if s.checkout_time else None,
                    'duration_hours': ((s.checkout_time - s.checkin_time).total_seconds() / 3600) if s.checkout_time else None,
                    'rfid_code': s.rfid_code,
                    'image_src': s.image_src
                }
                result.append(session_data)
            except Exception as e:
                print(f"Error processing session {s.id}: {str(e)}")
                continue
        
        return jsonify(result), 200
    except Exception as e:
        print(f"Error in get_parking_sessions: {str(e)}")
        return jsonify({"error": str(e)}), 500

@routes.route('/transactions', methods=['GET'])
def get_transactions():
    sqldb = current_app.config['SQLDB']
    try:
        # Get query parameters
        session_id = request.args.get('session_id')
        start_date = request.args.get('start_date')
        end_date = request.args.get('end_date')
        payment_method = request.args.get('payment_method')
        
        # Build query
        query = Transaction.query.join(ParkingSession).join(VehicleDB)
        
        if session_id:
            query = query.filter_by(session_id=session_id)
        
        if payment_method:
            query = query.filter_by(payment_method=payment_method)
        
        if start_date:
            start_date = datetime.strptime(start_date, '%Y-%m-%d')
            query = query.filter(Transaction.paid_at >= start_date)
        
        if end_date:
            end_date = datetime.strptime(end_date, '%Y-%m-%d')
            # Thêm 1 ngày vào end_date để bao gồm cả ngày cuối
            end_date = end_date + timedelta(days=1)
            query = query.filter(Transaction.paid_at < end_date)
        
        transactions = query.order_by(Transaction.paid_at.desc()).all()
        
        result = [{
            'id': t.id,
            'session_id': t.session_id,
            'plate_number': t.parking_session.vehicle.plate_number,
            'amount': float(t.amount),
            'payment_method': t.payment_method,
            'paid_at': t.paid_at.isoformat()
        } for t in transactions]
        
        return jsonify(result), 200
    except Exception as e:
        print(f"Error in get_transactions: {str(e)}")  # Thêm log lỗi
        return jsonify({"error": str(e)}), 500

@routes.route('/api/vehicles/summary', methods=['GET'])
def get_vehicles_summary():
    sqldb = current_app.config['SQLDB']
    try:
        # Get all vehicles with their active status
        vehicles = VehicleDB.query.all()
        result = []
        
        for v in vehicles:
            # Get total parking count
            total_visits = len(v.parking_sessions)
            
            # Get last session
            last_session = ParkingSession.query.filter_by(vehicle_id=v.id)\
                .order_by(ParkingSession.checkin_time.desc()).first()
            
            # Calculate time since last entry
            time_since = None
            if last_session:
                time_diff = datetime.utcnow() - last_session.checkin_time
                if time_diff.days > 0:
                    time_since = f"{time_diff.days} days ago"
                elif time_diff.seconds > 3600:
                    time_since = f"{time_diff.seconds // 3600} hours ago"
                else:
                    time_since = f"{time_diff.seconds // 60} minutes ago"
            
            # Check if currently parked
            status = "in" if last_session and not last_session.checkout_time else "out"
            
            result.append({
                'id': f"V{v.id:03d}",
                'plate_number': v.plate_number,
                'parking_count': total_visits,
                'last_entry': last_session.checkin_time.isoformat() if last_session else None,
                'time_since': time_since,
                'status': status
            })
        
        return jsonify(result), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@routes.route('/api/vehicles/<int:vehicle_id>/history', methods=['GET'])
def get_vehicle_history(vehicle_id):
    sqldb = current_app.config['SQLDB']
    try:
        # Get all parking sessions for the vehicle
        sessions = ParkingSession.query.filter_by(vehicle_id=vehicle_id)\
            .order_by(ParkingSession.checkin_time.desc()).all()
        
        result = []
        for s in sessions:
            duration = None
            if s.checkout_time:
                duration_hours = (s.checkout_time - s.checkin_time).total_seconds() / 3600
                duration = f"{duration_hours:.1f} hours"
            
            result.append({
                'id': f"PS{vehicle_id:03d}{s.id}",
                'entry_time': s.checkin_time.isoformat(),
                'exit_time': s.checkout_time.isoformat() if s.checkout_time else None,
                'duration': duration or "Current session",
            })
        
        return jsonify(result), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@routes.route('/api/vehicles/export', methods=['GET'])
def export_vehicles():
    sqldb = current_app.config['SQLDB']
    try:
        # Get all vehicles with their sessions
        vehicles = VehicleDB.query.all()
        result = []
        
        for v in vehicles:
            vehicle_data = {
                'id': v.id,
                'plate_number': v.plate_number,
                'total_visits': len(v.parking_sessions),
                'sessions': []
            }
            
            for s in v.parking_sessions:
                session_data = {
                    'checkin_time': s.checkin_time.isoformat(),
                    'checkout_time': s.checkout_time.isoformat() if s.checkout_time else None,
                    'fee': float(s.fee) if s.fee else None,
                    'transactions': []
                }
                
                for t in s.transactions:
                    session_data['transactions'].append({
                        'amount': float(t.amount),
                        'payment_method': t.payment_method,
                        'paid_at': t.paid_at.isoformat()
                    })
                
                vehicle_data['sessions'].append(session_data)
            
            result.append(vehicle_data)
        
        return jsonify(result), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@routes.route('/api/users', methods=['GET'])
def get_users():
    sqldb = current_app.config['SQLDB']
    try:
        users = sqldb.session.query(UserDB).all()
        result = []
        for u in users:
            # Đảm bảo role là viết thường
            role = u.role.lower() if u.role else 'security'
            if role not in ['admin', 'security']:
                role = 'security'  # Mặc định là security nếu role không hợp lệ
            
            result.append({
                'id': f"U{u.id:03d}",
                'name': u.name,
                'username': u.username,
                'role': role,
                'status': 'active',
                'created_at': u.created_at.strftime('%Y-%m-%d') if u.created_at else None
            })
        return jsonify(result), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@routes.route('/api/users', methods=['POST'])
def create_user():
    sqldb = current_app.config['SQLDB']
    try:
        data = request.json
        name = data.get('name')
        username = data.get('username')
        password = data.get('password')
        role = data.get('role', 'security')  # Mặc định là security (viết thường)

        # Kiểm tra các trường bắt buộc
        if not all([name, username, password]):
            return jsonify({"error": "Missing required fields"}), 400

        # Kiểm tra username đã tồn tại chưa
        existing_user = sqldb.session.query(UserDB).filter_by(username=username).first()
        if existing_user:
            return jsonify({"error": "Username already exists"}), 400

        # Đảm bảo role là viết thường
        role = role.lower()
        if role not in ['admin', 'security']:
            return jsonify({"error": "Invalid role. Must be either 'admin' or 'security'"}), 400

        # Tạo user mới
        new_user = UserDB(
            name=name,
            username=username,
            password=generate_password_hash(password),
            role=role
        )
        sqldb.session.add(new_user)
        sqldb.session.commit()

        return jsonify({
            "message": "User created successfully",
            "user": {
                'id': f"U{new_user.id:03d}",
                'name': new_user.name,
                'username': new_user.username,
                'role': new_user.role,
                'status': 'active',
                'created_at': new_user.created_at.strftime('%Y-%m-%d') if new_user.created_at else None
            }
        }), 201

    except Exception as e:
        sqldb.session.rollback()
        return jsonify({"error": str(e)}), 500

@routes.route('/api/price', methods=['POST'])
def update_price():
    try:
        db = current_app.config['DB']
        data = request.json
        price = data.get('price')
        
        if price is None:
            return jsonify({"error": "Price is required"}), 400
            
        # Update price in Firebase
        db.child("price").set(price)
        
        return jsonify({
            "message": "Price updated successfully",
            "price": price
        }), 200
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@routes.route('/api/stats/parking', methods=['GET'])
def get_parking_stats():
    sqldb = current_app.config['SQLDB']
    try:
        # Get query parameters
        start_date = request.args.get('start_date')
        end_date = request.args.get('end_date')
        time_range = request.args.get('time_range', 'day')  # day, week, month
        
        # Build query
        query = ParkingSession.query
        
        if start_date:
            start_date = datetime.strptime(start_date, '%Y-%m-%d')
            query = query.filter(ParkingSession.checkin_time >= start_date)
        
        if end_date:
            end_date = datetime.strptime(end_date, '%Y-%m-%d')
            end_date = end_date + timedelta(days=1)
            query = query.filter(ParkingSession.checkin_time < end_date)
        
        result = []
        
        if time_range == 'day':
            # Group by hour
            for hour in range(24):
                hour_start = start_date.replace(hour=hour, minute=0, second=0, microsecond=0)
                hour_end = hour_start + timedelta(hours=1)
                
                entries = query.filter(
                    ParkingSession.checkin_time >= hour_start,
                    ParkingSession.checkin_time < hour_end
                ).count()
                
                exits = query.filter(
                    ParkingSession.checkout_time >= hour_start,
                    ParkingSession.checkout_time < hour_end
                ).count()
                
                result.append({
                    'hour': f"{hour:02d}:00",
                    'entries': entries,
                    'exits': exits
                })
        
        elif time_range == 'week':
            # Group by day of week
            days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
            for i, day in enumerate(days):
                day_start = start_date + timedelta(days=i)
                day_end = day_start + timedelta(days=1)
                
                entries = query.filter(
                    ParkingSession.checkin_time >= day_start,
                    ParkingSession.checkin_time < day_end
                ).count()
                
                exits = query.filter(
                    ParkingSession.checkout_time >= day_start,
                    ParkingSession.checkout_time < day_end
                ).count()
                
                result.append({
                    'hour': day,
                    'entries': entries,
                    'exits': exits
                })
        
        else:  # month
            # Group by day of month
            days_in_month = (end_date - start_date).days
            for day in range(days_in_month):
                day_start = start_date + timedelta(days=day)
                day_end = day_start + timedelta(days=1)
                
                entries = query.filter(
                    ParkingSession.checkin_time >= day_start,
                    ParkingSession.checkin_time < day_end
                ).count()
                
                exits = query.filter(
                    ParkingSession.checkout_time >= day_start,
                    ParkingSession.checkout_time < day_end
                ).count()
                
                result.append({
                    'hour': f"{day + 1}",
                    'entries': entries,
                    'exits': exits
                })
        
        return jsonify(result), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@routes.route('/api/stats/revenue', methods=['GET'])
def get_revenue_stats():
    sqldb = current_app.config['SQLDB']
    try:
        # Get query parameters
        start_date = request.args.get('start_date')
        end_date = request.args.get('end_date')
        time_range = request.args.get('time_range', 'day')  # day, week, month
        
        # Build query
        query = Transaction.query
        
        if start_date:
            start_date = datetime.strptime(start_date, '%Y-%m-%d')
            query = query.filter(Transaction.paid_at >= start_date)
        
        if end_date:
            end_date = datetime.strptime(end_date, '%Y-%m-%d')
            end_date = end_date + timedelta(days=1)
            query = query.filter(Transaction.paid_at < end_date)
        
        result = []
        
        if time_range == 'day':
            # Group by hour
            for hour in range(24):
                hour_start = start_date.replace(hour=hour, minute=0, second=0, microsecond=0)
                hour_end = hour_start + timedelta(hours=1)
                
                revenue = query.filter(
                    Transaction.paid_at >= hour_start,
                    Transaction.paid_at < hour_end
                ).with_entities(func.sum(Transaction.amount)).scalar() or 0
                
                result.append({
                    'name': f"{hour:02d}:00",
                    'revenue': float(revenue)
                })
        
        elif time_range == 'week':
            # Group by day of week
            days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
            for i, day in enumerate(days):
                day_start = start_date + timedelta(days=i)
                day_end = day_start + timedelta(days=1)
                
                revenue = query.filter(
                    Transaction.paid_at >= day_start,
                    Transaction.paid_at < day_end
                ).with_entities(func.sum(Transaction.amount)).scalar() or 0
                
                result.append({
                    'name': day,
                    'revenue': float(revenue)
                })
        
        else:  # month
            # Group by day of month
            days_in_month = (end_date - start_date).days
            for day in range(days_in_month):
                day_start = start_date + timedelta(days=day)
                day_end = day_start + timedelta(days=1)
                
                revenue = query.filter(
                    Transaction.paid_at >= day_start,
                    Transaction.paid_at < day_end
                ).with_entities(func.sum(Transaction.amount)).scalar() or 0
                
                result.append({
                    'name': f"{day + 1}",
                    'revenue': float(revenue)
                })
        
        return jsonify(result), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

