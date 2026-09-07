from .tag_matcher import fallback_tag_match
from .ai_matcher import get_ai_match

def annotate_match_data(serialized_data, job_objects, request):
    profile = None
    if request.user.is_authenticated:
        profile = getattr(request.user, 'profile', None)
    if not profile:
        return serialized_data

    mode = request.query_params.get('mode', 'classic')
    for job_data, job_obj in zip(serialized_data, job_objects):
        match = get_ai_match(profile, job_obj) if mode == 'ai' else fallback_tag_match(profile, job_obj)
        job_data['match_percent'] = match['match_percent']
        job_data['matched_skills'] = match['matched_skills']
        job_data['reasoning'] = match.get('reasoning', '')

    return serialized_data