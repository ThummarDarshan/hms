"""
Comprehensive Validation Testing Guide
Test cases for backend API validation across all modules
"""

import json
import requests
from datetime import datetime, timedelta

# API base URL
BASE_URL = "http://localhost:8000/api"

# ========== AUTHENTICATION VALIDATION TESTS ==========

def test_user_registration():
    """Test user registration validation"""
    
    print("\n=== USER REGISTRATION VALIDATION ===\n")
    
    # Test 1: Valid registration
    print("✓ Test 1: Valid registration")
    payload = {
        "email": "patient@test.com",
        "phone": "9876543210",
        "first_name": "John",
        "last_name": "Doe",
        "password": "SecurePass123",
        "confirm_password": "SecurePass123"
    }
    response = requests.post(f"{BASE_URL}/auth/register/", json=payload)
    print(f"Status: {response.status_code} (Expected: 201)")
    if response.status_code != 201:
        print(f"Error: {response.json()}\n")
    
    # Test 2: Invalid email format
    print("✓ Test 2: Invalid email format")
    payload["email"] = "invalid-email"
    response = requests.post(f"{BASE_URL}/auth/register/", json=payload)
    print(f"Status: {response.status_code} (Expected: 400)")
    print(f"Error: {response.json().get('email', 'No email error')}\n")
    
    # Test 3: Phone not 10 digits
    print("✓ Test 3: Phone not 10 digits")
    payload["email"] = "test@example.com"
    payload["phone"] = "123"
    response = requests.post(f"{BASE_URL}/auth/register/", json=payload)
    print(f"Status: {response.status_code} (Expected: 400)")
    print(f"Error: {response.json().get('phone', 'No phone error')}\n")
    
    # Test 4: Weak password
    print("✓ Test 4: Weak password (no numbers)")
    payload["phone"] = "9876543210"
    payload["password"] = "OnlyLetters"
    response = requests.post(f"{BASE_URL}/auth/register/", json=payload)
    print(f"Status: {response.status_code} (Expected: 400)")
    print(f"Error: {response.json().get('password', 'No password error')}\n")
    
    # Test 5: Passwords don't match
    print("✓ Test 5: Passwords don't match")
    payload["password"] = "SecurePass123"
    payload["confirm_password"] = "DifferentPass123"
    response = requests.post(f"{BASE_URL}/auth/register/", json=payload)
    print(f"Status: {response.status_code} (Expected: 400)")
    print(f"Error: {response.json().get('confirm_password', 'No confirm error')}\n")
    
    # Test 6: Duplicate email
    print("✓ Test 6: Duplicate email (if patient already exists)")
    payload["confirm_password"] = "SecurePass123"
    response = requests.post(f"{BASE_URL}/auth/register/", json=payload)
    if response.status_code == 400:
        print(f"Error: {response.json().get('email', 'No email error')}\n")
    else:
        print(f"Skipped - patient already exists\n")


def test_user_login():
    """Test login validation"""
    
    print("\n=== LOGIN VALIDATION ===\n")
    
    # Test 1: Valid login
    print("✓ Test 1: Valid login")
    payload = {"email": "patient@test.com", "password": "SecurePass123"}
    response = requests.post(f"{BASE_URL}/auth/login/", json=payload)
    print(f"Status: {response.status_code} (Expected: 200)")
    if response.status_code != 200:
        print(f"Error: {response.json()}\n")
    
    # Test 2: Invalid email format
    print("✓ Test 2: Invalid email format")
    payload["email"] = "invalid"
    response = requests.post(f"{BASE_URL}/auth/login/", json=payload)
    print(f"Status: {response.status_code} (Expected: 400)")
    print(f"Error: {response.json()}\n")
    
    # Test 3: Wrong password
    print("✓ Test 3: Wrong password")
    payload["email"] = "patient@test.com"
    payload["password"] = "WrongPassword123"
    response = requests.post(f"{BASE_URL}/auth/login/", json=payload)
    print(f"Status: {response.status_code} (Expected: 400)")
    print(f"Error: {response.json()}\n")


# ========== DOCTOR VALIDATION TESTS ==========

