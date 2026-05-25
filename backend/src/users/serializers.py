from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from users.models import SavedVacancy, User, UserProfile

class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)

    class Meta:
        model = User
        fields = ('username', 'email', 'password')

    def create(self, validated_data):
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data['email'],
            password=validated_data['password']
        )
        return user
    
class ChangePasswordSerializer(serializers.Serializer):
    old_password = serializers.CharField(required=True)
    new_password = serializers.CharField(required=True, min_length=8)

class SavedVacancySerializer(serializers.ModelSerializer):
    class Meta:
        model = SavedVacancy
        fields = ['id', 'job', 'title', 'created_at']
        read_only_fields = ['id', 'created_at']

class OnboardingSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserProfile
        fields = ['role', 'experience', 'skills', 'formats', 'salary']

class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    def validate(self, attrs):
        data = super().validate(attrs)
        user = self.user
        
        profile = getattr(user, 'profile', None)
        saved_vacancies = SavedVacancySerializer(user.saved_vacancies.all(), many=True).data

        data['user'] = {
            'id': user.id,
            'username': user.username,
            'email': user.email,
            'onboarding_done': user.onboarding_done,
            'role': profile.role if profile else None,
            'experience': profile.experience if profile else None,
            'skills': profile.skills if profile else [],
            'formats': profile.formats if profile else [],
            'salary': profile.salary if profile else None,
            'theme': profile.theme if profile else 'dark',
            'saved_vacancies': saved_vacancies,
        }
        return data

class CVSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserProfile
        fields = ['cv_text']

class SettingsSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserProfile
        fields = ['theme']