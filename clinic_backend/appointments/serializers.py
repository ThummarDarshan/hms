from rest_framework import serializers
from datetime import datetime, timedelta
from .models import Appointment
from accounts.validators import HMSValidators

class SimplePatientSerializer(serializers.Serializer):
    """Simplified patient serializer for nested use in appointments"""
    id = serializers.IntegerField()
    user_name = serializers.CharField(source='user.full_name')
    user_email = serializers.CharField(source='user.email')
    uhid = serializers.CharField()

class SimpleDoctorSerializer(serializers.Serializer):
    """Simplified doctor serializer for nested use in appointments"""
    id = serializers.IntegerField()
    user_name = serializers.CharField(source='user.full_name')
    user_email = serializers.CharField(source='user.email')
    specialization = serializers.CharField()
    department_name = serializers.CharField(source='department.name')

class AppointmentSerializer(serializers.ModelSerializer):
    """Comprehensive validation for appointments"""
    patient_details = SimplePatientSerializer(source='patient', read_only=True)
    doctor_details = SimpleDoctorSerializer(source='doctor', read_only=True)
    patient_name = serializers.CharField(source='patient.user.full_name', read_only=True)
    patient_uhid = serializers.CharField(source='patient.uhid', read_only=True)
    doctor_name = serializers.CharField(source='doctor.user.full_name', read_only=True)
    has_billing = serializers.SerializerMethodField()
    billing_status = serializers.SerializerMethodField()
    has_prescription = serializers.SerializerMethodField()
    prescription_id = serializers.SerializerMethodField()
    prescription_info = serializers.SerializerMethodField()
    
    class Meta:
        model = Appointment
        fields = ['id', 'patient', 'doctor', 'appointment_date', 'appointment_time', 
                  'reason', 'status', 'notes', 'patient_details', 'doctor_details', 
                  'patient_name', 'patient_uhid', 'doctor_name', 'has_billing', 'billing_status', 
                  'has_prescription', 'prescription_id', 'prescription_info', 'created_at', 'updated_at']
        read_only_fields = ['patient_details', 'doctor_details', 'patient_name', 'patient_uhid', 
                           'doctor_name', 'has_billing', 'billing_status', 'has_prescription', 
                           'prescription_id', 'prescription_info', 'created_at', 'updated_at']
    
    def validate_patient(self, value):
        """Validate patient exists"""
        if not value:
            raise serializers.ValidationError("Patient is required")
        
        return value
    
    def validate_doctor(self, value):
        """Validate doctor exists"""
        if not value:
            raise serializers.ValidationError("Doctor is required")
        
        if not value.is_available:
            raise serializers.ValidationError("Selected doctor is not available")
        
        return value
    
    def validate_appointment_date(self, value):
        """Validate appointment date"""
        if not value:
            raise serializers.ValidationError("Appointment date is required")
        
        # Check if date is in the future
        if value < datetime.now().date():
            raise serializers.ValidationError("Appointment date must be in the future")
        
        # Check if not too far in future (e.g., more than 6 months)
        max_date = datetime.now().date() + timedelta(days=180)
        if value > max_date:
            raise serializers.ValidationError("Appointment cannot be booked more than 6 months in advance")
        
        return value
    
    def validate_appointment_time(self, value):
        """Validate appointment time"""
        if not value:
            raise serializers.ValidationError("Appointment time is required")
        
        # Check if time is in valid range (e.g., 9 AM to 6 PM)
        try:
            time_obj = datetime.strptime(str(value), "%H:%M:%S").time()
        except:
            raise serializers.ValidationError("Invalid time format")
        
        return value
    
    def validate_reason(self, value):
        """Validate reason for appointment"""
        if not value or not value.strip():
            raise serializers.ValidationError("Reason for appointment is required")
        
        if len(value.strip()) < 5:
            raise serializers.ValidationError("Reason must be at least 5 characters")
        
        if len(value.strip()) > 500:
            raise serializers.ValidationError("Reason must not exceed 500 characters")
        
        return value.strip()
    
    def validate_status(self, value):
        """Validate appointment status"""
        valid_statuses = ['SCHEDULED', 'COMPLETED', 'CANCELLED', 'NO_SHOW']
        
        if value not in valid_statuses:
            raise serializers.ValidationError(
                f"Status must be one of: {', '.join(valid_statuses)}"
            )
        
        return value
    
    def validate_notes(self, value):
        """Validate appointment notes"""
        if value and len(value) > 1000:
            raise serializers.ValidationError("Notes must not exceed 1000 characters")
        
        return value or ""
    
    def validate(self, attrs):
        """Validate appointment date and time are not conflicting"""
        patient = attrs.get('patient')
        doctor = attrs.get('doctor')
        appointment_date = attrs.get('appointment_date')
        appointment_time = attrs.get('appointment_time')
        
        # Check for conflicting appointments
        if patient and appointment_date and appointment_time:
            # For patient - check if another appointment exists at same time
            conflicting_patient = Appointment.objects.filter(
                patient=patient,
                appointment_date=appointment_date,
                appointment_time=appointment_time,
                status__in=['SCHEDULED', 'COMPLETED']
            ).exclude(id=self.instance.id if self.instance else None).exists()
            
            if conflicting_patient:
                raise serializers.ValidationError({
                    "non_field_errors": ["Patient already has an appointment at this date and time"]
                })
            
            # For doctor - check if doctor has another appointment at same time
            if doctor:
                conflicting_doctor = Appointment.objects.filter(
                    doctor=doctor,
                    appointment_date=appointment_date,
                    appointment_time=appointment_time,
                    status__in=['SCHEDULED', 'COMPLETED']
                ).exclude(id=self.instance.id if self.instance else None).exists()
                
                if conflicting_doctor:
                    raise serializers.ValidationError({
                        "non_field_errors": ["Doctor is not available at this date and time"]
                    })
        
        return attrs
    
    def get_has_billing(self, obj):
        """Check if appointment has associated billing"""
        try:
            return hasattr(obj, 'billing') and obj.billing is not None
        except:
            return False
    
    def get_billing_status(self, obj):
        """Get billing status if exists"""
        try:
            if hasattr(obj, 'billing') and obj.billing:
                return obj.billing.payment_status
        except:
            pass
        return None

    def get_has_prescription(self, obj):
        """Check if appointment has associated prescription"""
        try:
            return obj.prescriptions.exists()
        except:
            return False

    def get_prescription_id(self, obj):
        """Get ID of the first associated prescription if exists"""
        try:
            first = obj.prescriptions.first()
            return first.id if first else None
        except:
            return None
            
    def get_prescription_info(self, obj):
        """Get basic info of the prescription"""
        try:
            first = obj.prescriptions.first()
            if first:
                return {
                    'diagnosis': first.diagnosis,
                    'medications': first.medications,
                    'instructions': first.instructions
                }
            return None
        except:
            return None
