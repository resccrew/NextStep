def fallback_tag_match(user_profile: dict, job:dict) -> dict:
    user_skills = set(s.lower() for s in user_profile.get('skills', []))
    job_tags = set(t.lower() for t in job.get('tags', []))
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
    format_bonus = 10 if user_profile.get("work_format") == job.get("work_mode") else 0
    level_bonus = 10 if user_profile.get("level") == job.get("experience_level") else -5

    final_score = max(0, min(100, round(skill_score + format_bonus + level_bonus)))

    return {
        "match_percent": final_score,
        "matched_skills": list(matched_skills),
        "missing_skills": list(missing_skills),
        "reasoning": f"Matches for {len(matched_skills)} out of {len(job_tags)} technologies listed in the job posting",
    }