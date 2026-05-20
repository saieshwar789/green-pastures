from flask import Flask, jsonify, request
from flask_cors import CORS
from datetime import datetime, timedelta
import logging

from config import Config
from models import db, Cattle, MilkRecord, BreedingRecord, HealthRecord, FeedInventory, FeedLog, FinancialRecord

app = Flask(__name__)
app.config.from_object(Config)
CORS(app)

db.init_app(app)

# Helper to parse dates
def parse_date(date_str):
    if not date_str:
        return None
    try:
        if isinstance(date_str, str):
            return datetime.strptime(date_str.split('T')[0], "%Y-%m-%d").date()
        return date_str
    except (ValueError, TypeError):
        return None

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Create tables if they do not exist
with app.app_context():
    db.create_all()

@app.route('/')
def api_status():
    return jsonify({
        'status': 'healthy',
        'app': 'GreenPastures Dairy Management Backend API'
    }), 200

# --- DASHBOARD ENDPOINTS ---
@app.route('/api/dashboard/stats', methods=['GET'])
def get_dashboard_stats():
    try:
        today = datetime.utcnow().date()
        start_of_month = today.replace(day=1)
        
        # 1. Herd metrics
        total_cattle = Cattle.query.count()
        milking_cows = Cattle.query.filter_by(status='Milking').count()
        pregnant_cows = Cattle.query.filter_by(status='Pregnant').count()
        sick_cows = Cattle.query.filter_by(status='Sick').count()
        dry_cows = Cattle.query.filter_by(status='Dry').count()
        calves = Cattle.query.filter_by(status='Calf').count()
        
        # 2. Milk production today
        today_milk_records = MilkRecord.query.filter_by(date=today).all()
        today_milk_total = sum(r.quantity for r in today_milk_records)
        today_milk_morning = sum(r.quantity for r in today_milk_records if r.session.lower() == 'morning')
        today_milk_evening = sum(r.quantity for r in today_milk_records if r.session.lower() == 'evening')
        
        # 3. Milk production trend (Last 7 days)
        milk_trend = []
        for i in range(6, -1, -1):
            day = today - timedelta(days=i)
            day_records = MilkRecord.query.filter_by(date=day).all()
            qty = sum(r.quantity for r in day_records)
            milk_trend.append({
                'date': day.strftime('%a'),
                'full_date': day.isoformat(),
                'quantity': qty
            })
            
        # 4. Feed stock status
        feed_items = FeedInventory.query.all()
        feed_status = []
        low_feed_count = 0
        for item in feed_items:
            is_low = item.quantity_kg <= item.reorder_level_kg
            if is_low:
                low_feed_count += 1
            feed_status.append({
                'id': item.id,
                'name': item.feed_name,
                'stock': item.quantity_kg,
                'reorder_level': item.reorder_level_kg,
                'is_low': is_low
            })
            
        # 5. Financial Summary (Current Month)
        income_records = FinancialRecord.query.filter(FinancialRecord.date >= start_of_month, FinancialRecord.type == 'Income').all()
        expense_records = FinancialRecord.query.filter(FinancialRecord.date >= start_of_month, FinancialRecord.type == 'Expense').all()
        
        total_income = sum(r.amount for r in income_records)
        total_expense = sum(r.amount for r in expense_records)
        net_profit = total_income - total_expense
        
        # 6. Action Center / Reminders
        reminders = []
        
        # 6a. Low feed reminders
        for item in feed_status:
            if item['is_low']:
                reminders.append({
                    'type': 'danger',
                    'category': 'Feed Alert',
                    'message': f"Feed inventory for '{item['name']}' is low ({item['stock']:.1f} kg left). Please reorder.",
                    'date': today.isoformat()
                })
                
        # 6b. Breeding reminders (Pregnancy checks due - inseminated > 45 days ago, status Pending)
        pending_checks = BreedingRecord.query.filter_by(pregnancy_status='Pending').all()
        for record in pending_checks:
            due_check_date = record.insemination_date + timedelta(days=45)
            if due_check_date <= today + timedelta(days=7):
                urgency = 'danger' if due_check_date <= today else 'warning'
                reminders.append({
                    'type': urgency,
                    'category': 'Pregnancy Check',
                    'message': f"Cattle {record.cattle.tag_id} is due for a pregnancy check (Inseminated {record.insemination_date.isoformat()}).",
                    'date': due_check_date.isoformat()
                })
                
        # 6c. Breeding reminders (Expected Calving within next 14 days)
        upcoming_calvings = BreedingRecord.query.filter(
            BreedingRecord.pregnancy_status == 'Positive',
            BreedingRecord.expected_calving_date >= today,
            BreedingRecord.expected_calving_date <= today + timedelta(days=14),
            BreedingRecord.actual_calving_date == None
        ).all()
        for record in upcoming_calvings:
            reminders.append({
                'type': 'warning',
                'category': 'Calving Due',
                'message': f"Pregnant Cattle {record.cattle.tag_id} is due to calve on {record.expected_calving_date.isoformat()}.",
                'date': record.expected_calving_date.isoformat()
            })
            
        # 6d. Health record reminders (vaccines due within next 7 days)
        upcoming_health = HealthRecord.query.filter(
            HealthRecord.next_due_date >= today,
            HealthRecord.next_due_date <= today + timedelta(days=7)
        ).all()
        for record in upcoming_health:
            reminders.append({
                'type': 'info',
                'category': 'Health / Vet Due',
                'message': f"Cattle {record.cattle.tag_id} is due for a follow-up/booster of '{record.details}'.",
                'date': record.next_due_date.isoformat()
            })
            
        # Sort reminders by urgency (danger, warning, info)
        urgency_order = {'danger': 0, 'warning': 1, 'info': 2}
        reminders.sort(key=lambda x: urgency_order.get(x['type'], 3))
        
        return jsonify({
            'herd': {
                'total': total_cattle,
                'milking': milking_cows,
                'pregnant': pregnant_cows,
                'sick': sick_cows,
                'dry': dry_cows,
                'calf': calves
            },
            'milk_today': {
                'total': today_milk_total,
                'morning': today_milk_morning,
                'evening': today_milk_evening
            },
            'milk_trend': milk_trend,
            'feed': feed_status,
            'low_feed_count': low_feed_count,
            'finance': {
                'income': total_income,
                'expense': total_expense,
                'profit': net_profit,
                'month_name': today.strftime('%B')
            },
            'reminders': reminders
        }), 200
        
    except Exception as e:
        logger.error(f"Error in get_dashboard_stats: {str(e)}")
        return jsonify({'error': str(e)}), 500


