from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import LabTestTypeViewSet, LabRequestViewSet, LabReportViewSet

router = DefaultRouter()
router.register(r'test-types', LabTestTypeViewSet, basename='test-types')
router.register(r'requests', LabRequestViewSet, basename='requests')
router.register(r'reports', LabReportViewSet, basename='reports')

urlpatterns = [
    path('', include(router.urls)),
]
