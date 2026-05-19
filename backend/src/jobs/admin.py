from django.contrib import admin

from .models import Company, Job, ScrapingSource

# Register your models here.
admin.site.register(Company)
admin.site.register(ScrapingSource)
admin.site.register(Job)