# --- CATTLE ENDPOINTS ---
@app.route('/api/cattle', methods=['GET'])
def get_cattle():
    try:
        status_filter = request.args.get('status')
        query = Cattle.query
        if status_filter:
            query = query.filter_by(status=status_filter)
        cattle_list = query.all()
        return jsonify([c.to_dict() for c in cattle_list]), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/cattle/<int:cattle_id>', methods=['GET'])
def get_cattle_detail(cattle_id):
    try:
        cow = Cattle.query.get_or_404(cattle_id)
        cow_dict = cow.to_dict()
        
        # Include history sorted by date descending
        cow_dict['milk_history'] = [m.to_dict() for m in sorted(cow.milk_records, key=lambda x: x.date, reverse=True)[:10]]
        cow_dict['breeding_history'] = [b.to_dict() for b in sorted(cow.breeding_records, key=lambda x: x.insemination_date, reverse=True)]
        cow_dict['health_history'] = [h.to_dict() for h in sorted(cow.health_records, key=lambda x: x.date, reverse=True)]
        
        return jsonify(cow_dict), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/cattle', methods=['POST'])
def add_cattle():
    try:
        data = request.json
        if not data.get('tag_id') or not data.get('breed') or not data.get('dob'):
            return jsonify({'error': 'Missing required fields: tag_id, breed, dob'}), 400
            
        dob = parse_date(data.get('dob'))
        if not dob:
            return jsonify({'error': 'Invalid date of birth format (YYYY-MM-DD)'}), 400
            
        # Check uniqueness of tag_id
        if Cattle.query.filter_by(tag_id=data.get('tag_id')).first():
            return jsonify({'error': f"Cattle with tag ID {data.get('tag_id')} already exists"}), 400
            
        cow = Cattle(
            tag_id=data.get('tag_id'),
            name=data.get('name'),
            breed=data.get('breed'),
            dob=dob,
            gender=data.get('gender', 'Cow'),
            status=data.get('status', 'Milking'),
            notes=data.get('notes')
        )
        
        db.session.add(cow)
        db.session.commit()
        return jsonify(cow.to_dict()), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@app.route('/api/cattle/<int:cattle_id>', methods=['PUT'])
