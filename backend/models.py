from flask_sqlalchemy import SQLAlchemy
from datetime import datetime

db = SQLAlchemy()

class Cattle(db.Model):
    __tablename__ = 'cattle'
    
    id = db.Column(db.Integer, primary_key=True)
    tag_id = db.Column(db.String(50), unique=True, nullable=False, index=True)
    name = db.Column(db.String(100), nullable=True)
    breed = db.Column(db.String(100), nullable=False)
    dob = db.Column(db.Date, nullable=False)
    gender = db.Column(db.String(10), nullable=False, default='Cow') # 'Cow' or 'Bull'
    status = db.Column(db.String(50), nullable=False, default='Milking') # 'Milking', 'Dry', 'Pregnant', 'Sick', 'Calf', 'Bull'
    notes = db.Column(db.Text, nullable=True)
    
    # Relationships
    milk_records = db.relationship('MilkRecord', backref='cattle', cascade='all, delete-orphan', lazy=True)
    breeding_records = db.relationship('BreedingRecord', backref='cattle', cascade='all, delete-orphan', lazy=True)
    health_records = db.relationship('HealthRecord', backref='cattle', cascade='all, delete-orphan', lazy=True)
    
    def to_dict(self):
        return {
            'id': self.id,
            'tag_id': self.tag_id,
            'name': self.name,
            'breed': self.breed,
            'dob': self.dob.isoformat() if self.dob else None,
            'gender': self.gender,
            'status': self.status,
            'notes': self.notes
        }

class MilkRecord(db.Model):
    __tablename__ = 'milk_records'
    
    id = db.Column(db.Integer, primary_key=True)
    cattle_id = db.Column(db.Integer, db.ForeignKey('cattle.id'), nullable=True) # Nullable for collective farm logs
    date = db.Column(db.Date, nullable=False, default=datetime.utcnow)
    session = db.Column(db.String(20), nullable=False) # 'Morning' or 'Evening'
    quantity = db.Column(db.Float, nullable=False) # in Liters
    fat_percentage = db.Column(db.Float, nullable=True)
    snf_percentage = db.Column(db.Float, nullable=True)
    price_per_liter = db.Column(db.Float, nullable=True)
    
    def to_dict(self):
        return {
            'id': self.id,
            'cattle_id': self.cattle_id,
            'cattle_tag': self.cattle.tag_id if self.cattle else 'General Farm',
            'date': self.date.isoformat() if self.date else None,
            'session': self.session,
            'quantity': self.quantity,
            'fat_percentage': self.fat_percentage,
            'snf_percentage': self.snf_percentage,
            'price_per_liter': self.price_per_liter,
            'total_price': round(self.quantity * (self.price_per_liter or 0), 2) if self.price_per_liter else 0
        }

class BreedingRecord(db.Model):
    __tablename__ = 'breeding_records'
    
    id = db.Column(db.Integer, primary_key=True)
    cattle_id = db.Column(db.Integer, db.ForeignKey('cattle.id'), nullable=False)
    insemination_date = db.Column(db.Date, nullable=False)
    breeding_method = db.Column(db.String(50), nullable=False, default='Artificial Insemination') # 'Artificial Insemination', 'Natural Service'
    sire_id = db.Column(db.String(100), nullable=True) # Bull tag/breed info
    pregnancy_check_date = db.Column(db.Date, nullable=True)
    pregnancy_status = db.Column(db.String(50), nullable=False, default='Pending') # 'Pending', 'Positive', 'Negative'
    expected_calving_date = db.Column(db.Date, nullable=True)
    actual_calving_date = db.Column(db.Date, nullable=True)
    notes = db.Column(db.Text, nullable=True)
    
    def to_dict(self):
        return {
            'id': self.id,
            'cattle_id': self.cattle_id,
            'cattle_tag': self.cattle.tag_id if self.cattle else '',
            'insemination_date': self.insemination_date.isoformat() if self.insemination_date else None,
            'breeding_method': self.breeding_method,
            'sire_id': self.sire_id,
            'pregnancy_check_date': self.pregnancy_check_date.isoformat() if self.pregnancy_check_date else None,
            'pregnancy_status': self.pregnancy_status,
            'expected_calving_date': self.expected_calving_date.isoformat() if self.expected_calving_date else None,
            'actual_calving_date': self.actual_calving_date.isoformat() if self.actual_calving_date else None,
            'notes': self.notes
        }

