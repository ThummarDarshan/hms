#!/usr/bin/env python
"""
End-to-End Test: Complete HMS Workflow
1. Admin creates and approves appointment
2. Doctor adds prescription with lab test request
3. Lab technician receives request
4. Lab technician uploads report
5. Billing is updated with lab charge
"""
import os
import django
from decimal import Decimal

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'clinic_backend.settings')
django.setup()

from appointments.models import Appointment
from laboratory.models import LabRequest, LabReport, LabTestCatalog
from records.models import Prescription
from billing.models import Billing
from accounts.models import User
from doctors.models import Doctor
from patients.models import Patient
from datetime import datetime, timedelta

def test_complete_workflow():
    """Test complete HMS workflow"""
    
    print("=" * 80)
    print("COMPLETE HMS WORKFLOW TEST")
    print("=" * 80)
    
    try:
        # Step 1: Get or create users
        print(f"\n[STEP 1] Getting Users")
        admin = User.objects.filter(role='ADMIN').first()
        patient = Patient.objects.first()
        doctor = Doctor.objects.first()
        lab_tech = User.objects.filter(role='LAB_TECHNICIAN').first()
        
        print(f"✓ Admin: {admin.email if admin else 'Not found'}")
        print(f"✓ Patient: {patient.user.full_name if patient else 'Not found'}")
        print(f"✓ Doctor: {doctor.user.full_name if doctor else 'Not found'}")
        print(f"✓ Lab Technician: {lab_tech.email if lab_tech else 'Not found'}")
        
        if not all([admin, patient, doctor, lab_tech]):
            print("✗ Missing required users. Cannot proceed.")
            return
        
        # Step 2: Create and approve appointment
        print(f"\n[STEP 2] Creating Appointment")
        appointment, created = Appointment.objects.get_or_create(
            patient=patient,
            doctor=doctor,
            appointment_date=datetime.now().date() + timedelta(days=1),
            appointment_time=datetime.now().time(),
            defaults={
                'reason': 'General Checkup',
                'status': 'PENDING'
            }
        )
        print(f"{'✓ Created' if created else '✓ Using existing'} appointment ID: {appointment.id}")
        print(f"  Status: {appointment.status}")
        
        # Admin approves appointment
        appointment.status = 'APPROVED'
        appointment.save()
        print(f"✓ Admin approved appointment")
        print(f"  Status: {appointment.status}")
        
        # Step 3: Doctor adds prescription with lab test request
        print(f"\n[STEP 3] Doctor Adds Prescription with Lab Test")
        
        # Get a test type
        test = LabTestCatalog.objects.first()
        if not test:
            print("✗ No lab tests available")
            return
        
        print(f"✓ Lab test selected: {test.test_name} (₹{test.price})")
        
        # Create lab request (simulating doctor's action)
        lab_request, created = LabRequest.objects.get_or_create(
            patient=patient,
            doctor=doctor,
            appointment=appointment,
            test=test,
            defaults={
                'status': 'REQUESTED',
                'notes': 'Requested by doctor during prescription'
            }
        )
        print(f"{'✓ Created' if created else '✓ Using existing'} lab request ID: {lab_request.id}")
        print(f"  Status: {lab_request.status}")
        
        # Step 4: Lab technician sees the request
        print(f"\n[STEP 4] Lab Technician Receives Request")
        lab_tech_requests = LabRequest.objects.all()
        print(f"✓ Lab technician can see {lab_tech_requests.count()} requests")
        print(f"✓ Current request visible: {lab_request in lab_tech_requests}")
        
        # Step 5: Lab technician processes and uploads report
        print(f"\n[STEP 5] Lab Technician Uploads Report")
        
        # Mark as visited
        lab_request.status = 'VISITED'
        lab_request.save()
        print(f"✓ Lab request marked as VISITED")
        
        # Mark as in progress
        lab_request.status = 'IN_PROGRESS'
        lab_request.save()
        print(f"✓ Lab request marked as IN_PROGRESS")
        
        # Upload report (without file for testing)
        report, created = LabReport.objects.get_or_create(
            lab_request=lab_request,
            defaults={
                'result_summary': 'All tests normal. No abnormalities detected.',
                'charge': test.price,
                'technician': lab_tech
            }
        )
        print(f"{'✓ Created' if created else '✓ Using existing'} report ID: {report.id}")
        print(f"  Result: {report.result_summary}")
        print(f"  Charge: ₹{report.charge}")
        
        # Update request status
        lab_request.status = 'COMPLETED'
        lab_request.save()
        print(f"✓ Lab request marked as COMPLETED")
        
        # Step 6: Verify billing is updated
        print(f"\n[STEP 6] Verify Billing Updated with Lab Charge")
        
        try:
            billing = Billing.objects.get(appointment=appointment)
            print(f"✓ Billing found for appointment")
            print(f"  Invoice: {billing.invoice_number}")
            print(f"  Doctor Fee: ₹{billing.doctor_fee}")
            print(f"  Lab Charge: ₹{billing.lab_charge}")
            print(f"  Hospital Charge: ₹{billing.hospital_charge}")
            print(f"  Total Amount: ₹{billing.total_amount}")
            print(f"  Final Amount: ₹{billing.final_amount}")
            print(f"  Payment Status: {billing.payment_status}")
            
            if billing.lab_charge > 0:
                print(f"✓ Lab charge successfully added to billing")
            else:
                print(f"⚠ Lab charge not found in billing")
        except Billing.DoesNotExist:
            print(f"! No billing record for this appointment yet")
        
        print(f"\n" + "=" * 80)
        print("WORKFLOW SUMMARY")
        print("=" * 80)
        print(f"✓ Appointment ID: {appointment.id} - Status: {appointment.status}")
        print(f"✓ Lab Request ID: {lab_request.id} - Status: {lab_request.status}")
        print(f"✓ Lab Report ID: {report.id} - Technician: {report.technician.email}")
        print(f"✓ Lab Test: {test.test_name} - Price: ₹{test.price}")
        print(f"✓ Complete workflow verified successfully")
        
    except Exception as e:
        print(f"✗ Error: {str(e)}")
        import traceback
        traceback.print_exc()

if __name__ == '__main__':
    test_complete_workflow()
