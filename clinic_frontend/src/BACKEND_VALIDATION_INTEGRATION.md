# Backend Validation Integration Guide

## Overview

All Django REST Framework serializers have been enhanced with comprehensive field-level validation. This guide explains how to properly handle and display these validation errors on the frontend.

## Backend Validation Architecture

### 1. Centralized Validators (`accounts/validators.py`)

The backend provides reusable validators:

```python
HMSValidators.validate_email(email)              # Email format validation
HMSValidators.validate_phone(phone)             # 10-digit phone validation
HMSValidators.validate_password_strength(pwd)   # Password strength validation
HMSValidators.validate_age(age)                 # Age range validation
HMSValidators.validate_name(name)               # Name format validation
HMSValidators.validate_uhid(uhid)               # UHID format validation (UHxxx-xxxx)
HMSValidators.validate_positive_number(val)     # Positive number validation
HMSValidators.validate_file(file, ext, size)    # File type and size validation
```

### 2. Module-Specific Validations

#### Accounts (`accounts/serializers.py`)
- **Email**: Format validation, uniqueness check
- **Phone**: 10-digit validation
- **Password**: Minimum 8 chars, must include letters + numbers
- **Names**: Only letters, spaces, hyphens, apostrophes, 2-100 chars
- **Password Confirmation**: Passwords must match

#### Doctors (`doctors/serializers.py`)
- **Specialization**: 2-100 characters
- **Qualification**: 2-255 characters
- **Experience Years**: 0-60 years
- **Consultation Fee**: ₹1 - ₹50,000
- **License Number**: 5-50 alphanumeric characters
- **Bio**: Maximum 1000 characters

#### Patients (`patients/serializers.py`)
- **Date of Birth**: Must be past date, age 0-120
- **Gender**: Must be M, F, or O
- **Blood Group**: Valid blood group (A+, A-, B+, B-, O+, O-, AB+, AB-)
- **Phone/Emergency Contact**: 10-digit phone numbers
- **UHID**: Format UHxxx-xxxx
- **Address/History/Allergies**: Max 500-1000 characters

#### Appointments (`appointments/serializers.py`)
- **Date**: Must be future date, within 6 months
- **Time**: Valid time format (HH:MM:SS)
- **Reason**: 5-500 characters, required
- **Status**: SCHEDULED, COMPLETED, CANCELLED, NO_SHOW
- **Conflict Check**: Prevents double-booking for patient/doctor

#### Prescriptions (`records/serializers.py`)
- **Diagnosis**: 5-500 characters, required
- **Medications**: 5-2000 characters, required
- **Instructions**: Maximum 1000 characters
- **Follow-up Date**: Must be future date, within 1 year
- **Bed Days**: Must be positive when bed required

#### Lab Tests (`laboratory/serializers.py`)
- **Test Name**: 2-100 characters
- **Price**: Must be positive number
- **Result Summary**: 10-2000 characters when uploading reports
- **Report File**: PDF/JPG/PNG/DOC/DOCX, max 50MB

#### Billing (`billing/serializers.py`)
- **Doctor Fee**: Non-negative number
- **Hospital Charge**: Non-negative number
- **Bed Charge**: Non-negative number
- **Discount Percentage**: 0-100%
- **Paid Amount**: Cannot exceed final amount
- **Payment Method**: CASH, CARD, ONLINE, INSURANCE, OTHER

#### Beds (`beds/serializers.py`)
- **Ward Name**: 2-100 characters
- **Ward Type**: GENERAL, ICU, PRIVATE, SEMI_PRIVATE
- **Floor Number**: -5 to 50
- **Bed Number**: Max 20 characters
- **Bed Type**: SINGLE, DOUBLE, ICU, GENERAL
- **Price Per Day**: Must be positive

## API Error Response Format

When validation fails, the API returns a 400 error with this format:

```json
{
  "field_name": ["Error message"],
  "another_field": ["Error 1", "Error 2"],
  "non_field_errors": ["General validation error"]
}
```

### Example Error Response

```json
{
  "email": ["Please enter a valid email address"],
  "phone": ["Phone number must be exactly 10 digits"],
  "password": ["Password must contain at least one number"],
  "confirm_password": ["Passwords do not match"],
  "non_field_errors": ["A prescription already exists for this appointment"]
}
```

## Frontend Implementation Pattern

### Step 1: Define Validation Rules Object

Create a validation rules object matching backend requirements:

```typescript
// For patient registration
const validationRules = {
  email: [
    { validator: (val) => validators.isRequired(val), message: "Email is required" },
    { validator: (val) => validators.isValidEmail(val), message: "Invalid email format" }
  ],
  phone: [
    { validator: (val) => validators.isValidPhone(val), message: "Phone must be 10 digits" }
  ],
  first_name: [
    { validator: (val) => validators.isValidName(val), message: "First name is invalid" }
  ],
  password: [
    { validator: (val) => validators.isPasswordStrong(val), message: "Password must have 8+ chars, letters and numbers" }
  ],
  confirm_password: [
    { validator: (val, formData) => val === formData.password, message: "Passwords must match" }
  ]
};
```

