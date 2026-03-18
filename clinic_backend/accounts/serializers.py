# accounts/serializers.py

from rest_framework import serializers
from django.contrib.auth import authenticate
from .models import User, PasswordResetToken
from .validators import HMSValidators

class UserSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=False)
    full_name = serializers.CharField(read_only=True)
    patient_id = serializers.SerializerMethodField()
    doctor_id = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = ['id', 'email', 'password', 'first_name', 'last_name', 
                  'phone', 'role', 'is_active', 'full_name', 'created_at', 'patient_id', 'doctor_id']
        read_only_fields = ['id', 'created_at']
    
    def get_patient_id(self, obj):
        if hasattr(obj, 'patient_profile'):
            return obj.patient_profile.id
        return None

    def get_doctor_id(self, obj):
        if hasattr(obj, 'doctor_profile'):
            return obj.doctor_profile.id
        return None
    
    def validate_email(self, value):
        """Validate email format and uniqueness"""
        return HMSValidators.validate_email(value)
    
    def validate_first_name(self, value):
        """Validate first name"""
        return HMSValidators.validate_name(value, "First name")
    
    def validate_last_name(self, value):
        """Validate last name"""
        return HMSValidators.validate_name(value, "Last name")
    
    def validate_phone(self, value):
        """Validate phone number"""
        return HMSValidators.validate_phone(value)
    
    def create(self, validated_data):
        password = validated_data.pop('password', None)
        user = User.objects.create(**validated_data)
        if password:
            user.set_password(password)
            user.save()
        return user
    
    def update(self, instance, validated_data):
        password = validated_data.pop('password', None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        if password:
            instance.set_password(password)
        instance.save()
        return instance


class UserRegistrationSerializer(serializers.ModelSerializer):
    """Serializer for patient registration with comprehensive validation"""
    password = serializers.CharField(write_only=True)
    confirm_password = serializers.CharField(write_only=True)
    
    class Meta:
        model = User
        fields = ['email', 'password', 'confirm_password', 'first_name', 
                  'last_name', 'phone']
    
    def validate_email(self, value):
        """Validate email format and check uniqueness"""
        email = HMSValidators.validate_email(value)
        
        # Check if email already exists
        if User.objects.filter(email__iexact=email).exists():
            raise serializers.ValidationError("Email already registered")
        
        return email
    
    def validate_password(self, value):
        """Validate password strength"""
        HMSValidators.validate_password_strength(value)
        return value
    
    def validate_first_name(self, value):
        """Validate first name"""
        return HMSValidators.validate_name(value, "First name")
    
    def validate_last_name(self, value):
        """Validate last name"""
        return HMSValidators.validate_name(value, "Last name")
    
    def validate_phone(self, value):
        """Validate phone number"""
        return HMSValidators.validate_phone(value)
    
    def validate(self, attrs):
        """Validate password confirmation"""
        password = attrs.get('password')
        confirm_password = attrs.get('confirm_password')
        
        if password != confirm_password:
            raise serializers.ValidationError({
                "confirm_password": "Passwords do not match"
            })
        
        return attrs
    
    def create(self, validated_data):
        """Create user with password"""
        validated_data.pop('confirm_password')
        password = validated_data.pop('password')
        validated_data['role'] = 'PATIENT'
        
        user = User.objects.create(**validated_data)
        user.set_password(password)
        user.save()
        
        return user


class LoginSerializer(serializers.Serializer):
    """Serializer for user login"""
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)
    
    def validate_email(self, value):
        """Validate email format"""
        return HMSValidators.validate_email(value)
    
    def validate(self, attrs):
        """Validate credentials"""
        email = attrs.get('email')
        password = attrs.get('password')
        
        if not email or not password:
            raise serializers.ValidationError("Email and password are required")
        
        # Authenticate user
        user = authenticate(username=email, password=password)
        if not user:
            raise serializers.ValidationError({
                "non_field_errors": ["Invalid email or password"]
            })
        
        # Check if user is active
        if not user.is_active:
            raise serializers.ValidationError({
                "non_field_errors": ["User account is inactive"]
            })
        
        attrs['user'] = user
        return attrs


class ForgotPasswordSerializer(serializers.Serializer):
    """Serializer for password reset request"""
    email = serializers.EmailField()
    
    def validate_email(self, value):
        """Validate email format"""
        return HMSValidators.validate_email(value)
    
    # Note: Don't validate if user exists - handle it in view for security
    # (prevents email enumeration attacks)


class VerifyResetTokenSerializer(serializers.Serializer):
    """Serializer for verifying password reset token"""
    token = serializers.CharField(required=True)
    
    def validate_token(self, value):
        """Validate reset token"""
        if not value.strip():
            raise serializers.ValidationError("Token is required")
        
        try:
            reset_token = PasswordResetToken.objects.get(token=value.strip())
            if not reset_token.is_valid():
                raise serializers.ValidationError("Token is invalid or expired")
        except PasswordResetToken.DoesNotExist:
            raise serializers.ValidationError("Invalid token")
        
        return value


class ResetPasswordSerializer(serializers.Serializer):
    """Serializer for resetting password with token"""
    token = serializers.CharField(required=True)
    password = serializers.CharField(write_only=True)
    confirm_password = serializers.CharField(write_only=True)
    
    def validate_password(self, value):
        """Validate password strength"""
        HMSValidators.validate_password_strength(value)
        return value
    
    def validate(self, attrs):
        """Validate token and passwords"""
        password = attrs.get('password')
        confirm_password = attrs.get('confirm_password')
        token = attrs.get('token')
        
        # Validate password confirmation
        if password != confirm_password:
            raise serializers.ValidationError({
                "confirm_password": "Passwords do not match"
            })
        
        # Validate token
        if not token.strip():
            raise serializers.ValidationError({
                "token": "Token is required"
            })
        
        try:
            reset_token = PasswordResetToken.objects.get(token=token.strip())
            if not reset_token.is_valid():
                raise serializers.ValidationError({
                    "token": "Token is invalid or expired"
                })
        except PasswordResetToken.DoesNotExist:
            raise serializers.ValidationError({
                "token": "Invalid token"
            })
        
        return attrs