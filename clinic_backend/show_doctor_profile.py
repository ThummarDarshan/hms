#!/usr/bin/env python
"""
Doctor Profile Appointment Display Verification
Shows what each doctor will see in their profile with status indicators
"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'clinic_backend.settings')
django.setup()

from appointments.models import Appointment
from doctors.models import Doctor
from accounts.models import User

def show_doctor_profile():
    """Show what doctor sees in their appointments profile"""
    
    print("\n" + "=" * 90)
    print("DOCTOR PROFILE - APPOINTMENT DISPLAY")
    print("=" * 90)
    
    try:
        doctors = Doctor.objects.all().select_related('user')
        
        for doctor in doctors:
            print(f"\n{'=' * 90}")
            print(f"DR. {doctor.user.full_name.upper()} PROFILE")
            print(f"{'=' * 90}")
            print(f"Email: {doctor.user.email}")
            print(f"Department: {doctor.department.name if doctor.department else 'N/A'}")
            print(f"Consultation Fee: ₹{doctor.consultation_fee if doctor.consultation_fee else '0'}")
            
            # Get appointments for this doctor (what they see in backend)
            appointments = Appointment.objects.filter(doctor=doctor).select_related(
                'patient__user',
                'doctor__user'
            ).order_by('-appointment_date', '-appointment_time')
            
            # What backend filters for doctor view (only APPROVED and VISITED)
            doctor_view_appointments = appointments.filter(
                status__in=['APPROVED', 'VISITED']
            )
            
            print(f"\n📋 APPOINTMENTS IN DOCTOR'S PROFILE:")
            print(f"   Total appointments visible: {doctor_view_appointments.count()}")
            print(f"\n   {'ID':<5} {'PATIENT':<20} {'DATE':<12} {'TIME':<10} {'STATUS':<12} {'COLOR':<15}")
            print(f"   {'-'*85}")
            
            status_colors = {
                'PENDING': '🟡 Yellow (Awaiting Approval)',
                'APPROVED': '🔵 Blue (Approved, Not Visited)',
                'VISITED': '🟢 Green (Patient Visited)',
                'REJECTED': '🔴 Red (Rejected)',
                'CANCELLED': '⚫ Gray (Cancelled)',
            }
            
            if doctor_view_appointments.count() == 0:
                print(f"   No appointments visible")
            else:
                for apt in doctor_view_appointments:
                    color_info = status_colors.get(apt.status, '⚪ Default')
                    print(f"   {apt.id:<5} {apt.patient.user.full_name:<20} {str(apt.appointment_date):<12} {str(apt.appointment_time)[:8]:<10} {apt.status:<12} {color_info:<15}")
            
            # Show all appointments (including hidden ones)
            print(f"\n   ℹ️  All appointments for this doctor (including non-visible):")
            print(f"   {'ID':<5} {'PATIENT':<20} {'STATUS':<12} {'VISIBLE':<10}")
            print(f"   {'-'*50}")
            
            for apt in appointments:
                is_visible = "✓ Yes" if apt.status in ['APPROVED', 'VISITED'] else "✗ No"
                print(f"   {apt.id:<5} {apt.patient.user.full_name:<20} {apt.status:<12} {is_visible:<10}")
            
            print()
        
        print("\n" + "=" * 90)
        print("STATUS LEGEND FOR APPOINTMENT BADGES")
        print("=" * 90)
        print("""
   🟡 PENDING (Yellow)      - Waiting for admin approval. Not visible to doctor until approved.
   🔵 APPROVED (Blue)       - Admin approved but patient hasn't visited yet.
   🟢 VISITED (Green)       - Patient has visited and appointment is complete.
   🔴 REJECTED (Red)        - Admin rejected the appointment.
   ⚫ CANCELLED (Gray)       - Appointment has been cancelled.
        """)
        
        print("=" * 90)
        print("DOCTOR VISIBILITY RULES")
        print("=" * 90)
        print("""
   ✓ Doctors ONLY see: APPROVED and VISITED appointments
   ✗ Doctors CANNOT see: PENDING (not yet approved) or REJECTED (declined)
   
   This ensures:
   - Doctors don't see rejected appointments
   - Doctors see only approved appointments waiting for them
   - Doctors see completed visits they've had
   - Each doctor only sees their own appointments (not other doctors')
        """)
        
        print("=" * 90 + "\n")
        
    except Exception as e:
        print(f"✗ Error: {str(e)}")
        import traceback
        traceback.print_exc()

if __name__ == '__main__':
    show_doctor_profile()
