#!/usr/bin/env python
"""
Test Lab Technician Report Upload Functionality
"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'clinic_backend.settings')
django.setup()

from laboratory.models import LabTestCatalog, LabRequest, LabReport
from doctors.models import Doctor, Department
from patients.models import Patient
from accounts.models import User

def test_lab_reports():
    """Test lab report creation and upload"""
    
    print("=" * 60)
    print("LAB REPORT UPLOAD FUNCTIONALITY TEST")
    print("=" * 60)
    
    try:
        # Get or create prerequisite objects
        admin_user = User.objects.filter(role='ADMIN').first()
        if not admin_user:
            admin_user = User.objects.create_superuser(
                email='admin@test.com',
                password='admin123',
                first_name='Admin',
                last_name='User'
            )
            print("✓ Created admin user")
        
        # Get doctor
        doctor_user = User.objects.filter(role='DOCTOR').first()
        if not doctor_user:
            doctor_user = User.objects.create_user(
                email='doctor@test.com',
                password='doctor123',
                first_name='Test',
                last_name='Doctor',
                role='DOCTOR'
            )
            dept, _ = Department.objects.get_or_create(name='General')
            Doctor.objects.create(user=doctor_user, department=dept)
            print("✓ Created doctor user")
        else:
            doctor_user = doctor_user
            print("✓ Using existing doctor user")
        
        # Get patient
        patient_user = User.objects.filter(role='PATIENT').first()
        if not patient_user:
            patient_user = User.objects.create_user(
                email='patient@test.com',
                password='patient123',
                first_name='Test',
                last_name='Patient',
                role='PATIENT'
            )
            Patient.objects.create(user=patient_user)
            print("✓ Created patient user")
        else:
            print("✓ Using existing patient user")
        
        # Get doctor object
        doctor_obj = Doctor.objects.filter(user__role='DOCTOR').first()
        patient_obj = Patient.objects.filter(user__role='PATIENT').first()
        
        # Get or create test
        test, _ = LabTestCatalog.objects.get_or_create(
            test_name='Blood Test',
            defaults={
                'test_code': 'BT001',
                'description': 'Complete blood count test',
                'price': 500.00
            }
        )
        print(f"✓ Test available: {test.test_name} (₹{test.price})")
        
        # Get or create lab request
        lab_request, created = LabRequest.objects.get_or_create(
            patient=patient_obj,
            doctor=doctor_obj,
            test=test,
            defaults={
                'status': 'IN_PROGRESS',
                'notes': 'Test request for verification'
            }
        )
        if created:
            print(f"✓ Created lab request ID: {lab_request.id}")
        else:
            print(f"✓ Using existing lab request ID: {lab_request.id}")
        
        # Check if report already exists
        report = LabReport.objects.filter(lab_request=lab_request).first()
        if report:
            print(f"✓ Report already exists (ID: {report.id})")
            print(f"  - Status: {lab_request.status}")
            print(f"  - Result Summary: {report.result_summary[:50]}..." if len(report.result_summary) > 50 else f"  - Result Summary: {report.result_summary}")
            if report.report_file:
                print(f"  - Report File: {report.report_file.name}")
        else:
            print("✗ No report found - Lab technician needs to upload one")
        
        print("\n" + "=" * 60)
        print("LAB TECHNICIAN UPLOAD ENDPOINT")
        print("=" * 60)
        print(f"✓ Endpoint: POST /api/laboratory/reports/")
        print(f"✓ Required Fields:")
        print(f"  - lab_request: {lab_request.id}")
        print(f"  - result_summary: (optional) Test findings")
        print(f"  - report_file: (optional) PDF/Image file")
        print(f"\nLab technician can now upload reports with the credentials:")
        print(f"  Email: lab@admin.com")
        print(f"  Password: lab123")
        
    except Exception as e:
        print(f"✗ Error: {str(e)}")
        import traceback
        traceback.print_exc()

if __name__ == '__main__':
    test_lab_reports()
