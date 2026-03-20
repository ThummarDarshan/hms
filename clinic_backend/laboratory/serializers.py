from rest_framework import serializers
from .models import LabTestCatalog, LabRequest, LabReport, LabEquipment
from accounts.serializers import UserSerializer
from accounts.validators import HMSValidators
from patients.serializers import PatientSerializer
from doctors.serializers import DoctorSerializer
from appointments.serializers import AppointmentSerializer


class LabTestCatalogSerializer(serializers.ModelSerializer):
    class Meta:
        model = LabTestCatalog
        fields = '__all__'


class LabEquipmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = LabEquipment
        fields = '__all__'


class LabRequestSerializer(serializers.ModelSerializer):
    """Comprehensive validation for lab requests"""
    patient_details = PatientSerializer(source='patient', read_only=True)
    doctor_details = DoctorSerializer(source='doctor', read_only=True)
    appointment_details = AppointmentSerializer(source='appointment', read_only=True)
    test_details = LabTestCatalogSerializer(source='test', read_only=True)
    patient_name = serializers.CharField(source='patient.user.full_name', read_only=True)
    doctor_name = serializers.CharField(source='doctor.user.full_name', read_only=True)
    reports = serializers.SerializerMethodField()

    class Meta:
        model = LabRequest
        fields = ['id', 'patient', 'doctor', 'appointment', 'test', 
                 'patient_details', 'doctor_details', 'appointment_details', 'test_details',
                 'patient_name', 'doctor_name', 'status', 'notes', 'requested_at', 'reports']
        read_only_fields = ['patient_details', 'doctor_details', 'appointment_details', 
                           'test_details', 'patient_name', 'doctor_name', 'requested_at', 'reports']
    
    def validate_patient(self, value):
        """Validate patient exists"""
        if not value:
            raise serializers.ValidationError("Patient is required")
        return value
    
    def validate_test(self, value):
        """Validate test exists"""
        if not value:
            raise serializers.ValidationError("Lab test type is required")
        return value
    
    def validate_notes(self, value):
        """Validate notes"""
        if value and len(value) > 1000:
            raise serializers.ValidationError("Notes must not exceed 1000 characters")
        return value or ""
    
    def validate_status(self, value):
        """Validate status"""
        valid_statuses = ['REQUESTED', 'VISITED', 'IN_PROGRESS', 'COMPLETED']
        if value not in valid_statuses:
            raise serializers.ValidationError(
                f"Status must be one of: {', '.join(valid_statuses)}"
            )
        return value

    def get_reports(self, obj):
        return [
            {
                'id': r.id,
                'report_file': r.report_file.url if bool(r.report_file) else None,
                'result_summary': r.result_summary,
                'uploaded_at': r.uploaded_at
            }
            for r in obj.reports.all()
        ]


class LabReportSerializer(serializers.ModelSerializer):
    """Comprehensive validation for lab reports"""
    lab_request_details = LabRequestSerializer(source='lab_request', read_only=True)
    technician_details = UserSerializer(source='technician', read_only=True)

    class Meta:
        model = LabReport
        fields = '__all__'
    
    def validate_lab_request(self, value):
        """Validate lab request exists"""
        if not value:
            raise serializers.ValidationError("Lab request is required")
        return value
    
    def validate_technician(self, value):
        """Validate technician exists"""
        if not value:
            raise serializers.ValidationError("Technician is required")
        return value
    
    def validate_report_file(self, value):
        """Validate report file (optional)"""
        if value:
            # Validate file type and size only if provided
            allowed_extensions = ['pdf', 'jpg', 'jpeg', 'png', 'doc', 'docx']
            return HMSValidators.validate_file(value, allowed_extensions, max_size_mb=50)
        return value
    
    def validate_result_summary(self, value):
        """Validate result summary (optional)"""
        if value:
            if not value.strip():
                raise serializers.ValidationError("Result summary cannot be empty")
            if len(value.strip()) < 5:
                raise serializers.ValidationError("Result summary must be at least 5 characters")
            if len(value.strip()) > 2000:
                raise serializers.ValidationError("Result summary must not exceed 2000 characters")
            return value.strip()
        return value or ""

