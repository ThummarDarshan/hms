from rest_framework import viewsets, permissions, status
from rest_framework.response import Response
from rest_framework.decorators import action
from .models import LabTestType, LabRequest, LabReport
from .serializers import LabTestTypeSerializer, LabRequestSerializer, LabReportSerializer
from django.db.models import Q
from billing.models import Billing
from decimal import Decimal
import uuid

class IsAdminUser(permissions.BasePermission):
    def has_permission(self, request, view):
        return bool(request.user and request.user.role == 'ADMIN')

class IsDoctorUser(permissions.BasePermission):
    def has_permission(self, request, view):
        return bool(request.user and request.user.role == 'DOCTOR')

class IsLabTechUser(permissions.BasePermission):
    def has_permission(self, request, view):
        return bool(request.user and request.user.role == 'LAB_TECHNICIAN')


class LabTestTypeViewSet(viewsets.ModelViewSet):
    queryset = LabTestType.objects.all().order_by('-created_at')
    serializer_class = LabTestTypeSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsAdminUser()]
        return super().get_permissions()


class LabRequestViewSet(viewsets.ModelViewSet):
    queryset = (
        LabRequest.objects
        .select_related(
            'patient__user',
            'doctor__user',
            'appointment__patient__user',
            'appointment__doctor__user',
            'test',
        )
        .prefetch_related('reports')
        .order_by('-requested_at')
    )
    serializer_class = LabRequestSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role == 'PATIENT':
            return self.queryset.filter(patient__user=user)
        elif user.role == 'DOCTOR':
            return self.queryset.filter(doctor__user=user)
        return self.queryset

    def create(self, request, *args, **kwargs):
        if request.user.role not in ['DOCTOR', 'ADMIN']:
            return Response({'error': 'Only doctors or admin can request lab tests'}, status=status.HTTP_403_FORBIDDEN)
        
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        headers = self.get_success_headers(serializer.data)
        return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)

    @action(detail=True, methods=['patch'])
    def update_status(self, request, pk=None):
        if request.user.role != 'LAB_TECHNICIAN':
            return Response({'error': 'Only lab technicians can update status'}, status=status.HTTP_403_FORBIDDEN)
        
        lab_request = self.get_object()
        new_status = request.data.get('status')
        if new_status not in dict(LabRequest.STATUS_CHOICES):
            return Response({'error': 'Invalid status'}, status=status.HTTP_400_BAD_REQUEST)
        
        lab_request.status = new_status
        lab_request.save()
        return Response(LabRequestSerializer(lab_request).data)


class LabReportViewSet(viewsets.ModelViewSet):
    queryset = (
        LabReport.objects
        .select_related(
            'lab_request__patient__user',
            'lab_request__doctor__user',
            'lab_request__appointment__patient__user',
            'lab_request__appointment__doctor__user',
            'lab_request__test',
            'technician',
        )
        .prefetch_related('lab_request__reports')
        .order_by('-uploaded_at')
    )
    serializer_class = LabReportSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        queryset = self.queryset
        
        patient_id = self.request.query_params.get('patient_id')
        if patient_id:
            queryset = queryset.filter(lab_request__patient_id=patient_id)
            
        if user.role == 'PATIENT':
            return queryset.filter(lab_request__patient__user=user)
        elif user.role == 'DOCTOR':
            return queryset.filter(lab_request__doctor__user=user)
        return queryset

    def create(self, request, *args, **kwargs):
        if request.user.role not in ['LAB_TECHNICIAN', 'ADMIN']:
            return Response({'error': 'Only lab technicians or admin can upload reports'}, status=status.HTTP_403_FORBIDDEN)
        
        lab_request_id = request.data.get('lab_request')
        try:
            lab_request = LabRequest.objects.get(id=lab_request_id)
        except LabRequest.DoesNotExist:
            return Response({'error': 'Lab request not found'}, status=status.HTTP_404_NOT_FOUND)
        
        if LabReport.objects.filter(lab_request=lab_request).exists():
            return Response({'error': 'Report already exists for this request'}, status=status.HTTP_400_BAD_REQUEST)

        mutable_data = request.data.copy()
        
        # Auto-set charge from test price
        if lab_request.test and lab_request.test.price:
            mutable_data['charge'] = float(lab_request.test.price)
        
        serializer = self.get_serializer(data=mutable_data)
        serializer.is_valid(raise_exception=True)
        # Force set the technician
        self.perform_create(serializer, technician=request.user)
        
        # Update request status
        lab_request.status = 'COMPLETED'
        lab_request.save()
        
        # Update Billing
        if lab_request.appointment:
            try:
                billing = Billing.objects.get(appointment=lab_request.appointment)
                billing.lab_charge += lab_request.test.price
                billing.total_amount += lab_request.test.price
                
                # Recalculate based on discount %
                discount = (billing.total_amount * Decimal(billing.discount_percentage)) / 100
                billing.discount_amount = discount
                billing.final_amount = billing.total_amount - discount
                
                billing.save()
            except Billing.DoesNotExist:
                # Create a barebones billing if none exists implicitly
                doctor_fee = Decimal('0.00')
                if lab_request.doctor and lab_request.doctor.consultation_fee:
                    doctor_fee = lab_request.doctor.consultation_fee

                total = doctor_fee + lab_request.test.price
                hospital_charge = total * Decimal('0.10') # 10% hospital charge
                total = total + hospital_charge

                Billing.objects.create(
                    appointment=lab_request.appointment,
                    patient=lab_request.patient,
                    doctor_fee=doctor_fee,
                    hospital_charge=hospital_charge,
                    lab_charge=lab_request.test.price,
                    total_amount=total,
                    final_amount=total,
                    invoice_number=f"INV-{uuid.uuid4().hex[:6].upper()}"
                )
                
        headers = self.get_success_headers(serializer.data)
        return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)

    def perform_create(self, serializer, **kwargs):
        serializer.save(**kwargs)

    def update(self, request, *args, **kwargs):
        """Override update to ensure charge is always set from test price"""
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        
        mutable_data = request.data.copy() if hasattr(request.data, 'copy') else request.data
        
        # Auto-set charge from test price (never allow manual override)
        if instance.lab_request.test and instance.lab_request.test.price:
            mutable_data['charge'] = float(instance.lab_request.test.price)
        
        serializer = self.get_serializer(instance, data=mutable_data, partial=partial)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)
        
        return Response(serializer.data)

    def partial_update(self, request, *args, **kwargs):
        """Override partial_update to ensure charge is always set from test price"""
        kwargs['partial'] = True
        return self.update(request, *args, **kwargs)

