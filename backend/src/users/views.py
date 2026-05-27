import os
from rest_framework import generics, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework.pagination import PageNumberPagination
from google.oauth2 import id_token
from google.auth.transport import requests as google_requests
from django.contrib.auth import get_user_model
from dotenv import load_dotenv

from users.models import SavedVacancy, SearchPreference, UserProfile
from .serializers import (
    OnboardingSerializer, RegisterSerializer, CustomTokenObtainPairSerializer,
    CVSerializer, SavedVacancySerializer, SearchPreferenceSerializer, SettingsSerializer, ChangePasswordSerializer
)

load_dotenv()
User = get_user_model()

class GoogleLoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        token = request.data.get('token')
        CLIENT_ID = os.getenv('CLIENT_ID')

        try:
            idinfo = id_token.verify_oauth2_token(token, google_requests.Request(), CLIENT_ID)
            email = idinfo['email']
            first_name = idinfo.get('given_name', '')
            last_name = idinfo.get('family_name', '')

            user = User.objects.filter(email=email).select_related('profile').first()

            if not user:
                base_username = email.split('@')[0]
                username = base_username
                counter = 1
                while User.objects.filter(username=username).exists():
                    username = f"{base_username}{counter}"
                    counter += 1
                    
                user = User(
                    username=username, 
                    email=email, 
                    first_name=first_name,
                    last_name=last_name
                )
                user.set_unusable_password()
                user.save()

            refresh = RefreshToken.for_user(user)
            profile = getattr(user, 'profile', None)
            saved_vacancies = SavedVacancySerializer(user.saved_vacancies.all(), many=True).data
            search_pref = getattr(user, 'search_preference', None)
            return Response({
                'refresh': str(refresh),
                'access': str(refresh.access_token),
                'user': {
                    'id': user.id,
                    'username': user.username,
                    'email': user.email,
                    'name': f"{user.first_name} {user.last_name}".strip() or user.username,
                    'onboarding_done': user.onboarding_done,
                    'role': profile.role if profile else None,
                    'experience': profile.experience if profile else None,
                    'skills': profile.skills if profile else [],
                    'formats': profile.formats if profile else [],
                    'salary': profile.salary if profile else None,
                    'saved_vacancies': saved_vacancies,
                    'search_preference': SearchPreferenceSerializer(search_pref).data if search_pref else None,
                }
            }, status=status.HTTP_200_OK)

        except ValueError:
            return Response({'error': 'Недійсний токен Google'}, status=status.HTTP_400_BAD_REQUEST)

class SavedVacancyPagination(PageNumberPagination):
    page_size = 10
    page_size_query_param = 'page_size'
    max_page_size = 100

class SavedVacancyListCreateView(generics.ListCreateAPIView):
    serializer_class = SavedVacancySerializer
    permission_classes = [IsAuthenticated]
    pagination_class = SavedVacancyPagination

    def get_queryset(self):
        return self.request.user.saved_vacancies.all()

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

class SearchPreferenceView(generics.RetrieveUpdateAPIView):
    serializer_class = SearchPreferenceSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        pref, _ = SearchPreference.objects.get_or_create(
            user=self.request.user
        )
        return pref

class SavedVacancyDestroyView(generics.DestroyAPIView):
    serializer_class = SavedVacancySerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return self.request.user.saved_vacancies.all()


class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    permission_classes = (AllowAny,)
    serializer_class = RegisterSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()

        refresh = RefreshToken.for_user(user)

        return Response({
            'refresh': str(refresh),
            'access': str(refresh.access_token),
            'user': {
                'id': user.id,
                'username': user.username,
                'email': user.email,
                'name': f"{user.first_name} {user.last_name}".strip() or user.username,
                'onboarding_done': user.onboarding_done,
            }
        }, status=status.HTTP_201_CREATED)

class ChangePasswordView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = ChangePasswordSerializer(data=request.data)
        if serializer.is_valid():
            user = request.user
            if not user.check_password(serializer.validated_data.get("old_password")):
                return Response(
                    {"old_password": ["The current password is incorrect."]}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            user.set_password(serializer.validated_data.get("new_password"))
            user.save()
            
            return Response({"message": "Password changed successfully."}, status=status.HTTP_200_OK)
            
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer


class SaveOnboardingView(generics.RetrieveUpdateAPIView):
    serializer_class = OnboardingSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        profile, created = UserProfile.objects.get_or_create(user=self.request.user)
        return profile

    def perform_update(self, serializer):
        serializer.save()
        user = self.request.user
        if not user.onboarding_done:
            user.onboarding_done = True
            user.save(update_fields=['onboarding_done'])


class ManageCVView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = CVSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        profile, created = UserProfile.objects.get_or_create(user=self.request.user)
        return profile

    def perform_destroy(self, instance):
        instance.cv_text = ""
        instance.save(update_fields=['cv_text'])

class SaveSettingsView(generics.UpdateAPIView):
    serializer_class = SettingsSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        profile, created = UserProfile.objects.get_or_create(user=self.request.user)
        return profile