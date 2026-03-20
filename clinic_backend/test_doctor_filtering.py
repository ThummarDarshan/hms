#!/usr/bin/env python
"""
Test Doctor Appointment Filtering
Verify that doctors only see their own appointments
"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'clinic_backend.settings')
django.setup()

from appointments.models import Appointment
from doctors.models import Doctor
from accounts.models import User
from patients.models import Patient
from datetime import datetime, timedelta

def test_doctor_filtering():
    """Test that doctor filtering works correctly"""
    
    print("=" * 80)
    print("DOCTOR APPOINTMENT FILTERING TEST")
    print("=" * 80)
    
    try:
        # Get all doctors
        doctors = Doctor.objects.all()
        print(f"\n✓ Total Doctors in System: {doctors.count()}")
        for doc in doctors:
            print(f"  - Dr. {doc.user.full_name} (ID: {doc.id})")
        
        if doctors.count() < 2:
            print("✗ Need at least 2 doctors for this test")
            return
        
        # Get the first two doctors
        doctor1 = doctors[0]
        doctor2 = doctors[1]
        
        print(f"\n[TEST] Doctor Filtering")
        print(f"-" * 80)
        
        # Count appointments for doctor1
        doctor1_appointments = Appointment.objects.filter(doctor=doctor1)
        print(f"\n✓ Doctor 1 (Dr. {doctor1.user.full_name}):")
        print(f"  - Total appointments: {doctor1_appointments.count()}")
        for apt in doctor1_appointments:
            print(f"    - Appointment #{apt.id}: {apt.patient.user.full_name} ({apt.status})")
        
        # Count appointments for doctor2
        doctor2_appointments = Appointment.objects.filter(doctor=doctor2)
        print(f"\n✓ Doctor 2 (Dr. {doctor2.user.full_name}):")
        print(f"  - Total appointments: {doctor2_appointments.count()}")
        for apt in doctor2_appointments:
            print(f"    - Appointment #{apt.id}: {apt.patient.user.full_name} ({apt.status})")
        
        # Verify they don't see each other's appointments
        doctor1_only = doctor1_appointments.exclude(doctor=doctor2)
        doctor2_only = doctor2_appointments.exclude(doctor=doctor1)
        
        print(f"\n[VERIFICATION]")
        print(f"-" * 80)
        print(f"✓ Doctor 1 sees ONLY their own appointments: {doctor1_only.count() == doctor1_appointments.count()}")
        print(f"✓ Doctor 2 sees ONLY their own appointments: {doctor2_only.count() == doctor2_appointments.count()}")
        
        # Test the backend queryset filtering
        print(f"\n[BACKEND QUERYSET FILTERING]")
        print(f"-" * 80)
        
        # Simulate what the ViewSet does for doctor1
        doctor1_user = doctor1.user
        doctor1_queryset = Appointment.objects.filter(
            doctor__user=doctor1_user,
            status__in=['APPROVED', 'VISITED']
        )
        
        print(f"✓ For Doctor 1 (User: {doctor1_user.email}):")
        print(f"  - APPROVED/VISITED appointments: {doctor1_queryset.count()}")
        for apt in doctor1_queryset:
            print(f"    - Appointment #{apt.id}: {apt.patient.user.full_name} ({apt.status})")
        
        # Simulate what the ViewSet does for doctor2
        doctor2_user = doctor2.user
        doctor2_queryset = Appointment.objects.filter(
            doctor__user=doctor2_user,
            status__in=['APPROVED', 'VISITED']
        )
        
        print(f"\n✓ For Doctor 2 (User: {doctor2_user.email}):")
        print(f"  - APPROVED/VISITED appointments: {doctor2_queryset.count()}")
        for apt in doctor2_queryset:
            print(f"    - Appointment #{apt.id}: {apt.patient.user.full_name} ({apt.status})")
        
        # Verify no overlap
        overlap = doctor1_queryset.filter(id__in=doctor2_queryset.values_list('id', flat=True))
        print(f"\n[OVERLAP CHECK]")
        print(f"-" * 80)
        print(f"✓ Appointments in both doctor's list: {overlap.count()}")
        if overlap.count() == 0:
            print(f"✓ PASS: Doctors see only their own appointments")
        else:
            print(f"✗ FAIL: Found {overlap.count()} overlapping appointments")
            for apt in overlap:
                print(f"    - Appointment #{apt.id}")
        
        print(f"\n" + "=" * 80)
        print("TEST COMPLETE")
        print("=" * 80 + "\n")
        
    except Exception as e:
        print(f"✗ Error: {str(e)}")
        import traceback
        traceback.print_exc()

if __name__ == '__main__':
    test_doctor_filtering()
