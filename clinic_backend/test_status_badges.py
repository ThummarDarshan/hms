#!/usr/bin/env python
"""
Create test appointments with different statuses to verify badge colors
"""
import os
import django
from datetime import datetime, timedelta

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'clinic_backend.settings')
django.setup()

from appointments.models import Appointment
from doctors.models import Doctor
from patients.models import Patient
from accounts.models import User

def create_status_test_appointments():
    """Create appointments with each status to test badge colors"""
    
    # Get a doctor
    doctor = Doctor.objects.first()
    if not doctor:
        print("❌ No doctor found")
        return
    
    # Get a patient
    patient = Patient.objects.first()
    if not patient:
        print("❌ No patient found")
        return
    
    base_date = datetime.now()
    
    # Delete existing test appointments
    Appointment.objects.filter(reason__startswith='TEST-STATUS').delete()
    print("✓ Cleaned up old test appointments")
    
    test_data = [
        {
            'status': 'PENDING',
            'offset': 1,
            'color': '🟡 Yellow'
        },
        {
            'status': 'APPROVED',
            'offset': 2,
            'color': '🔵 Blue'
        },
        {
            'status': 'VISITED',
            'offset': 3,
            'color': '🟢 Green'
        },
        {
            'status': 'REJECTED',
            'offset': 4,
            'color': '🔴 Red'
        },
        {
            'status': 'CANCELLED',
            'offset': 5,
            'color': '⚫ Gray'
        },
    ]
    
    print("\n" + "="*70)
    print("CREATING TEST APPOINTMENTS FOR BADGE DISPLAY")
    print("="*70)
    
    for test in test_data:
        apt_date = base_date + timedelta(days=test['offset'])
        
        apt = Appointment.objects.create(
            patient=patient,
            doctor=doctor,
            appointment_date=apt_date.date(),
            appointment_time=apt_date.time(),
            reason=f'TEST-STATUS: {test["status"]}',
            notes=f'Testing {test["status"]} badge color',
            status=test['status']
        )
        
        print(f"\n✓ Created appointment #{apt.id}")
        print(f"  Status: {test['status']} → {test['color']}")
        print(f"  Date: {apt_date.strftime('%Y-%m-%d %H:%M')}")
        print(f"  Patient: {patient.user.full_name}")
        print(f"  Doctor: {doctor.user.full_name}")
    
    print("\n" + "="*70)
    print("STATUS BADGE TEST GUIDE")
    print("="*70)
    print("""
LOGIN AS ADMIN to see all statuses:
  - PENDING (🟡 Yellow)   - Awaiting approval
  - APPROVED (🔵 Blue)    - Approved, waiting for visit
  - VISITED (🟢 Green)    - Appointment completed
  - REJECTED (🔴 Red)     - Admin rejected
  - CANCELLED (⚫ Gray)    - Cancelled

LOGIN AS DOCTOR:
  - Will ONLY see APPROVED and VISITED appointments
  - PENDING/REJECTED/CANCELLED are hidden
  
CHECK THE COLORS:
  1. Open Appointments page
  2. Status badges should display:
     ✓ Yellow for PENDING
     ✓ Blue for APPROVED  
     ✓ Green for VISITED
     ✓ Red for REJECTED
     ✓ Gray for CANCELLED
    """)
    print("=" * 70 + "\n")

if __name__ == '__main__':
    create_status_test_appointments()
