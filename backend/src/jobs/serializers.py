from rest_framework import serializers

from .services.tag_matcher import fallback_tag_match
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
            'employment_type', 'work_mode', 'experience_level', 'tags', 'description',
            'original_url', 'is_active', 'scraped_at', 'source_name',
        ]

    def to_representation(self, instance):
        data = super().to_representation(instance)
        
        request = self.context.get('request')
        
        profile = {}
        if request and hasattr(request, 'user') and request.user.is_authenticated:
            user_profile = request.user.profile
            profile = {
                'skills': getattr(user_profile, 'skills', []),
                'work_format': getattr(user_profile, 'work_format', ''),
                'level': getattr(user_profile, 'level', '')
            }

        match_info = fallback_tag_match(profile, data)
        
        data.update({
            "match_percent": match_info["match_percent"],
            "matched_skills": match_info["matched_skills"],
            "missing_skills": match_info["missing_skills"],
            "reasoning": match_info["reasoning"],
        })
        
        return data

class SearchQueryCacheSerializer(serializers.ModelSerializer):
    class Meta:
        model = SearchQueryCache
        fields = ['query_text', 'status', 'updated_at']