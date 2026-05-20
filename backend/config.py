import os

class Config:
    SECRET_KEY = os.environ.get('SECRET_KEY') or 'dairy-farm-management-super-secret-key-12345'
    
    # Path to SQLite DB file
    BASE_DIR = os.path.abspath(os.path.dirname(__file__))
    SQLALCHEMY_DATABASE_URI = 'sqlite:///' + os.path.join(BASE_DIR, 'dairy_farm.db')
    SQLALCHEMY_TRACK_MODIFICATIONS = False
