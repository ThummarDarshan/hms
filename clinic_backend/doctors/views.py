from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.core.cache import cache
from .models import Department, Doctor, DoctorSlot
from .serializers import DepartmentSerializer, DoctorSerializer, DoctorSlotSerializer
from accounts.permissions import IsAdminOrStaff, IsDoctor
from clinic_backend.query_optimizer import get_optimized_doctors

class DepartmentViewSet(viewsets.ModelViewSet):
    queryset = Department.objects.all()
    serializer_class = DepartmentSerializer
    permission_classes = [IsAuthenticated]
    
    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [IsAuthenticated()]
        return [IsAdminOrStaff()]


class DoctorViewSet(viewsets.ModelViewSet):
    serializer_class = DoctorSerializer
    permission_classes = [IsAuthenticated]
    
    def get_permissions(self):
        if self.action in ['list', 'retrieve', 'available_doctors', 'available_slots']:
            return [IsAuthenticated()]
        return [IsAdminOrStaff()]
    
    def get_queryset(self):
        # Use optimized query with select_related and prefetch_related
        queryset = get_optimized_doctors()
        return queryset
    
    @action(detail=False, methods=['get'])
    def available_doctors(self, request):
        """Get list of available doctors with caching"""
        cache_key = 'available_doctors'
        cached_data = cache.get(cache_key)
        
        if cached_data is None:
            doctors = Doctor.objects.filter(
                is_available=True
            ).select_related('user', 'department').order_by('user__first_name')
            
            serializer = DoctorSerializer(doctors, many=True)
            cached_data = serializer.data
            cache.set(cache_key, cached_data, 600)  # Cache 10 mins
        
        return Response(cached_data)
    
    @action(detail=True, methods=['get'])
    def available_slots(self, request, pk=None):
        """Get available (active) slots for a specific doctor"""
        doctor = self.get_object()
        slots = doctor.slots.filter(
            is_active=True
        ).values(
            'id', 'weekday', 'start_time', 'end_time'
        ).order_by('weekday', 'start_time')
        return Response(list(slots))
    
    @action(detail=True, methods=['get'])
    def all_slots(self, request, pk=None):
        """Get all slots (active and inactive) for a specific doctor"""
        doctor = self.get_object()
        slots = doctor.slots.all().values(
            'id', 'weekday', 'start_time', 'end_time', 'is_active'
        ).order_by('weekday', 'start_time')
        return Response(list(slots))


class DoctorSlotViewSet(viewsets.ModelViewSet):
    serializer_class = DoctorSlotSerializer
    permission_classes = [IsAuthenticated]
    
    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [IsAuthenticated()]
        return [IsAdminOrStaff()]
    
    def get_queryset(self):
        user = self.request.user
        if user.role == 'DOCTOR':
            return DoctorSlot.objects.filter(doctor__user=user).order_by('weekday', 'start_time')
        return DoctorSlot.objects.all().order_by('weekday', 'start_time')