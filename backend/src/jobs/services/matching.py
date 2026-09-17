from concurrent.futures import ThreadPoolExecutor, as_completed
from .tag_matcher import fallback_tag_match
from .ai_matcher import get_ai_match

def annotate_match_data(serialized_data, job_objects, request):
    profile = None
    if request.user.is_authenticated:
        profile = getattr(request.user, 'profile', None)
    if not profile:
        return serialized_data

    mode = request.query_params.get('mode', 'classic')

    pairs = list(zip(serialized_data, job_objects))
    for job_data, job_obj in pairs:
        tag_match = fallback_tag_match(profile, job_obj)
        job_data['match_percent'] = tag_match['match_percent']
        job_data['matched_skills'] = tag_match['matched_skills']
        job_data['reasoning'] = tag_match.get('reasoning', '')

    if mode != 'ai':
        return serialized_data
    
    pairs.sort(key=lambda p: p[0]['match_percent'], reverse=True)

    def process_ai_match(job_data, job_obj):
        match = get_ai_match(profile, job_obj)
        # job_data['match_percent'] = match['match_percent']
        # job_data['matched_skills'] = match['matched_skills']
        job_data['reasoning'] = match.get('reasoning', '')

    with ThreadPoolExecutor(max_workers=5) as executor:
        futures = [
            executor.submit(process_ai_match, job_data, job_obj)
            for job_data, job_obj in pairs
        ]

        for future in as_completed(futures):
            pass

    serialized_data.sort(key=lambda x: x['match_percent'], reverse=True)

    return serialized_data