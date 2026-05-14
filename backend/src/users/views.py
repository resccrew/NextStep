import os
from rest_framework import generics
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from google.oauth2 import id_token
from google.auth.transport import requests as google_requests
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny
from django.contrib.auth import get_user_model
from rest_framework_simplejwt.tokens import RefreshToken
from dotenv import load_dotenv
from users.models import User
from .serializers import OnboardingSerializer, RegisterSerializer, CustomTokenObtainPairSerializer ,CVSerializer, SavedVacancySerializer

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

            user = User.objects.filter(email=email).first()

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

            saved_vacancies = SavedVacancySerializer(user.saved_vacancies.all(), many=True).data

            return Response({
                'refresh': str(refresh),
                'access': str(refresh.access_token),
                'user': {
                    'id': user.id,
                    'username': user.username,
                    'email': user.email,
                    'onboarding_done': user.onboarding_done,
                    'role': user.role,
                    'experience': user.experience,
                    'skills': user.skills,
                    'formats': user.formats,
                    'salary': user.salary,
                    'saved_vacancies': saved_vacancies,
                }
            }, status=status.HTTP_200_OK)

        except ValueError:
            return Response({'error': 'Недійсний токен Google'}, status=status.HTTP_400_BAD_REQUEST)
        
class SavedVacancyListCreateView(generics.ListCreateAPIView):
    serializer_class = SavedVacancySerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return self.request.user.saved_vacancies.all()

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

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
                'onboarding_done': user.onboarding_done,
            }
        }, status=status.HTTP_201_CREATED)

class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer

class SaveOnboardingView(generics.UpdateAPIView):
    serializer_class = OnboardingSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        return self.request.user

class ManageCVView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = CVSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        return self.request.user

    def perform_destroy(self, instance):
        instance.cv_text = ""
        instance.save()