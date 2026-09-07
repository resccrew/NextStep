def fallback_tag_match(user_profile, job) -> dict:
    def get_field(obj, field_name):
        return obj.get(field_name) if isinstance(obj, dict) else getattr(obj, field_name, None)

    user_skills_raw = get_field(user_profile, 'skills') or []
    job_tags_raw = get_field(job, 'tags') or []

    user_skills = {s.lower().strip() for s in user_skills_raw}
    job_tags = {t.lower().strip() for t in job_tags_raw}

    if not user_skills or not job_tags:
        return {
            'match_percent': 0,
            'matched_skills': [],
            'missing_skills': list(job_tags),
            'reasoning': 'There is insufficient data to determine compliance',
        }

    matched_skills = user_skills & job_tags
    missing_skills = job_tags - user_skills
    skill_score = len(matched_skills) / len(job_tags) * 100

    user_formats_raw = get_field(user_profile, 'formats') or []
    user_formats = {f.lower() for f in user_formats_raw}
    
    job_work_mode = get_field(job, 'work_mode')
    format_bonus = 10 if job_work_mode and job_work_mode.lower() in user_formats else 0

    level_bonus = 0
    user_experience = get_field(user_profile, 'experience')
    job_experience_level = get_field(job, 'experience_level')
    
    if user_experience and job_experience_level not in ('', 'any', None):
        level_bonus = 10 if user_experience == job_experience_level else -5

    final_score = max(0, min(100, round(skill_score + format_bonus + level_bonus)))

    return {
        "match_percent": final_score,
        "matched_skills": sorted(matched_skills),
        "missing_skills": sorted(missing_skills),
        "reasoning": f"Matches for {len(matched_skills)} out of {len(job_tags)} technologies listed in the job posting",
    }