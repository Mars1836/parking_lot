from flask import Flask 
from flask_cors import CORS 
import pyrebase 
import json 
import os  
from .models import db
from flask_migrate import Migrate
from .config import Config
from .service.vehicle import VehicleService
import logging

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

migrate = Migrate()

def create_app():     
    # Tạo ứng dụng Flask
    app = Flask(__name__)
    app.config.from_object(Config)
    app.config['IMAGE_FOLDER'] = 'app/static/images'
    app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///example.db'
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    
    # Ensure instance folder exists
    try:
        os.makedirs(app.instance_path)
    except OSError:
        pass
    
    # Initialize SQLAlchemy and Migrate
    db.init_app(app)
    migrate.init_app(app, db)
    
    # Import and register blueprints
    from .routes import routes
    app.register_blueprint(routes)
    
    # Create tables
    with app.app_context():
        db.create_all()
        print("Database tables created successfully")
    
    # Cấu hình CORS
    CORS(app,supports_credentials=True, resources={r"/*": {"origins": "*"}})      
    if not os.path.exists('static'):
        os.makedirs('static')
    
    # Load Firebase configuration
    config_path = os.path.join(os.path.dirname(__file__), '..', 'config', 'firebaseConfig.json')
    
    # Đọc file cấu hình
    with open(config_path, "r") as config_file:
        firebase_config = json.load(config_file)      

    # Khởi tạo Firebase
    firebase = pyrebase.initialize_app(firebase_config)
    app.config['DB'] = firebase.database() 
    app.config['SQLDB'] = db

    # Đảm bảo thư mục static tồn tại
    static_path = os.path.join(os.path.dirname(__file__), '..', 'static', 'images')
    os.makedirs(app.config['IMAGE_FOLDER'], exist_ok=True)

    # Sync vehicles to Firebase
    with app.app_context():
        try:
            logger.info("Starting initial sync to Firebase...")
            results = VehicleService.sync_vehicles_to_firebase(app.config['DB'])
            logger.info(f"Initial sync completed: {results}")
        except Exception as e:
            logger.error(f"Failed to sync to Firebase: {str(e)}")

    return app                  