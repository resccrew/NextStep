# jobs/views.py
from rest_framework import generics
from rest_framework.permissions import AllowAny
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter
from .models import Job
from .serializers import JobSerializer

class JobListView(generics.ListAPIView):
    serializer_class = JobSerializer
    permission_classes = [AllowAny]
    filter_backends = [DjangoFilterBackend, SearchFilter]
    filterset_fields = ['work_mode', 'employment_type']
    search_fields = ['title', 'company__name', 'tags']

    def get_queryset(self):
        return Job.objects.filter(is_active=True).select_related('company', 'source')

class JobDetailView(generics.RetrieveAPIView):
    serializer_class = JobSerializer
    permission_classes = [AllowAny]
    queryset = Job.objects.filter(is_active=True).select_related('company')