### Step 2: Use useFormValidation Hook

```typescript
import { useFormValidation } from '@/hooks/useFormValidation';

function PatientRegistrationForm() {
  const { formData, errors, touched, isSubmitting, handleChange, handleBlur, handleSubmit, setFieldError } = 
    useFormValidation(initialValues, onSubmit, validationRules);
  
  const submitForm = async (values) => {
    try {
      const response = await patientAPI.register(values);
      // Success...
    } catch (error) {
      // Handle backend validation errors
      const backendErrors = error.response?.data;
      
      // Populate frontend errors with backend validation
      if (backendErrors) {
        Object.keys(backendErrors).forEach(field => {
          setFieldError(field, backendErrors[field][0]);
        });
      }
    }
  };
  
  return (
    <form onSubmit={handleSubmit(submitForm)}>
      {/* Field with validation display */}
    </form>
  );
}
```

### Step 3: Display FormField Components

```typescript
<FormField
  label="Email Address"
  error={errors.email}
  touched={touched.has('email')}
  helperText="We'll use this to send you updates"
>
  <FormInput
    name="email"
    type="email"
    placeholder="your.email@example.com"
    value={formData.email}
    onChange={handleChange}
    onBlur={handleBlur}
    isInvalid={errors.email !== undefined && touched.has('email')}
  />
</FormField>

<FormField
  label="Phone Number"
  error={errors.phone}
  touched={touched.has('phone')}
  helperText="10-digit phone number"
>
  <FormInput
    name="phone"
    type="tel"
    placeholder="9876543210"
    value={formData.phone}
    onChange={handleChange}
    onBlur={handleBlur}
    isInvalid={errors.phone !== undefined && touched.has('phone')}
  />
</FormField>

<FormField
  label="Password"
  error={errors.password}
  touched={touched.has('password')}
  helperText="Min 8 chars with letters and numbers"
>
  <FormInput
    name="password"
    type="password"
    value={formData.password}
    onChange={handleChange}
    onBlur={handleBlur}
    isInvalid={errors.password !== undefined && touched.has('password')}
  />
</FormField>
```

## Backend + Frontend Validation Flow

### Scenario: Patient Registration

1. **Frontend Validation** (Real-time)
   - User types in form field
   - `onChange` triggers validation for that field
   - Error displayed immediately if invalid
   - Submit button disabled if any errors exist

2. **User Submits** (Form level)
   - All fields validated again
   - If any errors remain, form doesn't submit
   - User sees all errors highlighted in red

3. **API Call**
   - Frontend sends validated data to backend
   - Backend serializer validates again independently
   - Backend may find additional issues (e.g., email already exists)

4. **Backend Error Handling** (If backend validation fails)
   - API returns 400 with field errors
   - Frontend catches error in catch block
   - Maps backend errors to frontend fields using `setFieldError`
   - User sees backend error message in red

5. **Success**
   - API returns 200
   - User redirected or form cleared

### Example Implementation

```typescript
async function handleRegistration(values) {
  try {
    // Only submitting if frontend validation passes
    const response = await patientAPI.register(values);
    
    // Success!
    toast.success("Registration successful!");
    navigate("/login");
    
  } catch (error) {
    // Handle backend validation errors
    if (error.response?.status === 400) {
      const backendErrors = error.response.data;
      
      // Map each backend error to frontend field
      Object.entries(backendErrors).forEach(([field, messages]) => {
        setFieldError(field, messages[0]); // Show first error message
      });
      
      // Show general error toast
      toast.error("Please fix the errors below");
    } else if (error.response?.status === 500) {
      toast.error("Server error. Please try again later.");
    } else {
      toast.error("Network error. Please check your connection.");
    }
  }
}
```

## Validation Rules by Module

### Patient Registration
- ✅ Email format + uniqueness
- ✅ Phone 10-digit format
- ✅ Password strength (8+ chars, letters + numbers)
- ✅ Password confirmation
- ✅ Name format (2-100 chars, letters/spaces/hyphens/apostrophes)

### Doctor Creation
- ✅ Department exists
- ✅ User not already a doctor
- ✅ Specialization (2-100 chars)
- ✅ Qualification (2-255 chars)
- ✅ Experience (0-60 years)
- ✅ Consultation Fee (₹1-50,000)
- ✅ License Number (5-50 chars)
- ✅ Bio (max 1000 chars)

