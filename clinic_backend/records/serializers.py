from rest_framework import serializers
from datetime import datetime, timedelta, date
from .models import Prescription
from appointments.models import Appointment
from beds.models import BedRequest
from accounts.validators import HMSValidators

class PrescriptionSerializer(serializers.ModelSerializer):
    """Comprehensive validation for prescriptions"""
    patient_name = serializers.CharField(source='patient.user.full_name', read_only=True)
    patient_uhid = serializers.CharField(source='patient.uhid', read_only=True)
    doctor_name = serializers.CharField(source='doctor.user.full_name', read_only=True)
    appointment_reason = serializers.CharField(source='appointment.reason', read_only=True)
    billing_status = serializers.SerializerMethodField()
    billing_invoice = serializers.SerializerMethodField()
    patient_gender = serializers.CharField(source='patient.gender', read_only=True)
    patient_age = serializers.SerializerMethodField()
    
    class Meta:
        model = Prescription
        fields = [
            'id', 'appointment', 'patient', 'doctor', 'patient_name', 'patient_uhid', 'doctor_name',
            'patient_gender', 'patient_age',
            'appointment_reason', 'diagnosis', 'medications', 'instructions',
            'follow_up_date', 'billing_status', 'billing_invoice', 'created_at', 'updated_at',
            'bed_required', 'expected_bed_days'
        ]
        read_only_fields = ['created_at', 'updated_at', 'patient', 'doctor', 'patient_name', 'patient_uhid', 'doctor_name', 'appointment_reason', 'billing_status', 'billing_invoice']
    
    def validate_appointment(self, value):
        """Validate appointment exists and is completed"""
        if not value:
            raise serializers.ValidationError("Appointment is required")
        
        # Check if appointment already has a prescription
        if not self.instance and value.prescriptions.exists():
            raise serializers.ValidationError(
                "A prescription already exists for this appointment"
            )
        
        return value
    
    def validate_diagnosis(self, value):
        """Validate diagnosis"""
        if not value or not value.strip():
            raise serializers.ValidationError("Diagnosis is required")
        
        if len(value.strip()) < 5:
            raise serializers.ValidationError("Diagnosis must be at least 5 characters")
        
        if len(value.strip()) > 500:
            raise serializers.ValidationError("Diagnosis must not exceed 500 characters")
        
        return value.strip()
    
    def validate_medications(self, value):
        """Validate medications"""
        if not value or not value.strip():
            raise serializers.ValidationError("Medications are required")
        
        if len(value.strip()) < 5:
            raise serializers.ValidationError("Medications must be at least 5 characters")
        
        if len(value.strip()) > 2000:
            raise serializers.ValidationError("Medications must not exceed 2000 characters")
        
        return value.strip()
    
    def validate_instructions(self, value):
        """Validate instructions"""
        if value and len(value) > 1000:
            raise serializers.ValidationError("Instructions must not exceed 1000 characters")
        
        return value or ""
    
    def validate_follow_up_date(self, value):
        """Validate follow-up date"""
        if value:
            if value < date.today():
                raise serializers.ValidationError("Follow-up date cannot be in the past")
            
            # Check if not too far in future (e.g., more than 1 year)
            max_date = date.today() + timedelta(days=365)
            if value > max_date:
                raise serializers.ValidationError("Follow-up date cannot be more than 1 year in the future")
        
        return value
    
    def validate_expected_bed_days(self, value):
        """Validate expected bed days"""
        if value is not None and value != 0:
            return HMSValidators.validate_positive_number(value, "Expected bed days")
        return value or 0
    
    def validate(self, data):
        """Validate bed requirement and days consistency"""
        bed_required = data.get('bed_required')
        expected_bed_days = data.get('expected_bed_days')
        
        # Check for existing prescription on create only
        if not self.instance:
            appointment = data.get('appointment')
            if appointment and appointment.prescriptions.exists():
                raise serializers.ValidationError({
                    "appointment": "A prescription already exists for this appointment."
                })
        
        # Validate bed requirements
        if bed_required:
            if not expected_bed_days or expected_bed_days <= 0:
                raise serializers.ValidationError({
                    "expected_bed_days": "Expected bed days must be greater than 0 when bed is required."
                })
        
        return data
    
    def get_billing_status(self, obj):
        """Get associated billing payment status"""
        billing = obj.billing
        return billing.payment_status if billing else None
    
    def get_patient_age(self, obj):
        """Calculate patient age"""
        if obj.patient.date_of_birth:
            today = date.today()
            dob = obj.patient.date_of_birth
            return today.year - dob.year - ((today.month, today.day) < (dob.month, dob.day))
        return None

    def get_billing_invoice(self, obj):
        """Get associated billing invoice number"""
        billing = obj.billing
        return billing.invoice_number if billing else None
    
    def create(self, validated_data):
        """Auto-populate patient and doctor from appointment"""
        appointment = validated_data.get('appointment')
        if appointment:
            validated_data['patient'] = appointment.patient
            validated_data['doctor'] = appointment.doctor
            
            # Update appointment status to VISITED after prescription creation
            appointment.status = 'VISITED'
            appointment.save()
        
        prescription = super().create(validated_data)

        # Create Bed Request if required
        if prescription.bed_required:
            BedRequest.objects.create(
                patient=prescription.patient,
                doctor=prescription.doctor,
                appointment=prescription.appointment,
                expected_bed_days=prescription.expected_bed_days,
                status='PENDING'
            )
            
        return prescription