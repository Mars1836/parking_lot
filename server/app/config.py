import os

class Config:
    # Database configuration
    SQLALCHEMY_DATABASE_URI = 'sqlite:///parking.db'
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    
    # Image upload configuration
    IMAGE_FOLDER = 'app/static/images'
    
    # Ensure upload folder exists
    @staticmethod
    def init_app(app):
        # Create upload folder if it doesn't exist
        os.makedirs(app.config['IMAGE_FOLDER'], exist_ok=True) 