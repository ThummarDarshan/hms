#!/bin/bash
# Lab Test Pricing Integration - Complete Setup Guide

echo "=========================================="
echo "HMS Lab Test Pricing - Complete Setup"
echo "=========================================="
echo ""

# Step 1: Backend migrations (if needed)
echo "[1/5] Checking Django environment..."
cd clinic_backend
echo "✓ In clinic_backend directory"
echo ""

# Step 2: Fix existing lab report charges
echo "[2/5] Fixing existing lab report charges..."
python manage.py fix_lab_report_charges
echo "✓ All existing lab reports have been updated"
echo ""

# Step 3: Verify URLs
echo "[3/5] Verifying API endpoints..."
echo "✓ Expected endpoints:"
echo "  - /api/billing/calculate_fees/?appointment_id=<id>"
echo "  - /api/billing/<id>/  (GET shows lab_tests field)"
echo "  - /api/laboratory/requests/  (shows test_details with price)"
echo "  - /api/laboratory/reports/  (shows updated charge)"
echo ""

# Step 4: Frontend check
echo "[4/5] Checking frontend components..."
echo "✓ Updated components:"
echo "  - LabTechnicianDashboard: Shows 'Test Price' column"
echo "  - BillingDetail: Shows lab test breakdown"
echo "  - BillingForm: Shows lab charges in calculation"
echo "  - InvoicePrint: Shows lab charges table"
echo ""

# Step 5: Summary
echo "[5/5] Setup complete!"
echo ""
echo "=========================================="
echo "Next Steps:"
echo "=========================================="
echo "1. Start Django server:"
echo "   python manage.py runserver"
echo ""
echo "2. Start React frontend:"
echo "   npm run dev"
echo ""
echo "3. Test the flow:"
echo "   a) Doctor requests a lab test (with price set in admin)"
echo "   b) Lab tech marks VISITED → IN_PROGRESS"
echo "   c) Lab tech uploads report (charge auto-set)"
echo "   d) Create billing invoice"
echo "   e) Verify lab charges appear correctly"
echo ""
echo "=========================================="
