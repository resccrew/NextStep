from django.contrib import admin
from .models import User, UserProfile,SavedVacancy, SearchPreference
from django.contrib.auth.admin import UserAdmin

# Register your models here.
admin.site.register(User, UserAdmin)
admin.site.register(UserProfile)
admin.site.register(SavedVacancy)
admin.site.register(SearchPreference)
