from flask import Flask 
from flask_cors import CORS 
import pyrebase 
import json 
import os  
from .state.init import init_db
from .models import db

def init_db(db):
    db.create_all()
    print("Database connect")
    return "Database initialized with SQLAlchemy!"
def create_app():     
    # Tạo ứng dụng Flask
    app = Flask(__name__)
    app.config['IMAGE_FOLDER'] = 'app/static/images'
    app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///example.db'
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    db.init_app(app)
    with app.app_context():
        init_db(db)
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
    # init_db(app.config['DB'])
    # Đảm bảo thư mục static tồn tại
    static_path = os.path.join(os.path.dirname(__file__), '..', 'static', 'images')

    # Import routes sau khi tạo app để tránh circular imports
    from .routes import routes
    app.register_blueprint(routes)
    os.makedirs(app.config['IMAGE_FOLDER'], exist_ok=True)

    return app                  