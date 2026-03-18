from rest_framework import serializers
from .models import Department, Doctor, DoctorSlot
from accounts.serializers import UserSerializer
from accounts.validators import HMSValidators

class DepartmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Department
        fields = '__all__'
    
    def validate_name(self, value):
        """Validate department name"""
        if not value or not value.strip():
            raise serializers.ValidationError("Department name is required")
        
        if len(value.strip()) < 2:
            raise serializers.ValidationError("Department name must be at least 2 characters")
        
        if len(value.strip()) > 100:
            raise serializers.ValidationError("Department name must not exceed 100 characters")
        
        return value.strip()


class DoctorSerializer(serializers.ModelSerializer):
    """Comprehensive validation for doctor profile"""
    user = serializers.IntegerField(write_only=True, required=True)
    user_details = UserSerializer(source='user', read_only=True)
    department_name = serializers.CharField(source='department.name', read_only=True)
    user_name = serializers.CharField(source='user.full_name', read_only=True)
    user_email = serializers.CharField(source='user.email', read_only=True)
    
    class Meta:
        model = Doctor
        fields = ['id', 'user', 'user_details', 'department', 'department_name', 'user_name', 'user_email', 
                  'specialization', 'qualification', 'experience_years', 'consultation_fee', 
                  'license_number', 'bio', 'is_available', 'created_at', 'updated_at']
        read_only_fields = ['user_details', 'user_name', 'user_email', 'department_name', 'created_at', 'updated_at']
    
    def validate_user(self, value):
        """Validate that user exists and is not already a doctor"""
        from accounts.models import User
        
        try:
            user = User.objects.get(id=value)
        except User.DoesNotExist:
            raise serializers.ValidationError("User not found")
        
        # Check if user is already a doctor (only on create)
        if not self.instance and hasattr(user, 'doctor_profile'):
            raise serializers.ValidationError("This user is already a doctor")
        
        return value
    
    def validate_department(self, value):
        """Validate department exists"""
        if not value:
            raise serializers.ValidationError("Department is required")
        
        if not Department.objects.filter(id=value.id).exists():
            raise serializers.ValidationError("Department not found")
        
        return value
    
    def validate_specialization(self, value):
        """Validate specialization"""
        if not value or not value.strip():
            raise serializers.ValidationError("Specialization is required")
        
        if len(value.strip()) < 2:
            raise serializers.ValidationError("Specialization must be at least 2 characters")
        
        if len(value.strip()) > 100:
            raise serializers.ValidationError("Specialization must not exceed 100 characters")
        
        return value.strip()
    
    def validate_qualification(self, value):
        """Validate qualification"""
        if not value or not value.strip():
            raise serializers.ValidationError("Qualification is required")
        
        if len(value.strip()) < 2:
            raise serializers.ValidationError("Qualification must be at least 2 characters")
        
        if len(value.strip()) > 255:
            raise serializers.ValidationError("Qualification is too long")
        
        return value.strip()
    
    def validate_experience_years(self, value):
        """Validate experience years"""
        return HMSValidators.validate_experience(value)
    
    def validate_consultation_fee(self, value):
        """Validate consultation fee"""
        return HMSValidators.validate_consultation_fee(value)
    
    def validate_license_number(self, value):
        """Validate license number"""
        if not value or not value.strip():
            raise serializers.ValidationError("License number is required")
        
        # Basic validation - alphanumeric, at least 5 characters
        license_cleaned = value.strip().upper()
        
        if len(license_cleaned) < 5:
            raise serializers.ValidationError("License number must be at least 5 characters")
        
        if len(license_cleaned) > 50:
            raise serializers.ValidationError("License number is too long")
        
        return license_cleaned
    
    def validate_bio(self, value):
        """Validate bio/description"""
        if value and len(value) > 1000:
            raise serializers.ValidationError("Bio must not exceed 1000 characters")
        
        return value or ""
    
    def create(self, validated_data):
        user_id = validated_data.pop('user', None)
        if user_id:
            from accounts.models import User
            try:
                user = User.objects.get(id=user_id)
                validated_data['user'] = user
            except User.DoesNotExist:
                raise serializers.ValidationError({'user': 'User not found'})
        return super().create(validated_data)
    
    def update(self, instance, validated_data):
        user_id = validated_data.pop('user', None)
        if user_id:
            from accounts.models import User
            try:
                user = User.objects.get(id=user_id)
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


class DoctorSlotSerializer(serializers.ModelSerializer):
    """Validation for doctor appointment slots"""
    doctor_name = serializers.CharField(source='doctor.user.full_name', read_only=True)
    
    class Meta:
        model = DoctorSlot
        fields = '__all__'
        read_only_fields = ['created_at']
    
    def validate(self, attrs):
        """Validate slot times"""
        start_time = attrs.get('start_time')
        end_time = attrs.get('end_time')
        
        if start_time and end_time:
            if end_time <= start_time:
                raise serializers.ValidationError({
                    "end_time": "End time must be after start time"
                })
        
        return attrs