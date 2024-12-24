from flask import request, jsonify, current_app, Blueprint, send_from_directory
from . import create_app
from .service.vehicle import VehicleService, set_door_status, get_door_status
from .models import Vehicle
from .state.init import state
import os
from .utils.index import store_image
from werkzeug.security import generate_password_hash, check_password_hash
from .models import UserDB
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
    status = request.form.get('status')

    # Kiểm tra file có tên không
    if file.filename == '':
        return jsonify({"error": "No selected file"}), 400
    save_path = store_image(file,licensePlate)
    print(save_path)
    vehicle = Vehicle.build(save_path,licensePlate)
    print("vehicle:     ",vehicle)
    VehicleService.handle_vehicle(db,vehicle,status )
    return jsonify({"message": "Vehicle handled successfully"}), 200

