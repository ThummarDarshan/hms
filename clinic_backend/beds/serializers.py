from rest_framework import serializers
from datetime import datetime, timedelta
from .models import Ward, Bed, BedAllocation, BedRequest
from patients.serializers import PatientSerializer
from doctors.serializers import DoctorSerializer
from accounts.validators import HMSValidators

class WardSerializer(serializers.ModelSerializer):
    """Validation for ward management"""
    total_beds = serializers.IntegerField(read_only=True)
    available_beds = serializers.IntegerField(read_only=True)

    class Meta:
        model = Ward
        fields = ['id', 'name', 'ward_type', 'floor_number', 'description', 'total_beds', 'available_beds']
    
    def validate_name(self, value):
        """Validate ward name"""
        if not value or not value.strip():
            raise serializers.ValidationError("Ward name is required")
        
        if len(value.strip()) < 2:
            raise serializers.ValidationError("Ward name must be at least 2 characters")
        
        if len(value.strip()) > 100:
            raise serializers.ValidationError("Ward name must not exceed 100 characters")
        
        return value.strip()
    
    def validate_ward_type(self, value):
        """Validate ward type"""
        valid_types = ['GENERAL', 'ICU', 'PRIVATE', 'SEMI_PRIVATE', 'EMERGENCY', 'MATERNITY', 'PEDIATRIC']
        
        if value not in valid_types:
            raise serializers.ValidationError(
                f"Ward type must be one of: {', '.join(valid_types)}"
            )
        
        return value
    
    def validate_floor_number(self, value):
        """Validate floor number"""
        try:
            floor = int(value)
        except (ValueError, TypeError):
            raise serializers.ValidationError("Floor number must be a valid integer")
        
        if floor < -5 or floor > 50:
            raise serializers.ValidationError("Floor number must be between -5 (basement) and 50")
        
        return floor
    
    def validate_description(self, value):
        """Validate description"""
        if value and len(value) > 500:
            raise serializers.ValidationError("Description must not exceed 500 characters")
        
        return value or ""


class BedAllocationSerializer(serializers.ModelSerializer):
    """Validation for bed allocations"""
    patient_details = PatientSerializer(source='patient', read_only=True)
    patient_name = serializers.CharField(source='patient.user.full_name', read_only=True)
    patient_uhid = serializers.CharField(source='patient.uhid', read_only=True)
    bed_details = serializers.StringRelatedField(source='bed', read_only=True)
    
    class Meta:
        model = BedAllocation
        fields = ['id', 'bed', 'bed_details', 'patient', 'patient_details', 'patient_name', 'patient_uhid', 
                 'admission_date', 'discharge_date', 'reason', 'status', 'payment_status', 'notes']
        read_only_fields = ['admission_date', 'discharge_date']
    
    def validate_bed(self, value):
        """Validate bed exists and is available"""
        if not value:
            raise serializers.ValidationError("Bed is required")
        
        if value.status != 'AVAILABLE':
            raise serializers.ValidationError("Selected bed is not available")
        
        return value
    
    def validate_patient(self, value):
        """Validate patient exists"""
        if not value:
            raise serializers.ValidationError("Patient is required")
        
        return value
    
    def validate_reason(self, value):
        """Validate reason for allocation"""
        if not value or not value.strip():
            raise serializers.ValidationError("Reason is required")
        
        if len(value.strip()) < 5:
            raise serializers.ValidationError("Reason must be at least 5 characters")
        
        if len(value.strip()) > 500:
            raise serializers.ValidationError("Reason must not exceed 500 characters")
        
        return value.strip()
    
    def validate_status(self, value):
        """Validate allocation status"""
        valid_statuses = ['ACTIVE', 'DISCHARGED']
        
        if value not in valid_statuses:
            raise serializers.ValidationError(
                f"Status must be one of: {', '.join(valid_statuses)}"
            )
        
        return value
    
    def validate_payment_status(self, value):
        """Validate payment status"""
        valid_statuses = ['PENDING', 'PAID']
        
        if value not in valid_statuses:
            raise serializers.ValidationError(
                f"Payment status must be one of: {', '.join(valid_statuses)}"
            )
        
        return value
    
    def validate_notes(self, value):
        """Validate notes"""
        if value and len(value) > 1000:
            raise serializers.ValidationError("Notes must not exceed 1000 characters")
        
        return value or ""


class BedSerializer(serializers.ModelSerializer):
    """Validation for bed management"""
    ward_name = serializers.CharField(source='ward.name', read_only=True)
    current_allocation = serializers.SerializerMethodField()
    
    class Meta:
        model = Bed
        fields = ['id', 'ward', 'ward_name', 'bed_number', 'bed_type', 'price_per_day', 'status', 'is_active', 'current_allocation']
    
    def validate_bed_number(self, value):
        """Validate bed number"""
        if not value or not value.strip():
            raise serializers.ValidationError("Bed number is required")
        
        if len(value.strip()) > 20:
            raise serializers.ValidationError("Bed number must not exceed 20 characters")
        
        return value.strip()
    
    def validate_bed_type(self, value):
        """Validate bed type"""
        valid_types = ['STANDARD', 'ADJUSTABLE', 'ICU', 'VENTILATOR', 'PEDIATRIC']
        
        if value not in valid_types:
            raise serializers.ValidationError(
                f"Bed type must be one of: {', '.join(valid_types)}"
            )
        
        return value
    
    def validate_price_per_day(self, value):
        """Validate bed price per day"""
        return HMSValidators.validate_positive_number(value, "Price per day")
    
    def validate_status(self, value):
        """Validate bed status"""
        valid_statuses = ['AVAILABLE', 'OCCUPIED', 'MAINTENANCE', 'CLEANING']
        
        if value not in valid_statuses:
            raise serializers.ValidationError(
                f"Status must be one of: {', '.join(valid_statuses)}"
            )
        
        return value
        
    def get_current_allocation(self, obj):
        """Fetch the active allocation if it exists"""
        prefetched_allocations = getattr(obj, 'prefetched_active_allocations', None)
        if prefetched_allocations is not None:
            allocation = prefetched_allocations[0] if prefetched_allocations else None
        else:
            allocation = obj.allocations.filter(status='ACTIVE').select_related('patient__user').first()
        if allocation:
            return BedAllocationSerializer(allocation).data
        return None


class BedRequestSerializer(serializers.ModelSerializer):
    """Validation for bed requests"""
    patient_name = serializers.CharField(source='patient.user.full_name', read_only=True)
    doctor_name = serializers.CharField(source='doctor.user.full_name', read_only=True)
    
    class Meta:
        model = BedRequest
        fields = ['id', 'patient', 'patient_name', 'doctor', 'doctor_name', 'appointment', 
                 'expected_bed_days', 'status', 'created_at', 'updated_at']
        read_only_fields = ['created_at', 'updated_at']
    
    def validate_patient(self, value):
        """Validate patient exists"""
        if not value:
            raise serializers.ValidationError("Patient is required")
        
        return value
    
    def validate_doctor(self, value):
        """Validate doctor exists"""
        if not value:
            raise serializers.ValidationError("Doctor is required")
        
        return value
    
    def validate_expected_bed_days(self, value):
        """Validate expected bed days"""
        return HMSValidators.validate_positive_number(value, "Expected bed days")
    
    def validate_status(self, value):
        """Validate request status"""
        valid_statuses = ['PENDING', 'APPROVED', 'REJECTED', 'ALLOCATED', 'DISCHARGED']
        
        if value not in valid_statuses:
            raise serializers.ValidationError(
                f"Status must be one of: {', '.join(valid_statuses)}"
            )
        
        return value
