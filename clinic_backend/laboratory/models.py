from django.db import models
from accounts.models import User
from patients.models import Patient
from doctors.models import Doctor
from appointments.models import Appointment

class LabTestCatalog(models.Model):
    CATEGORY_CHOICES = [
        ('BLOOD', 'Blood Test'),
        ('URINE', 'Urine Test'),
        ('IMAGING', 'Imaging'),
        ('CARDIO', 'Cardiology'),
        ('BIOCHEMISTRY', 'Biochemistry'),
        ('MICROBIOLOGY', 'Microbiology'),
        ('HORMONE', 'Hormone Assay'),
        ('SEROLOGY', 'Serology'),
        ('OTHER', 'Other'),
    ]

    test_name = models.CharField(max_length=255)
    test_code = models.CharField(max_length=20, unique=True)
    category = models.CharField(max_length=20, choices=CATEGORY_CHOICES, default='OTHER')
    description = models.TextField(blank=True, null=True)
    
    # Fields for numeric ranges
    normal_range_min = models.DecimalField(max_digits=10, decimal_places=2, blank=True, null=True)
    normal_range_max = models.DecimalField(max_digits=10, decimal_places=2, blank=True, null=True)
    
    # Field for textual representation of normal range
    normal_range_text = models.CharField(max_length=255, blank=True, null=True, help_text="e.g., 'Negative' or 'See individual parameters'")
    
    unit = models.CharField(max_length=20, blank=True, null=True)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    sample_type = models.CharField(max_length=100, blank=True, null=True)
    preparation_instructions = models.TextField(blank=True, null=True)
    turnaround_time = models.CharField(max_length=50, blank=True, null=True, help_text="e.g., '24-48 hours'")
    
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'lab_test_catalog'
        verbose_name = 'Lab Test Catalog'
        verbose_name_plural = 'Lab Test Catalog'

    def __str__(self):
        return f"{self.test_name} ({self.test_code})"


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
    test = models.ForeignKey(
        LabTestCatalog, on_delete=models.CASCADE, related_name='lab_requests')
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


class LabEquipment(models.Model):
    STATUS_CHOICES = [
        ('WORKING', 'Working'),
        ('UNDER_MAINTENANCE', 'Under Maintenance'),
        ('OUT_OF_ORDER', 'Out of Order'),
    ]

    equipment_name = models.CharField(max_length=255)
    model = models.CharField(max_length=100, blank=True, null=True)
    serial_number = models.CharField(max_length=100, unique=True)
    manufacturer = models.CharField(max_length=100, blank=True, null=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='WORKING')
    location = models.CharField(max_length=100, blank=True, null=True)
    last_maintenance_date = models.DateField(blank=True, null=True)
    next_maintenance_date = models.DateField(blank=True, null=True)

    class Meta:
        db_table = 'lab_equipment'

    def __str__(self):
        return self.equipment_name