def test_doctor_creation():
    """Test doctor profile validation"""
    
    print("\n=== DOCTOR CREATION VALIDATION ===\n")
    
    # Assuming we're authenticated and have a user token
    headers = {"Authorization": "Bearer YOUR_TOKEN"}
    
    # Test 1: Valid doctor profile
    print("✓ Test 1: Valid doctor profile")
    payload = {
        "user": 1,  # User ID
        "department": 1,  # Department ID
        "specialization": "Cardiologist",
        "qualification": "MBBS, MD (Cardiology)",
        "experience_years": 10,
        "consultation_fee": 500,
        "license_number": "MED123456"
    }
    response = requests.post(f"{BASE_URL}/doctors/", json=payload, headers=headers)
    print(f"Status: {response.status_code} (Expected: 201)")
    
    # Test 2: Invalid experience (>60 years)
    print("✓ Test 2: Invalid experience (>60 years)")
    payload["experience_years"] = 100
    response = requests.post(f"{BASE_URL}/doctors/", json=payload, headers=headers)
    print(f"Status: {response.status_code} (Expected: 400)")
    print(f"Error: {response.json().get('experience_years', 'No error')}\n")
    
    # Test 3: Consultation fee too high
    print("✓ Test 3: Consultation fee too high")
    payload["experience_years"] = 10
    payload["consultation_fee"] = 75000
    response = requests.post(f"{BASE_URL}/doctors/", json=payload, headers=headers)
    print(f"Status: {response.status_code} (Expected: 400)")
    print(f"Error: {response.json().get('consultation_fee', 'No error')}\n")
    
    # Test 4: Short specialization
    print("✓ Test 4: Short specialization (<2 chars)")
    payload["consultation_fee"] = 500
    payload["specialization"] = "C"
    response = requests.post(f"{BASE_URL}/doctors/", json=payload, headers=headers)
    print(f"Status: {response.status_code} (Expected: 400)")
    print(f"Error: {response.json().get('specialization', 'No error')}\n")


# ========== PATIENT VALIDATION TESTS ==========

def test_patient_profile():
    """Test patient profile validation"""
    
    print("\n=== PATIENT PROFILE VALIDATION ===\n")
    
    headers = {"Authorization": "Bearer YOUR_TOKEN"}
    
    # Test 1: Valid patient profile
    print("✓ Test 1: Valid patient profile")
    payload = {
        "user": 2,
        "uhid": "UH001-0001",
        "date_of_birth": "1995-05-15",
        "gender": "M",
        "blood_group": "O+",
        "address": "123 Main Street, City",
        "emergency_contact": "9876543210"
    }
    response = requests.post(f"{BASE_URL}/patients/", json=payload, headers=headers)
    print(f"Status: {response.status_code} (Expected: 201)")
    
    # Test 2: Invalid date of birth (future date)
    print("✓ Test 2: Invalid date of birth (future date)")
    payload["date_of_birth"] = "2030-01-01"
    response = requests.post(f"{BASE_URL}/patients/", json=payload, headers=headers)
    print(f"Status: {response.status_code} (Expected: 400)")
    print(f"Error: {response.json().get('date_of_birth', 'No error')}\n")
    
    # Test 3: Invalid UHID format
    print("✓ Test 3: Invalid UHID format")
    payload["date_of_birth"] = "1995-05-15"
    payload["uhid"] = "INVALID-FORMAT"
    response = requests.post(f"{BASE_URL}/patients/", json=payload, headers=headers)
    print(f"Status: {response.status_code} (Expected: 400)")
    print(f"Error: {response.json().get('uhid', 'No error')}\n")
    
    # Test 4: Invalid blood group
    print("✓ Test 4: Invalid blood group")
    payload["uhid"] = "UH001-0001"
    payload["blood_group"] = "X+"
    response = requests.post(f"{BASE_URL}/patients/", json=payload, headers=headers)
    print(f"Status: {response.status_code} (Expected: 400)")
    print(f"Error: {response.json().get('blood_group', 'No error')}\n")
    
    # Test 5: Invalid gender
    print("✓ Test 5: Invalid gender")
    payload["blood_group"] = "O+"
    payload["gender"] = "X"
    response = requests.post(f"{BASE_URL}/patients/", json=payload, headers=headers)
    print(f"Status: {response.status_code} (Expected: 400)")
    print(f"Error: {response.json().get('gender', 'No error')}\n")


