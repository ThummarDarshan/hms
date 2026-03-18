"""
QuerySet Optimization Utilities
Provides helpers to reduce N+1 queries and optimize performance
"""

from django.db.models import Prefetch, QuerySet
from functools import wraps

def optimize_queryset(queryset: QuerySet, select_related_fields=None, prefetch_related_fields=None):
    """
    Optimizes a queryset with select_related and prefetch_related
    
    Args:
        queryset: The QuerySet to optimize
        select_related_fields: List of fields to select_related
        prefetch_related_fields: List of fields to prefetch_related
    
    Returns:
        Optimized QuerySet
    """
    if select_related_fields:
        queryset = queryset.select_related(*select_related_fields)
    
    if prefetch_related_fields:
        queryset = queryset.prefetch_related(*prefetch_related_fields)
    
    return queryset


def cache_on_model(timeout=3600):
    """
    Decorator to cache model querysets
    """
    def decorator(func):
        @wraps(func)
        def wrapper(self, *args, **kwargs):
            from django.core.cache import cache
            cache_key = f"{self.__class__.__name__}_{func.__name__}_{str(args)}_{str(kwargs)}"
            
            result = cache.get(cache_key)
            if result is None:
                result = func(self, *args, **kwargs)
                cache.set(cache_key, result, timeout)
            
            return result
        return wrapper
    return decorator


# Optimized querysets for common models

from doctors.models import Doctor, DoctorSlot, Department
from patients.models import Patient
from appointments.models import Appointment
from records.models import Prescription
from billing.models import Billing
from beds.models import Bed, BedAllocation
from laboratory.models import LabReport, LabTestType


def get_optimized_doctors():
    """Get doctors with optimized queries"""
    return Doctor.objects.select_related(
        'user',
        'department'
    ).prefetch_related(
        'slots',
        'appointments'
    )


def get_optimized_patients():
    """Get patients with optimized queries"""
    return Patient.objects.select_related(
        'user'
    ).prefetch_related(
        'appointments',
        'prescriptions'
    )


def get_optimized_appointments():
    """Get appointments with optimized queries"""
    return Appointment.objects.select_related(
        'patient__user',
        'doctor__user',
        'doctor__department'
    ).prefetch_related(
        'prescriptions'
    )


def get_optimized_billing():
    """Get billing records with optimized queries"""
    return Billing.objects.select_related(
        'patient__user',
        'appointment'
    ).prefetch_related(
        'prescriptions'
    )


def get_optimized_lab_reports():
    """Get lab reports with optimized queries"""
    return LabReport.objects.select_related(
        'lab_request__patient__user',
        'lab_request__doctor__user',
        'lab_request__test',
        'technician'
    )


def get_optimized_bed_allocations():
    """Get bed allocations with optimized queries"""
    return BedAllocation.objects.select_related(
        'bed',
        'patient__user',
        'appointment'
    )
