from django.contrib.auth import get_user_model
from django.contrib.auth.backends import ModelBackend

User = get_user_model()

class EmailOrUsernameModelBackend(ModelBackend):
    def authenticate(self, request, username=None, password=None, **kwargs):
        try:
            # Спочатку пробуємо знайти користувача за email
            user = User.objects.get(email=username)
        except User.DoesNotExist:
            # Якщо не вийшло, пробуємо знайти за username
            try:
                user = User.objects.get(username=username)
            except User.DoesNotExist:
                return None

        # Перевіряємо пароль
        if user.check_password(password) and self.user_can_authenticate(user):
            return user
        return None