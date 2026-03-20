#!/usr/bin/env python
"""
Show what each role will see with the new test appointments
"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'clinic_backend.settings')
django.setup()

from appointments.models import Appointment

def show_role_views():
    """Show what each role sees"""
    
    # Get the test appointments
    test_apts = Appointment.objects.filter(reason__startswith='TEST-STATUS').order_by('id')
    
    print("\n" + "=" * 90)
    print("APPOINTMENT STATUS BADGE TEST - WHAT EACH ROLE SEES")
    print("=" * 90)
    
    # Admin view - sees all
    print("\n👨‍💼 ADMIN VIEW (All appointments)")
    print("-" * 90)
    print(f"{'ID':<5} {'PATIENT':<20} {'DOCTOR':<20} {'STATUS':<12} {'BADGE COLOR':<20} {'CSS CLASS':<30}")
    print("-" * 90)
    
    status_colors = {
        'PENDING': '🟡 Yellow',
        'APPROVED': '🔵 Blue',
        'VISITED': '🟢 Green',
        'REJECTED': '🔴 Red',
        'CANCELLED': '⚫ Gray',
    }
    
    css_classes = {
        'PENDING': 'badge badge-pending',
        'APPROVED': 'badge badge-approved',
        'VISITED': 'badge bg-green-100 text-green-800',
        'REJECTED': 'badge bg-red-100 text-red-800',
        'CANCELLED': 'badge badge-cancelled',
    }
    
    for apt in test_apts:
        print(f"{apt.id:<5} {apt.patient.user.full_name:<20} {apt.doctor.user.full_name:<20} {apt.status:<12} {status_colors.get(apt.status, 'Unknown'):<20} {css_classes.get(apt.status, 'default'):<30}")
    
    # Doctor view - sees only APPROVED and VISITED
    print("\n\n👨‍⚕️ DOCTOR VIEW (Only APPROVED & VISITED)")
    print("-" * 90)
    doctor_visible = test_apts.filter(status__in=['APPROVED', 'VISITED'])
    
    if doctor_visible.exists():
        print(f"{'ID':<5} {'PATIENT':<20} {'STATUS':<12} {'BADGE COLOR':<20}")
        print("-" * 90)
        for apt in doctor_visible:
            print(f"{apt.id:<5} {apt.patient.user.full_name:<20} {apt.status:<12} {status_colors.get(apt.status, 'Unknown'):<20}")
    else:
        print("No appointments visible to doctor")
    
    # Show hidden appointments
    print("\n\n🔒 HIDDEN FROM DOCTOR (PENDING, REJECTED, CANCELLED)")
    print("-" * 90)
    hidden = test_apts.exclude(status__in=['APPROVED', 'VISITED'])
    print(f"{'ID':<5} {'STATUS':<12} {'REASON':<40}")
    print("-" * 90)
    for apt in hidden:
        print(f"{apt.id:<5} {apt.status:<12} {'(Doctor cannot see this)':40}")
    
    print("\n" + "=" * 90)
    print("HOW TO TEST")
    print("=" * 90)
    print("""
1. LOGIN AS ADMIN (admin@admin.com):
   ✓ Go to Appointments page
   ✓ You should see 5 test appointments (#9-#13) with different colors:
     - #9 PENDING (Yellow badge)
     - #10 APPROVED (Blue badge)
     - #11 VISITED (Green badge)
     - #12 REJECTED (Red badge)
     - #13 CANCELLED (Gray badge)

2. LOGIN AS DOCTOR (shlok@gmail.com):
   ✓ Go to Appointments page  
   ✓ You should see ONLY 2 test appointments:
     - #10 APPROVED (Blue badge)
     - #11 VISITED (Green badge)
   ✓ Appointments #9, #12, #13 will NOT be visible

3. VERIFY BADGE COLORS:
   ✓ Each status should display in its designated color
   ✓ If all badges look the same, CSS classes may not be loading
    """)
    print("=" * 90 + "\n")

if __name__ == '__main__':
    show_role_views()
