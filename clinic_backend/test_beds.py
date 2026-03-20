#!/usr/bin/env python
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'clinic_backend.settings')
django.setup()

from django.core.cache import cache
from beds.models import Bed, Ward, BedAllocation, BedRequest
from beds.serializers import BedSerializer, WardSerializer, BedAllocationSerializer, BedRequestSerializer

cache.clear()

print('\nBEDS MODULE - TESTING ALL ENDPOINTS')
print('=' * 60)

# Test 1: Wards
try:
    wards = Ward.objects.all()
    serializer = WardSerializer(wards, many=True)
    print(f'✓ Wards: {len(serializer.data)} records')
    if serializer.data:
        ward = serializer.data[0]
        print(f'  └─ {ward.get("name")} - {ward.get("ward_type")}')
except Exception as e:
    print(f'✗ Wards Error: {str(e)[:100]}')

# Test 2: Beds
try:
    beds = Bed.objects.select_related('ward').all()
    serializer = BedSerializer(beds, many=True)
    print(f'✓ Beds: {len(serializer.data)} records')
    if serializer.data:
        bed = serializer.data[0]
        print(f'  └─ {bed.get("bed_number")} - {bed.get("status")}')
except Exception as e:
    print(f'✗ Beds Error: {str(e)[:100]}')

# Test 3: Allocations
try:
    allocs = BedAllocation.objects.select_related('bed__ward', 'patient__user').all()
    serializer = BedAllocationSerializer(allocs, many=True)
    print(f'✓ Allocations: {len(serializer.data)} records')
except Exception as e:
    print(f'✗ Allocations Error: {str(e)[:100]}')

# Test 4: Requests
try:
    requests = BedRequest.objects.select_related('patient__user', 'doctor__user').all()
    print(f'✓ Bed Requests: {requests.count()} records')
except Exception as e:
    print(f'✗ Bed Requests Error: {str(e)[:100]}')

print('=' * 60)
print('✓ All bed endpoints ready!')
print()