# ========== APPOINTMENT VALIDATION TESTS ==========

def test_appointment_booking():
    """Test appointment booking validation"""
    
    print("\n=== APPOINTMENT BOOKING VALIDATION ===\n")
    
    headers = {"Authorization": "Bearer YOUR_TOKEN"}
    future_date = (datetime.now() + timedelta(days=5)).strftime("%Y-%m-%d")
    
    # Test 1: Valid appointment
    print("✓ Test 1: Valid appointment")
    payload = {
        "patient": 1,
        "doctor": 1,
        "appointment_date": future_date,
        "appointment_time": "10:00:00",
        "reason": "Regular health checkup"
    }
    response = requests.post(f"{BASE_URL}/appointments/", json=payload, headers=headers)
    print(f"Status: {response.status_code} (Expected: 201)")
    
    # Test 2: Past appointment date
    print("✓ Test 2: Past appointment date")
    payload["appointment_date"] = "2020-01-01"
    response = requests.post(f"{BASE_URL}/appointments/", json=payload, headers=headers)
    print(f"Status: {response.status_code} (Expected: 400)")
    print(f"Error: {response.json()}\n")
    
    # Test 3: Short reason
    print("✓ Test 3: Short reason (<5 chars)")
    payload["appointment_date"] = future_date
    payload["reason"] = "Bad"
    response = requests.post(f"{BASE_URL}/appointments/", json=payload, headers=headers)
    print(f"Status: {response.status_code} (Expected: 400)")
    print(f"Error: {response.json().get('reason', 'No error')}\n")
    
    # Test 4: Too far in future (>6 months)
    print("✓ Test 4: Too far in future (>6 months)")
    far_date = (datetime.now() + timedelta(days=200)).strftime("%Y-%m-%d")
    payload["reason"] = "Regular health checkup"
    payload["appointment_date"] = far_date
    response = requests.post(f"{BASE_URL}/appointments/", json=payload, headers=headers)
    print(f"Status: {response.status_code} (Expected: 400)")
    print(f"Error: {response.json()}\n")


# ========== PRESCRIPTION VALIDATION TESTS ==========

def test_prescription_entry():
    """Test prescription validation"""
    
    print("\n=== PRESCRIPTION ENTRY VALIDATION ===\n")
    
    headers = {"Authorization": "Bearer YOUR_TOKEN"}
    
    # Test 1: Valid prescription
    print("✓ Test 1: Valid prescription")
    payload = {
        "appointment": 1,
        "diagnosis": "Hypertension (High Blood Pressure)",
        "medications": "Amlodipine 5mg daily, Enalapril 10mg daily",
        "instructions": "Take medications as prescribed. Follow up in 2 weeks.",
        "follow_up_date": (datetime.now() + timedelta(days=14)).strftime("%Y-%m-%d")
    }
    response = requests.post(f"{BASE_URL}/prescriptions/", json=payload, headers=headers)
    print(f"Status: {response.status_code} (Expected: 201)")
    
    # Test 2: Short diagnosis
    print("✓ Test 2: Short diagnosis (<5 chars)")
    payload["diagnosis"] = "Cold"
    response = requests.post(f"{BASE_URL}/prescriptions/", json=payload, headers=headers)
    print(f"Status: {response.status_code} (Expected: 400)")
    print(f"Error: {response.json().get('diagnosis', 'No error')}\n")
    
    # Test 3: Missing medications
    print("✓ Test 3: Missing medications")
    payload["diagnosis"] = "Hypertension (High Blood Pressure)"
    payload["medications"] = ""
    response = requests.post(f"{BASE_URL}/prescriptions/", json=payload, headers=headers)
    print(f"Status: {response.status_code} (Expected: 400)")
    print(f"Error: {response.json().get('medications', 'No error')}\n")
    
    # Test 4: Bed required without bed days
    print("✓ Test 4: Bed required without bed days")
    payload["medications"] = "Amlodipine 5mg daily"
    payload["bed_required"] = True
    payload["expected_bed_days"] = 0
    response = requests.post(f"{BASE_URL}/prescriptions/", json=payload, headers=headers)
    print(f"Status: {response.status_code} (Expected: 400)")
    print(f"Error: {response.json()}\n")


