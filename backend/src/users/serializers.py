from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from users.models import SavedVacancy, User

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
    
class SavedVacancySerializer(serializers.ModelSerializer):
    class Meta:
        model = SavedVacancy
        fields = ['id', 'job', 'title', 'created_at']
        read_only_fields = ['id', 'created_at']

class OnboardingSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['role', 'experience', 'skills', 'formats', 'salary', 'onboarding_done']

class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    def validate(self, attrs):
        data = super().validate(attrs)

        saved_vacancies = SavedVacancySerializer(self.user.saved_vacancies.all(), many=True).data

        data['user'] = {
            'id': self.user.id,
            'username': self.user.username,
            'email': self.user.email,
            'onboarding_done': self.user.onboarding_done,
            'role': self.user.role,
            'experience': self.user.experience,
            'skills': self.user.skills,
            'formats': self.user.formats,
            'salary': self.user.salary,
            'saved_vacancies': saved_vacancies,
        }
        return data

class CVSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['cv_text']