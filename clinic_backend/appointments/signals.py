from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import Appointment
from billing.models import Billing
from doctors.models import Doctor
from decimal import Decimal
import uuid

@receiver(post_save, sender=Appointment)
def create_billing_for_appointment(sender, instance, created, **kwargs):
    """
    Signal to automatically create a billing record when an appointment is created.
    This ensures billing always exists for an appointment.
    """
    if created and not Billing.objects.filter(appointment=instance).exists():
        try:
            doctor_fee = Decimal('0.00')
            if instance.doctor and instance.doctor.consultation_fee:
                doctor_fee = Decimal(str(instance.doctor.consultation_fee))
            
            # Calculate hospital charge as 10% of doctor fee
            hospital_charge = doctor_fee * Decimal('0.10')
            
            # Total amount initially includes doctor fee and hospital charge
            # Lab charges will be added when lab report is uploaded
            total_amount = doctor_fee + hospital_charge
            
            Billing.objects.create(
                appointment=instance,
                patient=instance.patient,
                doctor_fee=doctor_fee,
                hospital_charge=hospital_charge,
                lab_charge=Decimal('0.00'),  # Will be updated when lab report is added
                bed_charge=Decimal('0.00'),  # Will be updated if bed is needed
                total_amount=total_amount,
                final_amount=total_amount,
                invoice_number=f"INV-{uuid.uuid4().hex[:8].upper()}"
            )
        except Exception as e:
            print(f"Error creating billing for appointment {instance.id}: {str(e)}")
