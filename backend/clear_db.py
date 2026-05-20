from app import app
from models import db

def clear_database():
    print("Clearing all tables in the database...")
    db.drop_all()
    db.create_all()
    print("Database cleared. All tables recreated empty and ready for fresh logging.")

if __name__ == '__main__':
    with app.app_context():
        clear_database()