### Appointment Booking
- ✅ Future date (within 6 months)
- ✅ Valid time format
- ✅ Reason (5-500 chars)
- ✅ No double-booking for patient/doctor
- ✅ Doctor is available

### Lab Test Request
- ✅ Valid test type
- ✅ Patient exists
- ✅ Valid status
- ✅ Notes (max 1000 chars)

### Lab Report Upload
- ✅ File type validation (PDF/JPG/PNG/DOC/DOCX)
- ✅ File size (max 50MB)
- ✅ Result summary (10-2000 chars)

### Billing Entry
- ✅ Appointment exists
- ✅ Patient exists
- ✅ All amounts non-negative
- ✅ Discount 0-100%
- ✅ Paid amount ≤ final amount
- ✅ Valid payment method

### Prescription Entry
- ✅ Appointment exists
- ✅ Diagnosis (5-500 chars)
- ✅ Medications (5-2000 chars)
- ✅ Follow-up date (future, within 1 year)
- ✅ If bed required: bed days > 0

## Testing Validation

### Test Invalid Cases

```bash
# Test email validation
curl -X POST http://localhost:8000/api/auth/register/ \
  -H "Content-Type: application/json" \
  -d '{"email": "invalid-email", "password": "Test123"}'
# Expected: "Please enter a valid email address"

# Test phone validation  
curl -X POST http://localhost:8000/api/auth/register/ \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "phone": "123", "password": "Test123"}'
# Expected: "Phone number must be exactly 10 digits"

# Test password strength
curl -X POST http://localhost:8000/api/auth/register/ \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "password": "short"}'
# Expected: "Password must be at least 8 characters"

# Test duplicate email
curl -X POST http://localhost:8000/api/auth/register/ \
  -H "Content-Type: application/json" \
  -d '{"email": "existing@test.com", "password": "Test123"}'
# Expected: "Email already registered"
```

### Test Valid Cases

```bash
# Valid registration
curl -X POST http://localhost:8000/api/auth/register/ \
  -H "Content-Type: application/json" \
  -d '{
    "email": "newpatient@test.com",
    "phone": "9876543210",
    "first_name": "John",
    "last_name": "Doe",
    "password": "SecurePass123",
    "confirm_password": "SecurePass123"
  }'
# Expected: 201 Created with user details
```

## Common Validation Patterns

### Conditional Validation
```typescript
// Only validate bed_days if bed_required is true
const bedDaysValidator = {
  validator: (val, formData) => {
    if (!formData.bed_required) return true;
    return val > 0;
  },
  message: "Must specify bed days if bed is required"
};
```

### Cross-Field Validation
```typescript
// Compare two fields
const confirmPasswordValidator = {
  validator: (val, formData) => val === formData.password,
  message: "Passwords do not match"
};
```

### Dependent Validation
```typescript
// Age validation based on context
const ageValidator = {
  validator: (val) => {
    const age = parseInt(val);
    return age >= 18 && age <= 120;
  },
  message: "Age must be between 18 and 120"
};
```

## Notes

- Frontend validation is for UX (real-time feedback)
- Backend validation is for security (always independent)
- Never trust frontend validation alone
- Backend may find issues frontend doesn't check (e.g., uniqueness)
- Always handle backend error responses gracefully
- Display backend error messages to user in red
- Map backend field errors to frontend form fields

## Files Modified/Created This Session

**Backend Validators:**
- `/clinic_backend/accounts/validators.py` - ✅ Created (300+ lines)

**Backend Serializers Enhanced:**
- `/clinic_backend/accounts/serializers.py` - ✅ Updated with comprehensive validation
- `/clinic_backend/doctors/serializers.py` - ✅ Updated with comprehensive validation
- `/clinic_backend/patients/serializers.py` - ✅ Updated with comprehensive validation
- `/clinic_backend/appointments/serializers.py` - ✅ Updated with comprehensive validation
- `/clinic_backend/records/serializers.py` - ✅ Updated with comprehensive validation
- `/clinic_backend/laboratory/serializers.py` - ✅ Updated with comprehensive validation
- `/clinic_backend/billing/serializers.py` - ✅ Updated with comprehensive validation
- `/clinic_backend/beds/serializers.py` - ✅ Updated with comprehensive validation

**Frontend Validation Infrastructure (Created in Previous Session):**
- `/clinic_frontend/src/utils/validation.ts` - ✅ 15+ validators
- `/clinic_frontend/src/hooks/useFormValidation.ts` - ✅ Form state + validation hook
- `/clinic_frontend/src/components/common/FormField.tsx` - ✅ Reusable form components
- `/clinic_frontend/src/components/auth/LoginEnhancedExample.tsx` - ✅ Example implementation

**This Guide:**
- `/clinic_frontend/src/BACKEND_VALIDATION_INTEGRATION.md` - ✅ This file
