from rest_framework import serializers
from datetime import datetime
from .models import Patient
from accounts.serializers import UserSerializer
from accounts.validators import HMSValidators

class PatientSerializer(serializers.ModelSerializer):
    """Comprehensive validation for patient profile"""
    user = serializers.IntegerField(write_only=True, required=True)
    user_details = UserSerializer(source='user', read_only=True)
    user_name = serializers.CharField(source='user.full_name', read_only=True)
    user_email = serializers.CharField(source='user.email', read_only=True)
    user_phone = serializers.CharField(source='user.phone', read_only=True)
    contact_number = serializers.CharField(required=False, allow_blank=True, write_only=True)
    
    # Allow writing first_name and last_name from the Patient view
    first_name = serializers.CharField(required=False, allow_blank=True, write_only=True)
    last_name = serializers.CharField(required=False, allow_blank=True, write_only=True)
    
    class Meta:
        model = Patient
        fields = ['id', 'user', 'user_details', 'user_name', 'user_email', 'user_phone', 'contact_number', 'first_name', 'last_name', 'uhid', 'date_of_birth', 'gender', 
                  'blood_group', 'address', 'emergency_contact', 'medical_history', 'allergies',
                  'created_at', 'updated_at']
        read_only_fields = ['user_details', 'user_name', 'user_email', 'user_phone', 'created_at', 'updated_at']
    
    def validate_user(self, value):
        """Validate that user exists"""
        from accounts.models import User
        
        try:
            user = User.objects.get(id=value)
        except User.DoesNotExist:
            raise serializers.ValidationError("User not found")
        
        return value
    
    def validate_contact_number(self, value):
        """Validate contact number"""
        if value:  # Only validate if provided
            return HMSValidators.validate_phone(value)
        return value
    
    def validate_first_name(self, value):
        """Validate first name"""
        if value:
            return HMSValidators.validate_name(value, "First name")
        return value
    
    def validate_last_name(self, value):
        """Validate last name"""
        if value:
            return HMSValidators.validate_name(value, "Last name")
        return value
    
    def validate_uhid(self, value):
        """Validate UHID"""
        if value:
            return HMSValidators.validate_uhid(value)
        return value
    
    def validate_date_of_birth(self, value):
        """Validate date of birth"""
        if not value:
            raise serializers.ValidationError("Date of birth is required")
        
        # Check if date is in future
        if value > datetime.now().date():
            raise serializers.ValidationError("Date of birth cannot be in the future")
        
        # Calculate age and validate it's reasonable
        from datetime import date
        today = date.today()
        age = today.year - value.year - ((today.month, today.day) < (value.month, value.day))
        
        if age < 0 or age > 120:
            raise serializers.ValidationError("Invalid date of birth - age must be between 0 and 120 years")
        
        return value
    
    def validate_gender(self, value):
        """Validate gender"""
        if not value:
            raise serializers.ValidationError("Gender is required")
        
        valid_genders = ['M', 'F', 'O']
        if value not in valid_genders:
            raise serializers.ValidationError(f"Gender must be one of: {', '.join(valid_genders)}")
        
        return value
    
    def validate_blood_group(self, value):
        """Validate blood group"""
        if value:
            valid_blood_groups = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-']
            if value not in valid_blood_groups:
                raise serializers.ValidationError(
                    f"Blood group must be one of: {', '.join(valid_blood_groups)}"
                )
        
        return value
    
    def validate_address(self, value):
        """Validate address"""
        if value and len(value) > 500:
            raise serializers.ValidationError("Address must not exceed 500 characters")
        
        return value or ""
    
    def validate_emergency_contact(self, value):
        """Validate emergency contact"""
        if value:
            return HMSValidators.validate_phone(value)
        return value
    
    def validate_medical_history(self, value):
        """Validate medical history"""
        if value and len(value) > 1000:
            raise serializers.ValidationError("Medical history must not exceed 1000 characters")
        
        return value or ""
    
    def validate_allergies(self, value):
        """Validate allergies"""
        if value and len(value) > 1000:
            raise serializers.ValidationError("Allergies must not exceed 1000 characters")
        
        return value or ""
    
    def create(self, validated_data):
        contact_number = validated_data.pop('contact_number', None)
        first_name = validated_data.pop('first_name', None)
        last_name = validated_data.pop('last_name', None)
        
        user_id = validated_data.pop('user', None)
        if user_id:
            from accounts.models import User
            try:
                user = User.objects.get(id=user_id)
                
                user_modified = False
                if contact_number is not None:
                    user.phone = contact_number
                    user_modified = True
                if first_name is not None:
                    user.first_name = first_name
                    user_modified = True
                if last_name is not None:
                    user.last_name = last_name
                    user_modified = True
                    
                if user_modified:
                    user.save()
                    
                existing_patient = Patient.objects.filter(user=user).first()
                if existing_patient:
                    for attr, value in validated_data.items():
                        setattr(existing_patient, attr, value)
                    existing_patient.save()
                    return existing_patient
                    
                validated_data['user'] = user
            except User.DoesNotExist:
                raise serializers.ValidationError({'user': 'User not found'})
        return super().create(validated_data)
    
    def update(self, instance, validated_data):
        contact_number = validated_data.pop('contact_number', None)
        first_name = validated_data.pop('first_name', None)
        last_name = validated_data.pop('last_name', None)
        
        user_modified = False
        if contact_number is not None:
            instance.user.phone = contact_number
            user_modified = True
            
        if first_name is not None:
            instance.user.first_name = first_name
            user_modified = True
            
        if last_name is not None:
            instance.user.last_name = last_name
            user_modified = True
            
        if user_modified:
            instance.user.save()
            
        user_id = validated_data.pop('user', None)
        if user_id:
            from accounts.models import User
            try:
                user = User.objects.get(id=user_id)
                
                # Only update user if it's different and not already assigned to another patient
                if instance.user.id != user_id:
                    if Patient.objects.filter(user=user).exclude(id=instance.id).exists():
                        raise serializers.ValidationError({
                            'user': f'A patient profile already exists for user ID {user_id}. Cannot reassign.'
                        })
                    validated_data['user'] = user
            except User.DoesNotExist:
                raise serializers.ValidationError({'user': 'User not found'})
        return super().update(instance, validated_data)
    
    def to_representation(self, instance):
        """Override to_representation to include user object for read operations"""
        ret = super().to_representation(instance)
        if instance and hasattr(instance, 'user'):
            ret['user'] = instance.user.id
        return ret