from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import LabReport
from billing.models import Billing
from decimal import Decimal

@receiver(post_save, sender=LabReport)
def update_billing_on_lab_report(sender, instance, created, **kwargs):
    """
    Signal to update billing when a lab report is created/updated.
    Adds the lab test charge to the patient's billing.
    """
    if created and instance.lab_request.appointment:
        try:
            lab_request = instance.lab_request
            test_price = Decimal(str(lab_request.test.price)) if lab_request.test.price else Decimal('0.00')
            
            billing, _ = Billing.objects.get_or_create(
                appointment=lab_request.appointment,
                defaults={
                    'patient': lab_request.patient,
                    'doctor_fee': Decimal('0.00'),
                    'hospital_charge': Decimal('0.00'),
                    'lab_charge': test_price,
                    'total_amount': test_price,
                    'final_amount': test_price,
                    'invoice_number': f"INV-{instance.id}"
                }
            )
            
            if billing and test_price > 0:
                # Add lab charge to existing billing
                billing.lab_charge += test_price
                billing.total_amount += test_price
                
                # Recalculate discount
                if billing.discount_percentage > 0:
                    discount = (billing.total_amount * Decimal(billing.discount_percentage)) / 100
                    billing.discount_amount = discount
                    billing.final_amount = billing.total_amount - discount
                else:
                    billing.final_amount = billing.total_amount
                
                billing.save()
        except Exception as e:
            print(f"Error updating billing for lab report {instance.id}: {str(e)}")