# ========== LABORATORY VALIDATION TESTS ==========

def test_lab_tests():
    """Test laboratory validation"""
    
    print("\n=== LABORATORY VALIDATION ===\n")
    
    headers = {"Authorization": "Bearer YOUR_TOKEN"}
    
    # Test 1: Valid lab request
    print("✓ Test 1: Valid lab request")
    payload = {
        "patient": 1,
        "test": 1,
        "notes": "Annual health checkup - Complete Blood Count required"
    }
    response = requests.post(f"{BASE_URL}/lab-requests/", json=payload, headers=headers)
    print(f"Status: {response.status_code} (Expected: 201)")
    
    # Test 2: Invalid test ID
    print("✓ Test 2: Invalid test ID")
    payload["test"] = 999999
    response = requests.post(f"{BASE_URL}/lab-requests/", json=payload, headers=headers)
    print(f"Status: {response.status_code} (Expected: 400)")
    print(f"Error: {response.json()}\n")


# ========== BILLING VALIDATION TESTS ==========

def test_billing():
    """Test billing validation"""
    
    print("\n=== BILLING VALIDATION ===\n")
    
    headers = {"Authorization": "Bearer YOUR_TOKEN"}
    
    # Test 1: Valid billing
    print("✓ Test 1: Valid billing")
    payload = {
        "appointment": 1,
        "doctor_fee": 500,
        "hospital_charge": 200,
        "discount_percentage": 10,
        "paid_amount": 630
    }
    response = requests.post(f"{BASE_URL}/billing/", json=payload, headers=headers)
    print(f"Status: {response.status_code} (Expected: 201)")
    
    # Test 2: Paid amount exceeds final amount
    print("✓ Test 2: Paid amount exceeds final amount")
    payload["paid_amount"] = 10000
    response = requests.post(f"{BASE_URL}/billing/", json=payload, headers=headers)
    print(f"Status: {response.status_code} (Expected: 400)")
    print(f"Error: {response.json()}\n")
    
    # Test 3: Discount > 100%
    print("✓ Test 3: Discount > 100%")
    payload["paid_amount"] = 630
    payload["discount_percentage"] = 150
    response = requests.post(f"{BASE_URL}/billing/", json=payload, headers=headers)
    print(f"Status: {response.status_code} (Expected: 400)")
    print(f"Error: {response.json().get('discount_percentage', 'No error')}\n")


# ========== MANUAL TESTING WITH CURL ==========

