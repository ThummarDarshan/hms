from django.contrib import admin
from .models import LabTestType, LabRequest, LabReport

@admin.register(LabTestType)
class LabTestTypeAdmin(admin.ModelAdmin):
    list_display = ('test_name', 'price', 'created_at')
    search_fields = ('test_name',)

@admin.register(LabRequest)
class LabRequestAdmin(admin.ModelAdmin):
    list_display = ('id', 'patient', 'doctor', 'test', 'status', 'requested_at')
    list_filter = ('status',)
    search_fields = ('patient__user__first_name', 'patient__user__last_name', 'doctor__user__first_name')

@admin.register(LabReport)
class LabReportAdmin(admin.ModelAdmin):
    list_display = ('id', 'lab_request', 'technician', 'charge', 'uploaded_at')
    search_fields = ('lab_request__patient__user__first_name', 'lab_request__patient__user__last_name')
