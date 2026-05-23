# jobs/urls.py
from django.urls import path
from .views import JobListView, JobDetailView, search_jobs, search_status

urlpatterns = [
    path('', JobListView.as_view(), name='job_list'),
    path('<int:pk>/', JobDetailView.as_view(), name='job_detail'),
    path('search/', search_jobs, name='job_search'),
    path('search/status/', search_status, name='job_search_status'),
]