"""
Hospital Management System - Backend Validation Utilities for Django
Centralized validation functions to use in serializers
"""

import re
from django.core.exceptions import ValidationError
from django.contrib.auth.password_validation import validate_password

class HMSValidators:
    """Reusable validators for HMS APIs"""
    
    @staticmethod
    def validate_phone(phone: str):
        """
        Validate phone number
        - Must be exactly 10 digits
        - Must be numeric only
        """
        if not phone:
            raise ValidationError("Phone number is required")
        
        # Remove any non-digit characters
        cleaned = re.sub(r'\D', '', phone)
        
        if len(cleaned) != 10:
            raise ValidationError("Phone number must be exactly 10 digits")
        
        return cleaned
    
    @staticmethod
    def validate_email(email: str):
        """
        Validate email format
        - Must follow standard email format
        """
        if not email:
            raise ValidationError("Email is required")
        
        email_regex = r'^[^\s@]+@[^\s@]+\.[^\s@]+$'
        if not re.match(email_regex, email.lower()):
            raise ValidationError("Please enter a valid email address")
        
        return email.lower()
    
    @staticmethod
    def validate_password_strength(password: str):
        """
        Validate password strength
        - Minimum 8 characters
        - Must include at least one letter
        - Must include at least one number
        """
        if not password:
            raise ValidationError("Password is required")
        
        if len(password) < 8:
            raise ValidationError("Password must be at least 8 characters")
        
        if not re.search(r'[a-zA-Z]', password):
            raise ValidationError("Password must contain at least one letter")
        
        if not re.search(r'[0-9]', password):
            raise ValidationError("Password must contain at least one number")
        
        # Use Django's built-in validators
        try:
            validate_password(password)
        except ValidationError as e:
            raise ValidationError(str(e))
    
    @staticmethod
    def validate_age(age):
        """
        Validate age
        - Must be numeric
        - Must be between 18-120
        """
        try:
            age_int = int(age)
        except (ValueError, TypeError):
            raise ValidationError("Age must be a valid number")
        
        if age_int < 18 or age_int > 120:
            raise ValidationError("Age must be between 18 and 120")
        
        return age_int
    
    @staticmethod
    def validate_experience(years):
        """
        Validate experience years
        - Must be numeric
        - Must be between 0-60
        """
        try:
            years_int = int(years)
        except (ValueError, TypeError):
            raise ValidationError("Experience must be a valid number")
        
        if years_int < 0 or years_int > 60:
            raise ValidationError("Experience must be between 0 and 60 years")
        
        return years_int
    
    @staticmethod
    def validate_positive_number(value, field_name="Value"):
        """
        Validate positive number
        """
        try:
            num = float(value)
        except (ValueError, TypeError):
            raise ValidationError(f"{field_name} must be a valid number")
        
        if num <= 0:
            raise ValidationError(f"{field_name} must be greater than 0")
        
        return num
    
    @staticmethod
    def validate_non_negative_number(value, field_name="Value"):
        """
        Validate non-negative number
        """
        try:
            num = float(value)
        except (ValueError, TypeError):
            raise ValidationError(f"{field_name} must be a valid number")
        
        if num < 0:
            raise ValidationError(f"{field_name} cannot be negative")
        
        return num
    
    @staticmethod
    def validate_name(name: str, field_name="Name"):
        """
        Validate name field
        - Cannot be empty
        - Should contain only letters, spaces, hyphens
        """
        if not name or not name.strip():
            raise ValidationError(f"{field_name} is required")
        
        name = name.strip()
        if len(name) < 2:
            raise ValidationError(f"{field_name} must be at least 2 characters")
        
        if len(name) > 100:
            raise ValidationError(f"{field_name} must not exceed 100 characters")
        
        # Allow letters, spaces, hyphens, apostrophes
        name_regex = r"^[a-zA-Z\s\-']{2,}$"
        if not re.match(name_regex, name):
            raise ValidationError(
                f"{field_name} can only contain letters, spaces, hyphens, and apostrophes"
            )
        
        return name
    
    @staticmethod
    def validate_uhid(uhid: str):
        """
        Validate UHID format
        Format: UHxxx-xxxx (e.g., UH001-0001)
        """
        if not uhid:
            raise ValidationError("UHID is required")
        
        uhid_regex = r'^UH\d{3}-\d{4}$'
        if not re.match(uhid_regex, uhid):
            raise ValidationError("UHID format must be UHxxx-xxxx (e.g., UH001-0001)")
        
        return uhid
    
    @staticmethod
    def validate_file(file_obj, allowed_extensions=None, max_size_mb=10):
        """
        Validate file upload
        - Check file extension
        - Check file size
        """
        if not file_obj:
            raise ValidationError("File is required")
        
        if allowed_extensions is None:
            allowed_extensions = ['pdf', 'jpg', 'jpeg', 'png', 'doc', 'docx']
        
        # Check file extension
        file_extension = file_obj.name.split('.')[-1].lower()
        if file_extension not in allowed_extensions:
            raise ValidationError(
                f"File type '.{file_extension}' is not allowed. "
                f"Allowed types: {', '.join(allowed_extensions)}"
            )
        
        # Check file size
        file_size_mb = file_obj.size / (1024 * 1024)
        if file_size_mb > max_size_mb:
            raise ValidationError(f"File size must be less than {max_size_mb}MB")
        
        return file_obj
    
    @staticmethod
    def validate_consultation_fee(fee):
        """
        Validate consultation fee
        - Must be positive number
        - Reasonable range (0 - 50000)
        """
        try:
            fee_float = float(fee)
        except (ValueError, TypeError):
            raise ValidationError("Consultation fee must be a valid number")
        
        if fee_float <= 0:
            raise ValidationError("Consultation fee must be greater than 0")
        
        if fee_float > 50000:
            raise ValidationError("Consultation fee seems too high (max: ₹50,000)")
        
        return fee_float
