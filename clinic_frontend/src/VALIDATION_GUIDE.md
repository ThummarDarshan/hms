# Hospital Management System - Validation Implementation Guide

## Overview
This guide shows how to implement comprehensive validation across all forms and APIs in the HMS system.

## Phase 1: Frontend Validation (Complete)

### 1. Validation Utilities
- ✅ Created: `src/utils/validation.ts`
- Contains: Email, phone, password, age, experience, name, file upload validators
- Reusable across all forms

### 2. Form Validation Hook
- ✅ Created: `src/hooks/useFormValidation.ts`
- Features:
  - Real-time field validation (on change and blur)
  - Error tracking and display
  - Form submit handling
  - Field value manipulation

### 3. Form Field Components
- ✅ Created: `src/components/common/FormField.tsx`
- Components:
  - FormField (wrapper with error display)
  - FormInput (with red border on error)
  - FormTextArea
  - FormSelect
  - FormCheckbox
  - FormFileInput

## Usage Pattern

### Step 1: Import Required Modules
```tsx
import { useFormValidation } from '@/hooks/useFormValidation';
import { FormField, FormInput, FormSelect } from '@/components/common/FormField';
import { validators } from '@/utils/validation';
```

### Step 2: Define Validation Rules
```tsx
const validationRules = {
  email: {
    required: true,
    type: 'email',
  },
  phoneNumber: {
    required: true,
    type: 'phone',
  },
  password: {
    required: true,
    type: 'password',
  },
  age: {
    required: true,
    type: 'age',
  },
  department: {
    required: true,
  },
};
```

### Step 3: Use the Hook
```tsx
const { formData, handleChange, handleBlur, handleSubmit, shouldShowError, getFieldError, isSubmitting } =
  useFormValidation({
    initialValues: {
      email: '',
      phoneNumber: '',
      password: '',
      age: '',
      department: '',
    },
    validationRules,
    onSubmit: async (data) => {
      // Send data to API
      await api.post('/endpoint', data);
    },
  });
```

### Step 4: Use Form Components
```tsx
<form onSubmit={handleSubmit}>
  <FormField
    label="Email"
    error={shouldShowError('email') ? getFieldError('email') : null}
    required
  >
    <FormInput
      name="email"
      type="email"
      placeholder="user@example.com"
      value={formData.email}
      onChange={handleChange}
      onBlur={handleBlur}
      error={shouldShowError('email')}
    />
  </FormField>

  <FormField
    label="Phone"
    error={shouldShowError('phoneNumber') ? getFieldError('phoneNumber') : null}
    required
  >
    <FormInput
      name="phoneNumber"
      type="tel"
      placeholder="10 digit phone number"
      value={formData.phoneNumber}
      onChange={handleChange}
      onBlur={handleBlur}
      error={shouldShowError('phoneNumber')}
    />
  </FormField>

  <FormField
    label="Department"
    error={shouldShowError('department') ? getFieldError('department') : null}
    required
  >
    <FormSelect
      name="department"
      value={formData.department}
      onChange={handleChange}
      onBlur={handleBlur}
      error={shouldShowError('department')}
      options={[
        { value: '', label: 'Select Department' },
        { value: 'cardiology', label: 'Cardiology' },
        { value: 'neurology', label: 'Neurology' },
      ]}
    />
  </FormField>

  <button type="submit" disabled={isSubmitting}>
    {isSubmitting ? 'Submitting...' : 'Submit'}
  </button>
</form>
```

## Phase 2: Backend Validation

### Django REST Framework Validation

All APIs should use DRF serializers with proper validation.

#### Example: Patient Registration API

```python
from rest_framework import serializers
from django.core.exceptions import ValidationError
from django.contrib.auth.password_validation import validate_password

class PatientSerializer(serializers.ModelSerializer):
    email = serializers.EmailField()
    phone = serializers.CharField(max_length=10)
    password = serializers.CharField(write_only=True)
    
    class Meta:
        model = Patient
        fields = ['email', 'phone', 'password', 'full_name', 'dob']
    
    def validate_phone(self, value):
        """Validate phone number"""
        if not value.isdigit() or len(value) != 10:
            raise serializers.ValidationError("Phone must be 10 digits")
        return value
    
    def validate_email(self, value):
        """Ensure email is unique"""
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("Email already registered")
        return value
    
    def validate_password(self, value):
        """Validate password strength"""
        validate_password(value)
        return value
    
    def create(self, validated_data):
        """Create user and patient"""
        user = User.objects.create_user(
            email=validated_data['email'],
            password=validated_data['password']
        )
        patient = Patient.objects.create(
            user=user,
            phone=validated_data['phone']
        )
        return patient
```

