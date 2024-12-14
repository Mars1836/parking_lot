from flask import request, jsonify, current_app, Blueprint, send_from_directory
from . import create_app
from .service.vehicle import VehicleService, set_door_status, get_door_status
from .models import Vehicle
from .state.init import state
import os

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

@routes.route('/vehicle/<license_plate>', methods=['POST'])
def scan_vehicle_success_api(license_plate):
    db = current_app.config['DB']
    success = VehicleService.handle_vehicle_scan(db, license_plate)
    
    if success:
        return jsonify({"message": "Vehicle scanned successfully"}), 200
    else:
        return jsonify({
            "message": "Vehicle scanning failed", 
            "error": "Internal processing error"
        }), 500

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
    if 'image' not in request.files:
        return jsonify({"error": "No file part"}), 400
    
    file = request.files['image']
    
    # Kiểm tra file có tên không
    if file.filename == '':
        return jsonify({"error": "No selected file"}), 400

    # Lưu file vào thư mục static/uploads
    save_path = os.path.join(current_app.config['IMAGE_FOLDER'], file.filename)
    file.save(save_path)

    # Trả về đường dẫn file đã lưu
    return jsonify({"message": "File uploaded successfully", "path": save_path}), 200
