import sys
import os

# Add app to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(__file__))))

from app.database import SessionLocal
from app.models.user import User
from app.models.patient import PatientProfile
from app.models.medical import Medication
from app.models.ai import AIFlag

db = SessionLocal()
try:
    user = db.query(User).filter(User.email == 'patient@demo.com').first()
    print("User:", user.id if user else "None")
    if user:
        profile = db.query(PatientProfile).filter(PatientProfile.user_id == user.id).first()
        print("Profile ID:", profile.id if profile else "None")
        if profile:
            meds = db.query(Medication).filter(Medication.patient_id == profile.id).all()
            print("Medications count:", len(meds))
            flags = db.query(AIFlag).filter(AIFlag.patient_id == profile.id).all()
            print("Flags count:", len(flags))
except Exception as e:
    print("Error:", e)
finally:
    db.close()