### Error Response Format

Always return consistent error format:

```json
{
  "error": {
    "field_name": ["Error message"],
    "email": ["Email already registered"],
    "phone": ["Phone must be 10 digits"]
  }
}
```

## Validation Checklist

### Forms to Implement
- [ ] Login Form
- [ ] Patient Registration
- [ ] Doctor Creation (Admin)
- [ ] Appointment Booking
- [ ] Prescription Entry
- [ ] Lab Test Request
- [ ] Lab Report Upload
- [ ] Billing Form

### APIs to Validate
- [ ] Auth API
- [ ] Patient API
- [ ] Doctor API
- [ ] Appointment API
- [ ] Prescription API
- [ ] Lab Request API
- [ ] Lab Report API
- [ ] Billing API

## Key Validation Rules

### Email
- Required
- Valid format (user@domain.com)
- Unique in system
- Case-insensitive comparison

### Phone
- Required
- Exactly 10 digits
- Numeric only
- Unique (for some entities)

### Password
- Required
- Minimum 8 characters
- At least 1 letter
- At least 1 number
- Not same as username/email

### Age
- Must be 18-120
- Numeric
- Positive

### Amount/Price
- Must be positive
- Minimum 0
- Valid decimal format

### File Upload
- Allowed formats: PDF, JPG, PNG
- Maximum size: 10MB
- Virus scan (optional)

### Dropdown Selection
- Required field
- Cannot be default/empty value

### Date/Time
- Must be valid date
- Cannot be in past (for future appointments)
- Business hours validation (if applicable)

## Testing Validation

### Test Cases
1. **Required Field**: Leave empty → Show error
2. **Email Format**: Enter "invalid" → Show error
3. **Phone Length**: Enter "12345" → Show error
4. **Password Strength**: Enter "pass" → Show error
5. **File Upload**: Upload .exe → Show error
6. **Dropdown**: Don't select → Show error
7. **Correct Input**: Enter valid data → No error

### Manual Testing Checklist
- [ ] All fields show error when empty
- [ ] Specific errors match requirements
- [ ] Error messages are clear
- [ ] Red border appears on invalid fields
- [ ] Errors disappear when corrected
- [ ] Submit button disabled on form error
- [ ] Backend validates independently

## Implementation Order

1. Test validation utilities and hook
2. Enhance Login form (example form)
3. Apply same pattern to Register form
4. Apply to Doctor creation form
5. Apply to Appointment booking form
6. Implement backend API validation
7. Test end-to-end flow
8. Apply to remaining forms

## Tips for Implementation

1. **Reuse validators**: Don't write custom validation logic—use utility functions
2. **Clear errors**: Show specific messages, not generic "Invalid input"
3. **Real-time feedback**: Validate as user types (but only after blur)
4. **Disable submit**: Only enable when form is valid
5. **Test both**: Frontend AND backend must validate
6. **Error consistency**: Same field name, similar error message format
7. **Documentation**: Add comments for custom validation rules

## Common Patterns

### Pattern 1: Required Email Field
```tsx
<FormField
  label="Email"
  error={shouldShowError('email') ? getFieldError('email') : null}
  required
>
  <FormInput
    name="email"
    type="email"
    placeholder="user@example.com"
    value={formData.email}
    onChange={handleChange}
    onBlur={handleBlur}
    error={shouldShowError('email')}
  />
</FormField>
```

### Pattern 2: Optional Field with Min Length
```tsx
const validationRules = {
  bio: {
    minLength: 10,
  },
};
```

### Pattern 3: Custom Validation
```tsx
const validationRules = {
  endDate: {
    custom: (value) => {
      if (new Date(value) < new Date()) {
        return 'End date must be in future';
      }
      return null;
    },
  },
};
```

## Frontend Validation Flow

```
User Input
    ↓
On Change → Update state (don't validate yet)
    ↓
On Blur → Mark as touched → Validate → Show error if invalid
    ↓
User Corrects → Re-validate on change → Clear error when valid
    ↓
On Submit → Validate all fields → Send to backend if all valid
    ↓
Backend validates again (independent validation)
    ↓
Show success or backend error
```

## Next Steps

1. Review this guide with team
2. Implement Login form as template
3. Apply same pattern to other forms
4. Update all APIs with serializer validation
5. Create test cases for each form
6. Document custom validation rules for domain-specific fields
