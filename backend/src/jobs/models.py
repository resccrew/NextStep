# jobs/models.py
import hashlib
from django.db import models

class Company(models.Model):
    name = models.CharField(max_length=255)
    domain = models.CharField(max_length=255, blank=True)
    logo_letter = models.CharField(max_length=1, blank=True)

    class Meta:
        unique_together = ('name',)

    def __str__(self):
        return self.name


class ScrapingSource(models.Model):
    name = models.CharField(max_length=100)
    base_url = models.URLField()
    is_active = models.BooleanField(default=True)
    last_scraped_at = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return self.name


class Job(models.Model):
    EXPERIENCE_LEVELS = [
        ('junior', 'Junior'),
        ('middle', 'Middle'),
        ('senior', 'Senior'),
        ('lead', 'Lead / Expert'),
        ('any', 'Any / Not specified'),
    ]

    EMPLOYMENT_TYPES = [
        ('full_time', 'Full-time'),
        ('part_time', 'Part-time'),
        ('contract', 'Contract'),
        ('internship', 'Internship'),
    ]

    company = models.ForeignKey(Company, on_delete=models.CASCADE, related_name='jobs')
    source = models.ForeignKey(ScrapingSource, on_delete=models.SET_NULL, null=True)

    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    location = models.CharField(max_length=255, blank=True)
    salary = models.CharField(max_length=100, blank=True)
    employment_type = models.CharField(max_length=20, choices=EMPLOYMENT_TYPES, blank=True)
    experience_level = models.CharField(
        max_length=20,
        choices=EXPERIENCE_LEVELS,
        default='any',
        db_index=True
    )
    experience_years_min = models.PositiveSmallIntegerField(null=True, blank=True)
    experience_years_max = models.PositiveSmallIntegerField(null=True, blank=True)
    work_mode = models.CharField(max_length=50, blank=True)  # remote/hybrid/office
    tags = models.JSONField(default=list)

    original_url = models.URLField(max_length=1000)
    url_hash = models.CharField(max_length=64, unique=True, db_index=True)

    is_active = models.BooleanField(default=True)
    scraped_at = models.DateTimeField(auto_now_add=True)
    published_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ['-scraped_at']

    def save(self, *args, **kwargs):
        # автоматично рахуємо хеш при збереженні
        if not self.url_hash:
            self.url_hash = hashlib.sha256(self.original_url.encode()).hexdigest()
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.title} @ {self.company.name}"
    

class SearchQueryCache(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('completed', 'Completed'),
        ('failed', 'Failed'),
    ]

    query_text = models.CharField(max_length=255, unique=True, db_index=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Search Query Cache'

    def __str__(self):
        return f"{self.query_text} [{self.status}]"

    def is_fresh(self, max_age_hours=12):
        from django.utils import timezone
        from datetime import timedelta
        return (timezone.now() - self.updated_at) < timedelta(hours=max_age_hours)