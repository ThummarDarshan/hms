from django.db import models
from accounts.models import User
from patients.models import Patient
from doctors.models import Doctor
from appointments.models import Appointment

class LabTestType(models.Model):
    test_name = models.CharField(max_length=255)
    description = models.TextField(blank=True, null=True)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'lab_test_types'

    def __str__(self):
        return self.test_name


class LabRequest(models.Model):
    STATUS_CHOICES = [
        ('REQUESTED', 'Requested'),
        ('VISITED', 'Visited'),
        ('IN_PROGRESS', 'In Progress'),
        ('COMPLETED', 'Completed'),
    ]

    patient = models.ForeignKey(Patient, on_delete=models.CASCADE, related_name='lab_requests')
    doctor = models.ForeignKey(Doctor, on_delete=models.CASCADE, related_name='lab_requests')
    appointment = models.ForeignKey(Appointment, on_delete=models.CASCADE, related_name='lab_requests', null=True, blank=True)
    test = models.ForeignKey(LabTestType, on_delete=models.CASCADE, related_name='lab_requests')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='REQUESTED')
    notes = models.TextField(blank=True, null=True)
    requested_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'lab_requests'

    def __str__(self):
        return f"Lab Request #{self.id} for {self.patient.user.full_name}"


class LabReport(models.Model):
    lab_request = models.ForeignKey(LabRequest, on_delete=models.CASCADE, related_name='reports')
    report_file = models.FileField(upload_to='lab_reports/', null=True, blank=True)
    result_summary = models.TextField(blank=True, null=True)
    charge = models.DecimalField(max_digits=10, decimal_places=2, default=0, help_text="Charge in Indian Rupees (₹)")
    technician = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='processed_reports', limit_choices_to={'role': 'LAB_TECHNICIAN'})
    uploaded_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'lab_reports'

    def __str__(self):
        return f"Report for Request #{self.lab_request.id}"
