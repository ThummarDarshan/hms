from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import LabTestCatalogViewSet, LabRequestViewSet, LabReportViewSet, LabEquipmentViewSet

router = DefaultRouter()
router.register(r'tests', LabTestCatalogViewSet)
router.register(r'test-types', LabTestCatalogViewSet, basename='test-types')
router.register(r'requests', LabRequestViewSet)
router.register(r'reports', LabReportViewSet)
router.register(r'equipment', LabEquipmentViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
