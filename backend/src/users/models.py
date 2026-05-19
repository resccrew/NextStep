from django.contrib.auth.models import AbstractUser
from django.db import models
from jobs.models import Job

class User(AbstractUser):
    EXPERIENCE_CHOICES = [
        ('junior', 'Junior'),
        ('middle', 'Middle'),
        ('senior', 'Senior'),
        ('lead', 'Lead / Expert'),
    ]

    email = models.EmailField(unique=True)
    cv_text = models.TextField(blank=True, null=True)
    role = models.CharField(max_length=255, blank=True, null=True)
    experience = models.CharField(max_length=20, choices=EXPERIENCE_CHOICES, blank=True, null=True)
    skills = models.JSONField(default=list, blank=True)
    formats = models.JSONField(default=list, blank=True)
    salary = models.IntegerField(null=True, blank=True)
    onboarding_done = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.username
    

# users/models.py — замінити SavedVacancy
class SavedVacancy(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='saved_vacancies')
    job = models.ForeignKey(Job, on_delete=models.CASCADE, null=True, blank=True)
    title = models.CharField(max_length=255, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('user', 'job')
        ordering = ['-created_at']