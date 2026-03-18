from rest_framework import serializers
from .models import Billing
from accounts.validators import HMSValidators

class BillingSerializer(serializers.ModelSerializer):
    """Comprehensive validation for billing"""
    patient_name = serializers.CharField(source='patient.user.full_name', read_only=True)
    patient_uhid = serializers.CharField(source='patient.uhid', read_only=True)
    doctor_name = serializers.CharField(source='appointment.doctor.user.full_name', read_only=True)
    appointment_date = serializers.DateField(source='appointment.appointment_date', read_only=True)
    appointment_time = serializers.TimeField(source='appointment.appointment_time', read_only=True)
    case_type = serializers.CharField(source='appointment.case_type', read_only=True)
    appointment_details = serializers.SerializerMethodField()
    balance = serializers.SerializerMethodField()
    status = serializers.CharField(source='payment_status', read_only=False)
    lab_tests = serializers.SerializerMethodField()
    
    class Meta:
        model = Billing
        fields = [
            'id', 'appointment', 'patient', 'patient_name', 'patient_uhid', 'doctor_name',
            'appointment_date', 'appointment_time', 'case_type',
            'doctor_fee', 'hospital_charge', 'bed_charge', 
            'bed_days', 'bed_charge_per_day',
            'discount_percentage', 'discount_amount', 'final_amount',
            'total_amount', 'paid_amount', 'lab_charge',
            'balance', 'status', 'payment_status', 'payment_method', 'invoice_number',
            'notes', 'created_at', 'updated_at', 'appointment_details', 'lab_tests'
        ]
        read_only_fields = ['created_at', 'updated_at', 'invoice_number']
    
    def validate_appointment(self, value):
        """Validate appointment exists"""
        if not value:
            raise serializers.ValidationError("Appointment is required")
        
        return value
    
    def validate_patient(self, value):
        """Validate patient exists"""
        if not value:
            raise serializers.ValidationError("Patient is required")
        
        return value
    
    def validate_doctor_fee(self, value):
        """Validate doctor fee"""
        return HMSValidators.validate_non_negative_number(value, "Doctor fee")
    
    def validate_hospital_charge(self, value):
        """Validate hospital charge"""
        return HMSValidators.validate_non_negative_number(value, "Hospital charge")
    
    def validate_bed_charge(self, value):
        """Validate bed charge"""
        return HMSValidators.validate_non_negative_number(value, "Bed charge")
    
    def validate_bed_days(self, value):
        """Validate bed days"""
        if value not in [None, 0]:
            return HMSValidators.validate_positive_number(value, "Bed days")
        return value or 0
    
    def validate_bed_charge_per_day(self, value):
        """Validate bed charge per day"""
        if value not in [None, 0]:
            return HMSValidators.validate_positive_number(value, "Bed charge per day")
        return value or 0
    
    def validate_lab_charge(self, value):
        """Validate lab charge"""
        return HMSValidators.validate_non_negative_number(value, "Lab charge")
    
    def validate_discount_percentage(self, value):
        """Validate discount percentage"""
        try:
            discount = float(value)
        except (ValueError, TypeError):
            raise serializers.ValidationError("Discount percentage must be a valid number")
        
        if discount < 0 or discount > 100:
            raise serializers.ValidationError("Discount percentage must be between 0 and 100")
        
        return discount
    
    def validate_discount_amount(self, value):
        """Validate discount amount"""
        return HMSValidators.validate_non_negative_number(value, "Discount amount")
    
    def validate_paid_amount(self, value):
        """Validate paid amount"""
        return HMSValidators.validate_non_negative_number(value, "Paid amount")
    
    def validate_total_amount(self, value):
        """Validate total amount"""
        return HMSValidators.validate_non_negative_number(value, "Total amount")
    
    def validate_final_amount(self, value):
        """Validate final amount"""
        return HMSValidators.validate_non_negative_number(value, "Final amount")
    
    def validate_payment_method(self, value):
        """Validate payment method"""
        if value:
            valid_methods = ['CASH', 'CARD', 'ONLINE', 'INSURANCE', 'OTHER']
            if value not in valid_methods:
                raise serializers.ValidationError(
                    f"Payment method must be one of: {', '.join(valid_methods)}"
                )
        
        return value
    
    def validate_notes(self, value):
        """Validate notes"""
        if value and len(value) > 1000:
            raise serializers.ValidationError("Notes must not exceed 1000 characters")
        
        return value or ""
    
    def validate(self, attrs):
        """Validate amounts are consistent"""
        final_amount = attrs.get('final_amount', 0)
        paid_amount = attrs.get('paid_amount', 0)
        
        # Ensure paid amount doesn't exceed final amount
        if paid_amount > final_amount:
            raise serializers.ValidationError({
                "paid_amount": "Paid amount cannot exceed final amount"
            })
        
        return attrs
    
    def get_appointment_details(self, obj):
        return {
            'date': str(obj.appointment.appointment_date),
            'time': str(obj.appointment.appointment_time),
            'doctor': obj.appointment.doctor.user.full_name
        }
    
    def get_balance(self, obj):
        return float(obj.final_amount - obj.paid_amount)
    
    def get_lab_tests(self, obj):
        """Get all completed lab tests for this billing's patient"""
        try:
            from laboratory.models import LabRequest
            completed_lab_tests = LabRequest.objects.filter(
                patient=obj.patient,
                status='COMPLETED'
            ).select_related('test')
            
            lab_tests_data = []
            for lab_request in completed_lab_tests:
                if lab_request.test:
                    lab_tests_data.append({
                        'id': lab_request.test.id,
                        'test_name': lab_request.test.test_name,
                        'price': float(lab_request.test.price),
                        'lab_request_id': lab_request.id,
                        'completed_at': lab_request.requested_at.isoformat() if lab_request.requested_at else None
                    })
            return lab_tests_data
        except Exception as e:
            print(f"Error fetching lab tests for serializer: {e}")
            return []
    
    def to_representation(self, instance):
        data = super().to_representation(instance)
        # Ensure payment_status is returned for compatibility
        data['status'] = data.get('payment_status', data.get('status'))
        return data


class BillingListSerializer(serializers.ModelSerializer):
    """Lightweight list serializer to keep billing list responses fast"""
    patient_name = serializers.CharField(source='patient.user.full_name', read_only=True)
    patient_uhid = serializers.CharField(source='patient.uhid', read_only=True)
    doctor_name = serializers.CharField(source='appointment.doctor.user.full_name', read_only=True)
    appointment_date = serializers.DateField(source='appointment.appointment_date', read_only=True)
    appointment_time = serializers.TimeField(source='appointment.appointment_time', read_only=True)
    case_type = serializers.CharField(source='appointment.case_type', read_only=True)
    balance = serializers.SerializerMethodField()
    status = serializers.CharField(source='payment_status', read_only=True)

    class Meta:
        model = Billing
        fields = [
            'id', 'appointment', 'patient', 'patient_name', 'patient_uhid', 'doctor_name',
            'appointment_date', 'appointment_time', 'case_type',
            'doctor_fee', 'hospital_charge', 'bed_charge',
            'bed_days', 'bed_charge_per_day', 'discount_percentage', 'discount_amount',
            'final_amount', 'total_amount', 'paid_amount', 'lab_charge',
            'balance', 'status', 'payment_status', 'payment_method', 'invoice_number',
            'notes', 'created_at', 'updated_at'
        ]

    def get_balance(self, obj):
        return float(obj.final_amount - obj.paid_amount)