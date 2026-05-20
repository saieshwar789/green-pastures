from app import app
from models import db, Cattle, MilkRecord, BreedingRecord, HealthRecord, FeedInventory, FeedLog, FinancialRecord
from datetime import datetime, timedelta
import random

def seed_database():
    print("Starting database seeding...")
    
    # 1. Clear existing data
    db.drop_all()
    db.create_all()
    print("Database cleared and schema recreated.")
    
    today = datetime.utcnow().date()
    
    # 2. Add Cattle
    cows_data = [
        {"tag_id": "C001", "name": "Daisy", "breed": "Holstein Friesian", "dob": today - timedelta(days=5*365), "gender": "Cow", "status": "Milking", "notes": "High milk producer, gentle temperament."},
        {"tag_id": "C002", "name": "Bessie", "breed": "Jersey", "dob": today - timedelta(days=4*365), "gender": "Cow", "status": "Pregnant", "notes": "Premium quality high fat milk."},
        {"tag_id": "C003", "name": "Rosie", "breed": "Brown Swiss", "dob": today - timedelta(days=6*365), "gender": "Cow", "status": "Dry", "notes": "Dry period started, preparing for calving."},
        {"tag_id": "C004", "name": "Molly", "breed": "Holstein Friesian", "dob": today - timedelta(days=3*365), "gender": "Cow", "status": "Sick", "notes": "Recovering from mild mastitis. Under observation."},
        {"tag_id": "C005", "name": "Bella", "breed": "Jersey", "dob": today - timedelta(days=180), "gender": "Cow", "status": "Calf", "notes": "Healthy heifer calf. Daughter of Bessie."},
        {"tag_id": "C006", "name": "Duke", "breed": "Gir", "dob": today - timedelta(days=4.5*365), "gender": "Bull", "status": "Bull", "notes": "Breeding bull, very sturdy."}
    ]
    
    cattle_instances = []
    for cow in cows_data:
        c = Cattle(**cow)
        db.session.add(c)
        cattle_instances.append(c)
    
    db.session.commit()
    print(f"Seeded {len(cattle_instances)} cattle.")
    
    # Map cattle by tag for easy lookup
    cattle_map = {c.tag_id: c for c in cattle_instances}
    
    # 3. Add Feed Inventory
    feed_data = [
        {"feed_name": "Corn Silage", "quantity_kg": 1800.0, "reorder_level_kg": 400.0, "unit_cost_per_kg": 10.0},
        {"feed_name": "Dairy Concentrate (20%)", "quantity_kg": 950.0, "reorder_level_kg": 250.0, "unit_cost_per_kg": 25.0},
        {"feed_name": "Alfalfa Hay", "quantity_kg": 180.0, "reorder_level_kg": 300.0, "unit_cost_per_kg": 15.0}  # Low stock!
    ]
    
    feed_instances = []
    for feed in feed_data:
        f = FeedInventory(**feed)
        db.session.add(f)
        feed_instances.append(f)
        
    db.session.commit()
    print("Seeded feed inventory (Alfalfa Hay is low stock to trigger alert).")
    
    # Map feeds by name
    feed_map = {f.feed_name: f for f in feed_instances}
    
    # 4. Add Feed Logs (past 5 days)
    for i in range(5, 0, -1):
        log_date = today - timedelta(days=i)
        
        # Silage consumption
        db.session.add(FeedLog(
            feed_id=feed_map["Corn Silage"].id,
            date=log_date,
            quantity_used_kg=120.0,
            group_fed="Milking Herd"
        ))
        # Concentrate consumption
        db.session.add(FeedLog(
            feed_id=feed_map["Dairy Concentrate (20%)"].id,
            date=log_date,
            quantity_used_kg=60.0,
            group_fed="Milking Herd"
        ))
        # Hay consumption
        db.session.add(FeedLog(
            feed_id=feed_map["Alfalfa Hay"].id,
            date=log_date,
            quantity_used_kg=25.0,
            group_fed="All"
        ))
        
    db.session.commit()
    print("Seeded feed logs.")
    
    # 5. Add Health Records
    health_records = [
        # FMD vaccine last month
        HealthRecord(
            cattle_id=cattle_map["C001"].id,
            record_type="Vaccination",
            date=today - timedelta(days=30),
            details="Foot and Mouth Disease (FMD) Vaccine",
            cost=500.0,
            next_due_date=today + timedelta(days=150)
        ),
        HealthRecord(
            cattle_id=cattle_map["C002"].id,
            record_type="Vaccination",
            date=today - timedelta(days=30),
            details="Foot and Mouth Disease (FMD) Vaccine",
            cost=500.0,
            next_due_date=today + timedelta(days=150)
        ),
        # Treatment for Molly
        HealthRecord(
            cattle_id=cattle_map["C004"].id,
            record_type="Treatment",
            date=today - timedelta(days=3),
            details="Intramammary antibiotics for mild mastitis",
            cost=1500.0,
            next_due_date=today + timedelta(days=2) # Follow up due in 2 days
        ),
        # Deworming for calf
        HealthRecord(
            cattle_id=cattle_map["C005"].id,
            record_type="Deworming",
            date=today - timedelta(days=15),
            details="Broad-spectrum oral dewormer",
            cost=250.0,
            next_due_date=today + timedelta(days=75)
        )
    ]
    for hr in health_records:
        db.session.add(hr)
    db.session.commit()
    print("Seeded health records.")
    
    # 6. Add Breeding Records
    breeding_records = [
        # Bessie: inseminated 120 days ago (Pregnant)
        BreedingRecord(
            cattle_id=cattle_map["C002"].id,
            insemination_date=today - timedelta(days=120),
            breeding_method="Artificial Insemination",
            sire_id="Jersey Bull J-808",
            pregnancy_check_date=today - timedelta(days=75),
            pregnancy_status="Positive",
            expected_calving_date=today - timedelta(days=120) + timedelta(days=283),
            notes="Pregnancy confirmed by Vet scan. Cow shows good body condition."
        ),
        # Rosie: Inseminated 270 days ago (Dry period, near calving - 13 days to expected calving!)
        BreedingRecord(
            cattle_id=cattle_map["C003"].id,
            insemination_date=today - timedelta(days=270),
            breeding_method="Artificial Insemination",
            sire_id="Swiss Bull S-102",
            pregnancy_check_date=today - timedelta(days=225),
            pregnancy_status="Positive",
            expected_calving_date=today - timedelta(days=270) + timedelta(days=283), # in 13 days
            notes="Dry off completed. Isolated in calving pen."
        ),
        # Daisy: Inseminated 42 days ago (Pregnancy check due in 3 days - pending!)
        BreedingRecord(
            cattle_id=cattle_map["C001"].id,
            insemination_date=today - timedelta(days=42),
            breeding_method="Artificial Insemination",
            sire_id="Holstein Bull H-99",
            pregnancy_check_date=today - timedelta(days=42) + timedelta(days=45), # in 3 days!
            pregnancy_status="Pending",
            expected_calving_date=today - timedelta(days=42) + timedelta(days=283),
            notes="Insemination successful. Monitor for return heat signs."
        )
    ]
    for br in breeding_records:
        db.session.add(br)
    db.session.commit()
    print("Seeded breeding records (includes upcoming pregnancy check & calving warnings).")
    
    # 7. Add Milk Records (past 7 days for milking cows: C001, C002, C004)
    # Daisy (C001) produces ~14-16 L morning, ~10-12 L evening
    # Bessie (C002) produces ~10-12 L morning, ~8-10 L evening
    # Molly (C004) was producing ~12L morning, ~9L evening but dropped due to sickness 3 days ago.
    # Note: price of milk is ~40.00 per Liter.
    milk_price = 40.0
    for i in range(7, -1, -1):
        log_date = today - timedelta(days=i)
        
        # Cow 1 - Daisy (Milking)
        qty_morning = round(random.uniform(14.0, 17.0), 1)
        qty_evening = round(random.uniform(11.0, 13.0), 1)
        db.session.add(MilkRecord(cattle_id=cattle_map["C001"].id, date=log_date, session="Morning", quantity=qty_morning, fat_percentage=3.8, snf_percentage=8.5, price_per_liter=milk_price))
        db.session.add(MilkRecord(cattle_id=cattle_map["C001"].id, date=log_date, session="Evening", quantity=qty_evening, fat_percentage=3.9, snf_percentage=8.5, price_per_liter=milk_price))
        
        # Cow 2 - Bessie (Pregnant but still milking until dry off)
        qty_morning = round(random.uniform(9.0, 11.5), 1)
        qty_evening = round(random.uniform(7.0, 9.0), 1)
        db.session.add(MilkRecord(cattle_id=cattle_map["C002"].id, date=log_date, session="Morning", quantity=qty_morning, fat_percentage=4.6, snf_percentage=9.1, price_per_liter=milk_price + 5.0)) # Premium price for Jersey fat%
        db.session.add(MilkRecord(cattle_id=cattle_map["C002"].id, date=log_date, session="Evening", quantity=qty_evening, fat_percentage=4.7, snf_percentage=9.1, price_per_liter=milk_price + 5.0))
        
        # Cow 4 - Molly (Sick 3 days ago, milk was discarded or dropped)
        if log_date < today - timedelta(days=3):
            qty_morning = round(random.uniform(11.0, 13.0), 1)
            qty_evening = round(random.uniform(8.0, 10.0), 1)
            db.session.add(MilkRecord(cattle_id=cattle_map["C004"].id, date=log_date, session="Morning", quantity=qty_morning, fat_percentage=3.7, snf_percentage=8.4, price_per_liter=milk_price))
            db.session.add(MilkRecord(cattle_id=cattle_map["C004"].id, date=log_date, session="Evening", quantity=qty_evening, fat_percentage=3.8, snf_percentage=8.4, price_per_liter=milk_price))
        elif log_date == today - timedelta(days=3):
            # Dropped output drastically on day she got sick
            db.session.add(MilkRecord(cattle_id=cattle_map["C004"].id, date=log_date, session="Morning", quantity=4.2, fat_percentage=3.4, snf_percentage=8.1, price_per_liter=milk_price))
            # Evening milk discarded (quantity recorded as 0 or not logged)
        # Days after that are not logged for Molly due to antibiotic milk withdrawal period
        
    db.session.commit()
    print("Seeded milk records.")
    
    # 8. Add Financial Records (Income & Expenses for the month)
    financial_data = [
        # Milk Sales (automatically simulated here, though normally app logs them)
        {"date": today - timedelta(days=15), "type": "Income", "category": "Milk Sale", "amount": 61480.00, "description": "Bi-weekly milk cooperative payout (1,537 Liters)"},
        {"date": today - timedelta(days=25), "type": "Income", "category": "Cattle Sale", "amount": 85000.00, "description": "Sold retired steer to local trader"},
        {"date": today - timedelta(days=2), "type": "Income", "category": "Other", "amount": 8000.00, "description": "Sold organic manure fertilizer load"},
        
        # Expenses
        {"date": today - timedelta(days=22), "type": "Expense", "category": "Feed Purchase", "amount": 25000.00, "description": "Purchased 1 ton silage and concentrates stock"},
        {"date": today - timedelta(days=12), "type": "Expense", "category": "Labor", "amount": 15000.00, "description": "Monthly wages for milking assistant"},
        {"date": today - timedelta(days=10), "type": "Expense", "category": "Utilities", "amount": 5000.00, "description": "Electricity & water charges for dairy barn"},
        {"date": today - timedelta(days=5), "type": "Expense", "category": "Veterinary", "amount": 3000.00, "description": "Vet callout fee and general health checkup"}
    ]
    
    # Also add individual feed expenses and treatment expenses matching health records to align totals
    financial_data.append({"date": today - timedelta(days=3), "type": "Expense", "category": "Veterinary", "amount": 1500.0, "description": "Auto-logged: Treatment for Cow Molly (mastitis antibiotics)"})
    
    # Simulate past 7 days of daily milk sales
    for i in range(7, 0, -1):
        log_date = today - timedelta(days=i)
        day_records = MilkRecord.query.filter_by(date=log_date).all()
        day_sales = sum(r.quantity * (r.price_per_liter or milk_price) for r in day_records)
        if day_sales > 0:
            financial_data.append({
                "date": log_date,
                "type": "Income",
                "category": "Milk Sale",
                "amount": round(day_sales, 2),
                "description": f"Auto-logged: sold {sum(r.quantity for r in day_records):.1f}L of herd milk"
            })
            
    for fin in financial_data:
        db.session.add(FinancialRecord(**fin))
        
    db.session.commit()
    print("Seeded financial ledger.")
    print("Database seeding completed successfully!")

if __name__ == '__main__':
    with app.app_context():
        seed_database()