class HealthRecord(db.Model):
    __tablename__ = 'health_records'
    
    id = db.Column(db.Integer, primary_key=True)
    cattle_id = db.Column(db.Integer, db.ForeignKey('cattle.id'), nullable=False)
    record_type = db.Column(db.String(50), nullable=False) # 'Vaccination', 'Deworming', 'Treatment', 'Vet Visit'
    date = db.Column(db.Date, nullable=False, default=datetime.utcnow)
    details = db.Column(db.String(255), nullable=False)
    cost = db.Column(db.Float, nullable=False, default=0.0)
    next_due_date = db.Column(db.Date, nullable=True)
    
    def to_dict(self):
        return {
            'id': self.id,
            'cattle_id': self.cattle_id,
            'cattle_tag': self.cattle.tag_id if self.cattle else '',
            'record_type': self.record_type,
            'date': self.date.isoformat() if self.date else None,
            'details': self.details,
            'cost': self.cost,
            'next_due_date': self.next_due_date.isoformat() if self.next_due_date else None
        }

class FeedInventory(db.Model):
    __tablename__ = 'feed_inventory'
    
    id = db.Column(db.Integer, primary_key=True)
    feed_name = db.Column(db.String(100), unique=True, nullable=False)
    quantity_kg = db.Column(db.Float, nullable=False, default=0.0)
    reorder_level_kg = db.Column(db.Float, nullable=False, default=100.0)
    unit_cost_per_kg = db.Column(db.Float, nullable=False, default=0.0)
    
    logs = db.relationship('FeedLog', backref='feed_item', cascade='all, delete-orphan', lazy=True)
    
    def to_dict(self):
        return {
            'id': self.id,
            'feed_name': self.feed_name,
            'quantity_kg': self.quantity_kg,
            'reorder_level_kg': self.reorder_level_kg,
            'unit_cost_per_kg': self.unit_cost_per_kg
        }

class FeedLog(db.Model):
    __tablename__ = 'feed_logs'
    
    id = db.Column(db.Integer, primary_key=True)
    feed_id = db.Column(db.Integer, db.ForeignKey('feed_inventory.id'), nullable=False)
    date = db.Column(db.Date, nullable=False, default=datetime.utcnow)
    quantity_used_kg = db.Column(db.Float, nullable=False)
    group_fed = db.Column(db.String(100), nullable=False) # 'Milking Herd', 'Calves', 'Dry Cows', 'Pregnant Cows', 'All'
    
    def to_dict(self):
        return {
            'id': self.id,
            'feed_id': self.feed_id,
            'feed_name': self.feed_item.feed_name if self.feed_item else '',
            'date': self.date.isoformat() if self.date else None,
            'quantity_used_kg': self.quantity_used_kg,
            'group_fed': self.group_fed
        }

class FinancialRecord(db.Model):
    __tablename__ = 'financial_records'
    
    id = db.Column(db.Integer, primary_key=True)
    date = db.Column(db.Date, nullable=False, default=datetime.utcnow)
    type = db.Column(db.String(10), nullable=False) # 'Income' or 'Expense'
    category = db.Column(db.String(100), nullable=False) # 'Milk Sale', 'Cattle Sale', 'Feed Purchase', 'Veterinary', 'Labor', 'Utilities', 'Other'
    amount = db.Column(db.Float, nullable=False)
    description = db.Column(db.Text, nullable=True)
    
    def to_dict(self):
        return {
            'id': self.id,
            'date': self.date.isoformat() if self.date else None,
            'type': self.type,
            'category': self.category,
            'amount': self.amount,
            'description': self.description
        }