CURL_EXAMPLES = """
# Test Invalid Email
curl -X POST http://localhost:8000/api/auth/register/ \\
  -H "Content-Type: application/json" \\
  -d '{
    "email": "invalid-email",
    "phone": "9876543210",
    "first_name": "John",
    "last_name": "Doe",
    "password": "SecurePass123",
    "confirm_password": "SecurePass123"
  }'

# Test Invalid Phone
curl -X POST http://localhost:8000/api/auth/register/ \\
  -H "Content-Type: application/json" \\
  -d '{
    "email": "test@example.com",
    "phone": "12345",
    "first_name": "John",
    "last_name": "Doe",
    "password": "SecurePass123",
    "confirm_password": "SecurePass123"
  }'

# Test Weak Password
curl -X POST http://localhost:8000/api/auth/register/ \\
  -H "Content-Type: application/json" \\
  -d '{
    "email": "test@example.com",
    "phone": "9876543210",
    "first_name": "John",
    "last_name": "Doe",
    "password": "OnlyLetters",
    "confirm_password": "OnlyLetters"
  }'

# Test Password Mismatch
curl -X POST http://localhost:8000/api/auth/register/ \\
  -H "Content-Type: application/json" \\
  -d '{
    "email": "test@example.com",
    "phone": "9876543210",
    "first_name": "John",
    "last_name": "Doe",
    "password": "SecurePass123",
    "confirm_password": "DifferentPass123"
  }'

# Test Valid Registration
curl -X POST http://localhost:8000/api/auth/register/ \\
  -H "Content-Type: application/json" \\
  -d '{
    "email": "newpatient@test.com",
    "phone": "9876543210",
    "first_name": "John",
    "last_name": "Doe",
    "password": "SecurePass123",
    "confirm_password": "SecurePass123"
  }'

# Test Invalid UHID Format
curl -X POST http://localhost:8000/api/patients/ \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer YOUR_TOKEN" \\
  -d '{
    "user": 2,
    "uhid": "INVALID",
    "date_of_birth": "1995-05-15",
    "gender": "M",
    "blood_group": "O+",
    "address": "123 Main St"
  }'

# Test Invalid Blood Group
curl -X POST http://localhost:8000/api/patients/ \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer YOUR_TOKEN" \\
  -d '{
    "user": 2,
    "uhid": "UH001-0001",
    "date_of_birth": "1995-05-15",
    "gender": "M",
    "blood_group": "X+",
    "address": "123 Main St"
  }'

# Test Invalid Appointment Date (Past)
curl -X POST http://localhost:8000/api/appointments/ \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer YOUR_TOKEN" \\
  -d '{
    "patient": 1,
    "doctor": 1,
    "appointment_date": "2020-01-01",
    "appointment_time": "10:00:00",
    "reason": "Regular checkup"
  }'

# Test Appointment Too Far in Future (>6 months)
curl -X POST http://localhost:8000/api/appointments/ \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer YOUR_TOKEN" \\
  -d '{
    "patient": 1,
    "doctor": 1,
    "appointment_date": "2026-01-01",
    "appointment_time": "10:00:00",
    "reason": "Regular checkup appointment"
  }'

# Test Short Appointment Reason
curl -X POST http://localhost:8000/api/appointments/ \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer YOUR_TOKEN" \\
  -d '{
    "patient": 1,
    "doctor": 1,
    "appointment_date": "2025-02-01",
    "appointment_time": "10:00:00",
    "reason": "Bad"
  }'

# Test Invalid Doctor Experience
curl -X POST http://localhost:8000/api/doctors/ \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer YOUR_TOKEN" \\
  -d '{
    "user": 1,
    "department": 1,
    "specialization": "Cardiologist",
    "qualification": "MBBS, MD",
    "experience_years": 100,
    "consultation_fee": 500,
    "license_number": "MED123456"
  }'

# Test Consultation Fee Too High
curl -X POST http://localhost:8000/api/doctors/ \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer YOUR_TOKEN" \\
  -d '{
    "user": 1,
    "department": 1,
    "specialization": "Cardiologist",
    "qualification": "MBBS, MD",
    "experience_years": 10,
    "consultation_fee": 100000,
    "license_number": "MED123456"
  }'

# Test Billing Amount Inconsistency
curl -X POST http://localhost:8000/api/billing/ \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer YOUR_TOKEN" \\
  -d '{
    "appointment": 1,
    "doctor_fee": 500,
    "hospital_charge": 200,
    "discount_percentage": 10,
    "paid_amount": 10000
  }'

# Test Invalid Discount Percentage
curl -X POST http://localhost:8000/api/billing/ \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer YOUR_TOKEN" \\
  -d '{
    "appointment": 1,
    "doctor_fee": 500,
    "hospital_charge": 200,
    "discount_percentage": 150,
    "paid_amount": 630
  }'
"""

if __name__ == "__main__":
    print("=" * 60)
    print("COMPREHENSIVE VALIDATION TESTING SUITE")
    print("=" * 60)
    
    print("\n📝 NOTE: Replace YOUR_TOKEN with actual JWT token from login")
    print("📝 Replace IDs (user, doctor, patient, etc.) with actual database IDs")
    print("\nRun individual test functions as needed:")
    print("  - test_user_registration()")
    print("  - test_user_login()")
    print("  - test_doctor_creation()")
    print("  - test_patient_profile()")
    print("  - test_appointment_booking()")
    print("  - test_prescription_entry()")
    print("  - test_lab_tests()")
    print("  - test_billing()")
    
    print("\n" + "=" * 60)
    print("CURL EXAMPLES FOR MANUAL TESTING")
    print("=" * 60)
    print(CURL_EXAMPLES)
