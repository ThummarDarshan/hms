/**
 * Hospital Management System - Validation Utilities
 * Provides reusable validation functions for all forms
 */

export interface ValidationError {
  field: string;
  message: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}

// ============================================
// BASIC VALIDATORS
// ============================================

export const validators = {
  /**
   * Required field validation
   */
  isRequired: (value: string | null | undefined, fieldName: string): string | null => {
    if (!value || value.trim() === '') {
      return `${fieldName} is required`;
    }
    return null;
  },

  /**
   * Email validation
   */
  isValidEmail: (email: string): string | null => {
    if (!email) return 'Email is required';
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return 'Please enter a valid email address';
    }
    return null;
  },

  /**
   * Phone number validation (10 digits, numeric only)
   */
  isValidPhone: (phone: string): string | null => {
    if (!phone) return 'Phone number is required';
    
    const phoneRegex = /^[0-9]{10}$/;
    if (!phoneRegex.test(phone.replace(/\D/g, ''))) {
      return 'Phone number must be 10 digits';
    }
    return null;
  },

  /**
   * Password validation
   * - Minimum 8 characters
   * - At least one letter
   * - At least one number
   */
  isValidPassword: (password: string): string | null => {
    if (!password) return 'Password is required';
    
    if (password.length < 8) {
      return 'Password must be at least 8 characters';
    }
    
    if (!/[a-zA-Z]/.test(password)) {
      return 'Password must contain at least one letter';
    }
    
    if (!/[0-9]/.test(password)) {
      return 'Password must contain at least one number';
    }
    
    return null;
  },

  /**
   * Confirm password validation
   */
  isPasswordMatch: (password: string, confirmPassword: string): string | null => {
    if (!confirmPassword) return 'Confirm password is required';
    
    if (password !== confirmPassword) {
      return 'Passwords do not match';
    }
    return null;
  },

  /**
   * Number validation (positive numbers)
   */
  isValidNumber: (value: string | number, fieldName: string, allowZero = false): string | null => {
    if (value === '' || value === null || value === undefined) {
      return `${fieldName} is required`;
    }
    
    const num = Number(value);
    if (isNaN(num)) {
      return `${fieldName} must be a valid number`;
    }
    
    if (!allowZero && num <= 0) {
      return `${fieldName} must be greater than 0`;
    }
    
    if (allowZero && num < 0) {
      return `${fieldName} must be 0 or greater`;
    }
    
    return null;
  },

  /**
   * Age validation (18-120)
   */
  isValidAge: (age: string | number): string | null => {
    const numAge = Number(age);
    
    if (isNaN(numAge)) {
      return 'Age must be a valid number';
    }
    
    if (numAge < 18 || numAge > 120) {
      return 'Age must be between 18 and 120';
    }
    
    return null;
  },

  /**
   * Experience validation (0-60 years)
   */
  isValidExperience: (years: string | number): string | null => {
    const numYears = Number(years);
    
    if (isNaN(numYears)) {
      return 'Experience must be a valid number';
    }
    
    if (numYears < 0 || numYears > 60) {
      return 'Experience must be between 0 and 60 years';
    }
    
    return null;
  },

  /**
   * Dropdown selection validation
   */
  isSelected: (value: string | number | null, fieldName: string): string | null => {
    if (!value || value === '' || value === '0') {
      return `Please select a ${fieldName}`;
    }
    return null;
  },

  /**
   * File upload validation
   */
  isValidFile: (
    file: File | null,
    allowedFormats: string[] = ['pdf', 'jpg', 'jpeg', 'png'],
    maxSizeMB = 10
  ): string | null => {
    if (!file) {
      return 'File is required';
    }
    
    // Check file format
    const fileExtension = file.name.split('.').pop()?.toLowerCase();
    if (!fileExtension || !allowedFormats.includes(fileExtension)) {
      return `Only ${allowedFormats.join(', ').toUpperCase()} files are allowed`;
    }
    
    // Check file size
    const fileSizeMB = file.size / (1024 * 1024);
    if (fileSizeMB > maxSizeMB) {
      return `File size must be less than ${maxSizeMB}MB`;
    }
    
    return null;
  },

  /**
   * Name validation (letters, spaces, hyphens only)
   */
  isValidName: (name: string, fieldName = 'Name'): string | null => {
    if (!name || name.trim() === '') {
      return `${fieldName} is required`;
    }
    
    const nameRegex = /^[a-zA-Z\s\-']{2,}$/;
    if (!nameRegex.test(name)) {
      return `${fieldName} must contain only letters, spaces, and hyphens`;
    }
    
    return null;
  },

  /**
   * Minimum length validation
   */
  minLength: (value: string, minLength: number, fieldName: string): string | null => {
    if (!value) return `${fieldName} is required`;
    
    if (value.length < minLength) {
      return `${fieldName} must be at least ${minLength} characters`;
    }
    
    return null;
  },

  /**
   * Maximum length validation
   */
  maxLength: (value: string, maxLength: number, fieldName: string): string | null => {
    if (!value) return null;
    
    if (value.length > maxLength) {
      return `${fieldName} must not exceed ${maxLength} characters`;
    }
    
    return null;
  },

  /**
   * URL validation
   */
  isValidUrl: (url: string): string | null => {
    if (!url) return 'URL is required';
    
    try {
      new URL(url);
      return null;
    } catch {
      return 'Please enter a valid URL';
    }
  },

  /**
   * UHID validation (format: UHxxx-xxxx)
   */
  isValidUHID: (uhid: string): string | null => {
    if (!uhid) return 'UHID is required';
    
    const uhidRegex = /^UH\d{3}-\d{4}$/;
    if (!uhidRegex.test(uhid)) {
      return 'UHID format must be UHxxx-xxxx';
    }
    
    return null;
  },
};

