import json
from anthropic import APIError
from requests import RequestException
from jobs.llm.factory import get_llm_client
from jobs.services.tag_matcher import fallback_tag_match


MATCH_PROMPT = """You evaluate how well a candidate's profile matches the job opening.
Candidate Profile:
- Position: {role}
- Skills: {skills}
- Experience: {experience} years
- Work Format: {work_format}
- Expected Salary: {salary}

Job Opening:
- Title: {job_title}
- Company: {company}
- Description: {job_description}
- Format: {job_format}
- Salary: {job_salary}

Return ONLY the JSON without any surrounding text:
{{
  “match_percent”: <number 0-100>,
  “matched_skills”: [‘skill1’, “skill2”],
  “missing_skills”: [“skill3”],
  “reasoning”: “brief explanation, 1-2 sentences”
}}"""

def get_ai_match(user_profile, job) -> dict:
    def get_field(obj, field_name, default=None):
        if isinstance(obj, dict):
            val = obj.get(field_name)
        else:
            val = getattr(obj, field_name, None)
        return val if val is not None else default

    client = get_llm_client()
    
    user_skills = get_field(user_profile, "skills", [])
    user_formats = get_field(user_profile, "formats", [])
    
    prompt = MATCH_PROMPT.format(
        role = get_field(user_profile, "role", " "),
        skills = ", ".join(user_skills) if user_skills else "not specified",
        experience = get_field(user_profile, "experience", "not specified"),
        work_format = ", ".join(user_formats) if user_formats else "not specified",
        salary = get_field(user_profile, "salary", "not specified"),
        job_title = get_field(job, "title", " "),
        company = get_field(job, "company", "not specified"),
        job_description = get_field(job, "description", " "),
        job_format = get_field(job, "work_mode", "not specified"),
        job_salary = get_field(job, "salary", "not specified"),
    )

    try:
        raw = client.complete(prompt=prompt, max_tokens=150)
        print(f"[AI_MATCH] Raw response: {raw[:200]}")
        result = json.loads(raw)
        if "match_percent" in result and 0 <= result["match_percent"] <= 100:
            return result
    except (json.JSONDecodeError, RequestException, APIError) as e:
        print(f"[AI_MATCH] FAILED, falling back: {e}")
        pass

    return fallback_tag_match(user_profile=user_profile, job=job)