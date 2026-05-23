# jobs/serializers.py
from rest_framework import serializers
from .models import Job, Company, SearchQueryCache

class CompanySerializer(serializers.ModelSerializer):
    class Meta:
        model = Company
        fields = ['id', 'name', 'logo_letter']

class JobSerializer(serializers.ModelSerializer):
    company = CompanySerializer(read_only=True)
    source_name = serializers.CharField(source='source.name', read_only=True)

    class Meta:
        model = Job
        fields = [
            'id', 'title', 'company', 'location', 'salary',
            'employment_type', 'work_mode', 'tags',
            'original_url', 'is_active', 'scraped_at', 'source_name',
        ]

class SearchQueryCacheSerializer(serializers.ModelSerializer):
    class Meta:
        model = SearchQueryCache
        fields = ['query_text', 'status', 'updated_at']