// ============================================
// FORM FIELD VALIDATORS
// ============================================

/**
 * Validate individual field
 */
export const validateField = (
  fieldName: string,
  value: any,
  rules: {
    required?: boolean;
    type?: string;
    minLength?: number;
    maxLength?: number;
    pattern?: RegExp;
    custom?: (value: any) => string | null;
  }
): string | null => {
  if (rules.required) {
    const error = validators.isRequired(value, fieldName);
    if (error) return error;
  }

  if (!value) return null;

  if (rules.type) {
    switch (rules.type) {
      case 'email':
        return validators.isValidEmail(value);
      case 'phone':
        return validators.isValidPhone(value);
      case 'password':
        return validators.isValidPassword(value);
      case 'age':
        return validators.isValidAge(value);
      case 'experience':
        return validators.isValidExperience(value);
      case 'name':
        return validators.isValidName(value, fieldName);
      case 'url':
        return validators.isValidUrl(value);
      case 'number':
        return validators.isValidNumber(value, fieldName);
      default:
        break;
    }
  }

  if (rules.minLength && value.length < rules.minLength) {
    return validators.minLength(value, rules.minLength, fieldName);
  }

  if (rules.maxLength && value.length > rules.maxLength) {
    return validators.maxLength(value, rules.maxLength, fieldName);
  }

  if (rules.pattern && !rules.pattern.test(value)) {
    return `${fieldName} format is invalid`;
  }

  if (rules.custom) {
    return rules.custom(value);
  }

  return null;
};

/**
 * Validate entire form
 */
export const validateForm = (
  formData: Record<string, any>,
  rules: Record<string, any>
): ValidationResult => {
  const errors: ValidationError[] = [];

  Object.keys(rules).forEach((fieldName) => {
    const error = validateField(fieldName, formData[fieldName], rules[fieldName]);
    if (error) {
      errors.push({ field: fieldName, message: error });
    }
  });

  return {
    isValid: errors.length === 0,
    errors,
  };
};

/**
 * Get error message for specific field
 */
export const getFieldError = (
  errors: ValidationError[],
  fieldName: string
): string | null => {
  const error = errors.find((e) => e.field === fieldName);
  return error ? error.message : null;
};

/**
 * Check if field has error
 */
export const hasFieldError = (errors: ValidationError[], fieldName: string): boolean => {
  return errors.some((e) => e.field === fieldName);
};
