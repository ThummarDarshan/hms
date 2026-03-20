#!/usr/bin/env python
"""
Update Lab Technician User Credentials
"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'clinic_backend.settings')
django.setup()

from accounts.models import User

def update_lab_technician():
    """Update lab technician user credentials"""
    
    try:
        # Find the existing lab technician
        lab_tech = User.objects.get(role='LAB_TECHNICIAN')
        
        # Update email and password
        lab_tech.email = 'lab@admin.com'
        lab_tech.set_password('lab123')
        lab_tech.save()
        
        print(f"✓ Lab technician credentials updated successfully!")
        print(f"  Email: {lab_tech.email}")
        print(f"  Password: lab123")
        print(f"  Role: {lab_tech.role}")
        print(f"  Status: Active")
        
    except User.DoesNotExist:
        print("✗ Lab technician user not found")
    except Exception as e:
        print(f"✗ Error updating lab technician: {str(e)}")

if __name__ == '__main__':
    update_lab_technician()
