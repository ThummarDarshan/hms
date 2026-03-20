from django.contrib import admin
from .models import LabTestCatalog, LabRequest, LabReport, LabEquipment

@admin.register(LabTestCatalog)
class LabTestCatalogAdmin(admin.ModelAdmin):
    list_display = ('test_name', 'test_code', 'category', 'price', 'turnaround_time')
    search_fields = ('test_name', 'test_code')
    list_filter = ('category',)

@admin.register(LabEquipment)
class LabEquipmentAdmin(admin.ModelAdmin):
    list_display = ('equipment_name', 'model', 'status', 'location')
    search_fields = ('equipment_name', 'serial_number')
    list_filter = ('status', 'location')

@admin.register(LabRequest)
class LabRequestAdmin(admin.ModelAdmin):
    list_display = ('id', 'patient', 'doctor', 'test', 'status', 'requested_at')
    list_filter = ('status',)
    search_fields = ('patient__user__first_name', 'patient__user__last_name', 'doctor__user__first_name')

@admin.register(LabReport)
class LabReportAdmin(admin.ModelAdmin):
    list_display = ('id', 'lab_request', 'technician', 'charge', 'uploaded_at')
    search_fields = ('lab_request__patient__user__first_name', 'lab_request__patient__user__last_name')
