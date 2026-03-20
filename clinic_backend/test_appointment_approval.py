#!/usr/bin/env python
"""
Test Appointment Approval Functionality
"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'clinic_backend.settings')
django.setup()

from appointments.models import Appointment
from accounts.models import User
from doctors.models import Doctor, Department
from patients.models import Patient
from datetime import datetime, timedelta

def test_appointment_approval():
    """Test appointment approval flow"""
    
    print("=" * 70)
    print("APPOINTMENT APPROVAL FLOW TEST")
    print("=" * 70)
    
    try:
        # Get or create admin
        admin = User.objects.filter(role='ADMIN').first()
        if not admin:
            print("✗ No admin user found")
            return
        
        # Get pending appointments
        pending = Appointment.objects.filter(status='PENDING')
        print(f"\n✓ Pending Appointments: {pending.count()}")
        
        if pending.count() == 0:
            print("  No pending appointments found. Creating one for testing...")
            
            # Get patient and doctor
            patient = Patient.objects.first()
            doctor = Doctor.objects.first()
            
            if not patient or not doctor:
                print("  ✗ Cannot create test appointment: missing patient or doctor")
                return
            
            # Create test appointment
            appointment = Appointment.objects.create(
                patient=patient,
                doctor=doctor,
                appointment_date=datetime.now().date() + timedelta(days=1),
                appointment_time=datetime.now().time(),
                reason="Test Appointment",
                status='PENDING'
            )
            print(f"  ✓ Created test appointment ID: {appointment.id}")
        else:
            appointment = pending.first()
            print(f"  - Using existing appointment ID: {appointment.id}")
        
        print(f"\n✓ Appointment Details:")
        print(f"  ID: {appointment.id}")
        print(f"  Patient: {appointment.patient.user.full_name}")
        print(f"  Doctor: {appointment.doctor.user.full_name}")
        print(f"  Date: {appointment.appointment_date}")
        print(f"  Time: {appointment.appointment_time}")
        print(f"  Status: {appointment.status}")
        
        # Test approval simulation
        print(f"\n" + "=" * 70)
        print("SIMULATING APPROVAL")
        print("=" * 70)
        
        old_status = appointment.status
        appointment.status = 'APPROVED'
        appointment.save()
        
        # Verify status changed
        appointment.refresh_from_db()
        print(f"\n✓ Status Change: {old_status} → {appointment.status}")
        
        if appointment.status == 'APPROVED':
            print("✓ Status successfully updated to APPROVED")
        else:
            print(f"✗ Status update failed, still: {appointment.status}")
        
        # Revert for next test
        appointment.status = 'PENDING'
        appointment.save()
        print("✓ Reverted status back to PENDING for testing")
        
        print(f"\n" + "=" * 70)
        print("API ENDPOINT INFORMATION")
        print("=" * 70)
        print(f"✓ Approve Endpoint: POST /api/appointments/{appointment.id}/approve/")
        print(f"✓ Reject Endpoint: POST /api/appointments/{appointment.id}/reject/")
        print(f"✓ Cancel Endpoint: POST /api/appointments/{appointment.id}/cancel/")
        print(f"\n✓ Required Role: ADMIN")
        print(f"✓ Current Admin: {admin.email}")
        
    except Exception as e:
        print(f"✗ Error: {str(e)}")
        import traceback
        traceback.print_exc()

if __name__ == '__main__':
    test_appointment_approval()
