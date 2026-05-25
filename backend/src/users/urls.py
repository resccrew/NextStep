from django.urls import path
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from .views import ChangePasswordView, CustomTokenObtainPairView, ManageCVView, RegisterView, GoogleLoginView, SaveOnboardingView, SaveSettingsView, SavedVacancyDestroyView, SavedVacancyListCreateView

urlpatterns = [
    path('register/', RegisterView.as_view(), name='register'),
    path('login/', CustomTokenObtainPairView.as_view(), name='login'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('change-password/', ChangePasswordView.as_view(), name='change_password'),
    path('my-cv/', ManageCVView.as_view(), name='manage_cv'),
    path('google/', GoogleLoginView.as_view(), name='google_login'),
    path('onboarding/', SaveOnboardingView.as_view(), name='save_onboarding'),
    path('saved-vacancies/', SavedVacancyListCreateView.as_view(), name='saved_vacancies_list_create'),
    path('saved-vacancies/<int:pk>/', SavedVacancyDestroyView.as_view(), name='saved_vacancy_delete'),
    path('settings/', SaveSettingsView.as_view(), name='save_settings'),
]