#!/usr/bin/env python
"""
Create Lab Technician User Account
"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'clinic_backend.settings')
django.setup()

from accounts.models import User

def create_lab_technician():
    """Create a lab technician user account"""
    
    # Check if lab technician already exists
    if User.objects.filter(email='labtechnicician@hms.com').exists():
        print("✗ Lab technician user already exists")
        return
    
    try:
        lab_tech = User.objects.create_user(
            email='labtechnicician@hms.com',
            password='labtechpass123',
            first_name='Lab',
            last_name='Technician',
            phone_number='9876543210',
            role='LAB_TECHNICIAN',
            is_active=True,
            is_staff=True,
        )
        
        print(f"✓ Lab technician account created successfully!")
        print(f"  Email: {lab_tech.email}")
        print(f"  Password: labtechpass123")
        print(f"  Role: {lab_tech.role}")
        print(f"  Status: Active")
        
    except Exception as e:
        print(f"✗ Error creating lab technician: {str(e)}")

if __name__ == '__main__':
    create_lab_technician()