def update_cattle(cattle_id):
    try:
        cow = Cattle.query.get_or_404(cattle_id)
        data = request.json
        
        if 'tag_id' in data and data['tag_id'] != cow.tag_id:
            # Check unique tag
            existing = Cattle.query.filter_by(tag_id=data['tag_id']).first()
            if existing:
                return jsonify({'error': f"Tag ID {data['tag_id']} is already in use"}), 400
            cow.tag_id = data['tag_id']
            
        if 'name' in data: cow.name = data['name']
        if 'breed' in data: cow.breed = data['breed']
        if 'gender' in data: cow.gender = data['gender']
        if 'status' in data: cow.status = data['status']
        if 'notes' in data: cow.notes = data['notes']
        
        if 'dob' in data:
            dob = parse_date(data['dob'])
            if dob:
                cow.dob = dob
                
        db.session.commit()
        return jsonify(cow.to_dict()), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@app.route('/api/cattle/<int:cattle_id>', methods=['DELETE'])
def delete_cattle(cattle_id):
    try:
        cow = Cattle.query.get_or_404(cattle_id)
        db.session.delete(cow)
        db.session.commit()
        return jsonify({'message': f"Cattle with tag ID {cow.tag_id} deleted successfully"}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


# --- MILK PRODUCTION ENDPOINTS ---
@app.route('/api/milk', methods=['GET'])
def get_milk_records():
    try:
        cattle_id = request.args.get('cattle_id')
        start_date = parse_date(request.args.get('start_date'))
        end_date = parse_date(request.args.get('end_date'))
        
        query = MilkRecord.query
        if cattle_id:
            query = query.filter_by(cattle_id=cattle_id)
        if start_date:
            query = query.filter(MilkRecord.date >= start_date)
        if end_date:
            query = query.filter(MilkRecord.date <= end_date)
            
        records = query.order_by(MilkRecord.date.desc(), MilkRecord.session.desc()).all()
        return jsonify([r.to_dict() for r in records]), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/milk', methods=['POST'])
def add_milk_record():
    try:
        data = request.json
        if not data.get('session') or data.get('quantity') is None:
            return jsonify({'error': 'Missing required fields: session, quantity'}), 400
            
        record_date = parse_date(data.get('date')) or datetime.utcnow().date()
        
        cattle_id = data.get('cattle_id')
        if cattle_id == "":
            cattle_id = None
            
        if cattle_id:
            # Check cow exists
            Cattle.query.get_or_404(cattle_id)
            
        record = MilkRecord(
            cattle_id=cattle_id,
            date=record_date,
            session=data.get('session'),
            quantity=float(data.get('quantity')),
            fat_percentage=float(data.get('fat_percentage')) if data.get('fat_percentage') else None,
            snf_percentage=float(data.get('snf_percentage')) if data.get('snf_percentage') else None,
            price_per_liter=float(data.get('price_per_liter')) if data.get('price_per_liter') else None
        )
        
        db.session.add(record)
        
        # Auto-financial recording
        if record.price_per_liter and record.quantity > 0:
            income_amount = round(record.quantity * record.price_per_liter, 2)
            cattle_ref = f" (Cow Tag: {record.cattle.tag_id})" if record.cattle else " (Collective)"
            finance = FinancialRecord(
                date=record_date,
                type='Income',
                category='Milk Sale',
                amount=income_amount,
                description=f"Auto-logged: sold {record.quantity}L of milk{cattle_ref} at {record.price_per_liter}/L"
            )
            db.session.add(finance)
            
        db.session.commit()
        return jsonify(record.to_dict()), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@app.route('/api/milk/<int:record_id>', methods=['DELETE'])
def delete_milk_record(record_id):
    try:
        record = MilkRecord.query.get_or_404(record_id)
        db.session.delete(record)
        db.session.commit()
        return jsonify({'message': 'Milk record deleted successfully'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


# --- BREEDING & REPRODUCTION ENDPOINTS ---
@app.route('/api/breeding', methods=['GET'])
def get_breeding_records():
    try:
        cattle_id = request.args.get('cattle_id')
        query = BreedingRecord.query
        if cattle_id:
            query = query.filter_by(cattle_id=cattle_id)
        records = query.order_by(BreedingRecord.insemination_date.desc()).all()
        return jsonify([r.to_dict() for r in records]), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/breeding', methods=['POST'])
def add_breeding_record():
    try:
        data = request.json
        if not data.get('cattle_id') or not data.get('insemination_date'):
            return jsonify({'error': 'Missing required fields: cattle_id, insemination_date'}), 400
            
        cow = Cattle.query.get_or_404(data.get('cattle_id'))
        
        # Cow status validation
        if cow.gender.lower() == 'bull':
            return jsonify({'error': 'Cannot register breeding record for a bull'}), 400
            
        insem_date = parse_date(data.get('insemination_date'))
        if not insem_date:
            return jsonify({'error': 'Invalid insemination date format'}), 400
            
        # Breeding calculations
        preg_check = insem_date + timedelta(days=45)
        exp_calving = insem_date + timedelta(days=283)
        
        record = BreedingRecord(
            cattle_id=cow.id,
            insemination_date=insem_date,
            breeding_method=data.get('breeding_method', 'Artificial Insemination'),
            sire_id=data.get('sire_id'),
            pregnancy_check_date=preg_check,
            pregnancy_status='Pending',
            expected_calving_date=exp_calving,
            notes=data.get('notes')
        )
        
        # Update cow's status to reflect breeding cycle
        cow.status = 'Pregnant' if data.get('pregnancy_status') == 'Positive' else cow.status
        if data.get('pregnancy_status') in ['Pending', 'Positive', 'Negative']:
            record.pregnancy_status = data.get('pregnancy_status')
            
        db.session.add(record)
        db.session.commit()
        return jsonify(record.to_dict()), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@app.route('/api/breeding/<int:record_id>', methods=['PUT'])
def update_breeding_record(record_id):
    try:
        record = BreedingRecord.query.get_or_404(record_id)
        cow = Cattle.query.get(record.cattle_id)
        data = request.json
        
        if 'insemination_date' in data:
            insem_date = parse_date(data['insemination_date'])
            if insem_date:
                record.insemination_date = insem_date
                # Recalculate if not customized
                record.pregnancy_check_date = insem_date + timedelta(days=45)
                record.expected_calving_date = insem_date + timedelta(days=283)
                
        if 'breeding_method' in data: record.breeding_method = data['breeding_method']
        if 'sire_id' in data: record.sire_id = data['sire_id']
        if 'notes' in data: record.notes = data['notes']
        
        # Handle pregnancy check
        if 'pregnancy_status' in data:
            old_status = record.pregnancy_status
            new_status = data['pregnancy_status']
            record.pregnancy_status = new_status
            
            # Sync Cattle status
            if new_status == 'Positive':
                cow.status = 'Pregnant'
            elif new_status == 'Negative' and cow.status == 'Pregnant':
                cow.status = 'Milking' # default back to milking
            elif new_status == 'Pending' and cow.status == 'Pregnant':
                cow.status = 'Milking'
                
        # Handle calving
        if 'actual_calving_date' in data and data['actual_calving_date']:
            calving_date = parse_date(data['actual_calving_date'])
            if calving_date:
                record.actual_calving_date = calving_date
                # Once calved, cow is no longer pregnant, goes back to milking
                cow.status = 'Milking'
                
                # Check if we should register the calf automatically!
                if data.get('register_calf', True):
                    calf_tag = f"Calf-{cow.tag_id}-{calving_date.strftime('%y%m%d')}"
                    # Ensure tag is unique
                    dup = Cattle.query.filter_by(tag_id=calf_tag).first()
                    if not dup:
                        new_calf = Cattle(
                            tag_id=calf_tag,
                            name=f"Calf of {cow.name or cow.tag_id}",
                            breed=cow.breed,
                            dob=calving_date,
                            gender=data.get('calf_gender', 'Cow'),
                            status='Calf',
                            notes=f"Auto-generated from breeding record ID {record.id}"
                        )
                        db.session.add(new_calf)
                        
        db.session.commit()
        return jsonify(record.to_dict()), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@app.route('/api/breeding/<int:record_id>', methods=['DELETE'])
def delete_breeding_record(record_id):
    try:
        record = BreedingRecord.query.get_or_404(record_id)
        db.session.delete(record)
        db.session.commit()
        return jsonify({'message': 'Breeding record deleted successfully'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


# --- HEALTH & MEDICAL ENDPOINTS ---
@app.route('/api/health', methods=['GET'])
def get_health_records():
    try:
        cattle_id = request.args.get('cattle_id')
        query = HealthRecord.query
        if cattle_id:
            query = query.filter_by(cattle_id=cattle_id)
        records = query.order_by(HealthRecord.date.desc()).all()
        return jsonify([r.to_dict() for r in records]), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/health', methods=['POST'])
def add_health_record():
    try:
        data = request.json
        if not data.get('cattle_id') or not data.get('record_type') or not data.get('details'):
            return jsonify({'error': 'Missing required fields: cattle_id, record_type, details'}), 400
            
        cow = Cattle.query.get_or_404(data.get('cattle_id'))
        rec_date = parse_date(data.get('date')) or datetime.utcnow().date()
        next_due = parse_date(data.get('next_due_date'))
        cost = float(data.get('cost', 0.0))
        
        record = HealthRecord(
            cattle_id=cow.id,
            record_type=data.get('record_type'),
            date=rec_date,
            details=data.get('details'),
            cost=cost,
            next_due_date=next_due
        )
        db.session.add(record)
        
        # If the cow is treated for sickness, we can optionially change status to 'Sick'
        if data.get('set_sick_status', False):
            cow.status = 'Sick'
        elif data.get('resolved_status', False) and cow.status == 'Sick':
            cow.status = 'Milking' # Reset back to Milking
            
        # Auto-log expense
        if cost > 0:
            finance = FinancialRecord(
                date=rec_date,
                type='Expense',
                category='Veterinary',
                amount=cost,
                description=f"Auto-logged: {record.record_type} treatment for Cow Tag: {cow.tag_id} ({record.details})"
            )
            db.session.add(finance)
            
        db.session.commit()
        return jsonify(record.to_dict()), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@app.route('/api/health/<int:record_id>', methods=['DELETE'])
def delete_health_record(record_id):
    try:
        record = HealthRecord.query.get_or_404(record_id)
        db.session.delete(record)
        db.session.commit()
        return jsonify({'message': 'Health record deleted successfully'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


# --- FEED MANAGEMENT ENDPOINTS ---
@app.route('/api/feed/inventory', methods=['GET'])
def get_feed_inventory():
    try:
        items = FeedInventory.query.all()
        return jsonify([i.to_dict() for i in items]), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/feed/inventory', methods=['POST'])
def add_feed_inventory():
    try:
        data = request.json
        if not data.get('feed_name') or data.get('quantity_kg') is None:
            return jsonify({'error': 'Missing required fields: feed_name, quantity_kg'}), 400
            
        # Check existing
        item = FeedInventory.query.filter_by(feed_name=data.get('feed_name')).first()
        qty = float(data.get('quantity_kg'))
        unit_cost = float(data.get('unit_cost_per_kg', 0.0))
        reorder = float(data.get('reorder_level_kg', 100.0))
        
        if item:
            # Overwrite or Add to stock
            if data.get('add_to_stock', True):
                item.quantity_kg += qty
                # Calculate cost of new supply
                total_cost = round(qty * unit_cost, 2)
                # Auto-log expense
                if total_cost > 0:
                    finance = FinancialRecord(
                        date=datetime.utcnow().date(),
                        type='Expense',
                        category='Feed Purchase',
                        amount=total_cost,
                        description=f"Auto-logged: purchased {qty} kg of feed '{item.feed_name}' at {unit_cost}/kg"
                    )
                    db.session.add(finance)
            else:
                item.quantity_kg = qty
            
            if 'reorder_level_kg' in data: item.reorder_level_kg = reorder
            if 'unit_cost_per_kg' in data: item.unit_cost_per_kg = unit_cost
        else:
            item = FeedInventory(
                feed_name=data.get('feed_name'),
                quantity_kg=qty,
                reorder_level_kg=reorder,
                unit_cost_per_kg=unit_cost
            )
            db.session.add(item)
            
            # Initial supply cost
            total_cost = round(qty * unit_cost, 2)
            if total_cost > 0:
                finance = FinancialRecord(
                    date=datetime.utcnow().date(),
                    type='Expense',
                    category='Feed Purchase',
                    amount=total_cost,
                    description=f"Auto-logged: initial purchase of {qty} kg of '{item.feed_name}' at {unit_cost}/kg"
                )
                db.session.add(finance)
                
        db.session.commit()
        return jsonify(item.to_dict()), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@app.route('/api/feed/logs', methods=['GET'])
def get_feed_logs():
    try:
        logs = FeedLog.query.order_by(FeedLog.date.desc()).all()
        return jsonify([l.to_dict() for l in logs]), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/feed/logs', methods=['POST'])
def add_feed_log():
    try:
        data = request.json
        if not data.get('feed_id') or data.get('quantity_used_kg') is None or not data.get('group_fed'):
            return jsonify({'error': 'Missing required fields: feed_id, quantity_used_kg, group_fed'}), 400
            
        item = FeedInventory.query.get_or_404(data.get('feed_id'))
        qty_used = float(data.get('quantity_used_kg'))
        
        # Deduct inventory
        if item.quantity_kg < qty_used:
            return jsonify({'error': f"Insufficient stock of {item.feed_name}. Available: {item.quantity_kg:.1f} kg, requested: {qty_used:.1f} kg"}), 400
            
        item.quantity_kg -= qty_used
        rec_date = parse_date(data.get('date')) or datetime.utcnow().date()
        
        log_entry = FeedLog(
            feed_id=item.id,
            date=rec_date,
            quantity_used_kg=qty_used,
            group_fed=data.get('group_fed')
        )
        
        db.session.add(log_entry)
        db.session.commit()
        return jsonify(log_entry.to_dict()), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


# --- FINANCIAL ACCOUNTING ENDPOINTS ---
@app.route('/api/finance', methods=['GET'])
def get_financial_records():
    try:
        records = FinancialRecord.query.order_by(FinancialRecord.date.desc()).all()
        return jsonify([r.to_dict() for r in records]), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/finance', methods=['POST'])
def add_financial_record():
    try:
        data = request.json
        if not data.get('type') or not data.get('category') or data.get('amount') is None:
            return jsonify({'error': 'Missing required fields: type, category, amount'}), 400
            
        rec_date = parse_date(data.get('date')) or datetime.utcnow().date()
        
        record = FinancialRecord(
            date=rec_date,
            type=data.get('type'), # 'Income' or 'Expense'
            category=data.get('category'),
            amount=float(data.get('amount')),
            description=data.get('description')
        )
        
        db.session.add(record)
        db.session.commit()
        return jsonify(record.to_dict()), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@app.route('/api/finance/<int:record_id>', methods=['DELETE'])
def delete_financial_record(record_id):
    try:
        record = FinancialRecord.query.get_or_404(record_id)
        db.session.delete(record)
        db.session.commit()
        return jsonify({'message': 'Transaction deleted successfully'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
