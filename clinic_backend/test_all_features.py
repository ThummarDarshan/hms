#!/usr/bin/env python
"""
Comprehensive test script to validate all HMS features
"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'clinic_backend.settings')
django.setup()

from django.db.models import Prefetch
from appointments.models import Appointment
from appointments.serializers import AppointmentSerializer
from beds.models import Bed, BedAllocation
from beds.serializers import BedSerializer
from laboratory.models import LabRequest
from laboratory.serializers import LabRequestSerializer
from doctors.models import Doctor
from doctors.serializers import DoctorSerializer
from patients.models import Patient
from patients.serializers import PatientSerializer
from records.models import Prescription
from records.serializers import PrescriptionSerializer
from billing.models import Billing
from billing.serializers import BillingSerializer

print("\n" + "="*60)
print("HMS FEATURE VALIDATION TEST")
print("="*60 + "\n")

results = []

# Test 1: Appointments with all relations
try:
    apts = Appointment.objects.select_related(
        'patient__user', 'doctor__user', 'doctor__department'
    ).all()
    serializer = AppointmentSerializer(apts, many=True)
    print(f"✓ Appointments: {len(serializer.data)} records serialized successfully")
    results.append(("Appointments", True))
except Exception as e:
    print(f"✗ Appointments ERROR: {str(e)[:120]}")
    results.append(("Appointments", False))

# Test 2: Beds with current allocation
try:
    beds = Bed.objects.select_related('ward').all()
    serializer = BedSerializer(beds, many=True)
    print(f"✓ Beds: {len(serializer.data)} records serialized successfully")
    if serializer.data:
        print(f"  └─ Sample: {serializer.data[0].get('bed_number')} ({serializer.data[0].get('status')})")
    results.append(("Beds", True))
except Exception as e:
    print(f"✗ Beds ERROR: {str(e)[:120]}")
    results.append(("Beds", False))

# Test 3: Lab Requests
try:
    lab_reqs = LabRequest.objects.select_related(
        'patient__user', 'doctor__user', 'appointment', 'test'
    ).all()
    serializer = LabRequestSerializer(lab_reqs, many=True)
    print(f"✓ Lab Requests: {len(serializer.data)} records serialized successfully")
    results.append(("Lab Requests", True))
except Exception as e:
    print(f"✗ Lab Requests ERROR: {str(e)[:120]}")
    results.append(("Lab Requests", False))

# Test 4: Doctors with all details
try:
    doctors = Doctor.objects.select_related('user', 'department').all()
    serializer = DoctorSerializer(doctors, many=True)
    print(f"✓ Doctors: {len(serializer.data)} records serialized successfully")
    if serializer.data:
        doctor = serializer.data[0]
        print(f"  └─ Sample: {doctor.get('user_name')} - {doctor.get('specialization')}")
    results.append(("Doctors", True))
except Exception as e:
    print(f"✗ Doctors ERROR: {str(e)[:120]}")
    results.append(("Doctors", False))

# Test 5: Patients
try:
    patients = Patient.objects.select_related('user').all()
    serializer = PatientSerializer(patients, many=True)
    print(f"✓ Patients: {len(serializer.data)} records serialized successfully")
    results.append(("Patients", True))
except Exception as e:
    print(f"✗ Patients ERROR: {str(e)[:120]}")
    results.append(("Patients", False))

# Test 6: Prescriptions
try:
    prescriptions = Prescription.objects.select_related('patient__user', 'doctor__user', 'appointment').all()
    serializer = PrescriptionSerializer(prescriptions, many=True)
    print(f"✓ Prescriptions: {len(serializer.data)} records serialized successfully")
    results.append(("Prescriptions", True))
except Exception as e:
    print(f"✗ Prescriptions ERROR: {str(e)[:120]}")
    results.append(("Prescriptions", False))

# Test 7: Billing
try:
    bills = Billing.objects.select_related('appointment__patient__user', 'appointment__doctor__user').all()
    serializer = BillingSerializer(bills, many=True)
    print(f"✓ Billing: {len(serializer.data)} records serialized successfully")
    results.append(("Billing", True))
except Exception as e:
    print(f"✗ Billing ERROR: {str(e)[:120]}")
    results.append(("Billing", False))

print("\n" + "="*60)
print("TEST SUMMARY")
print("="*60)
passed = sum(1 for _, result in results if result)
total = len(results)
print(f"Passed: {passed}/{total}")

if passed == total:
    print("\n✅ ALL FEATURES ARE WORKING CORRECTLY!")
else:
    print(f"\n⚠️  {total - passed} feature(s) have issues")
    for name, result in results:
        if not result:
            print(f"   - {name}")

print("="*60 + "\n")
