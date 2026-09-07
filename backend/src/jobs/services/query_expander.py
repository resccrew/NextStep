import json
from jobs.llm.factory import get_llm_client

EXPAND_PROMPT = """The user is looking for a job with the position “{role}” and the skills {skills}.
Generate 3–5 alternative search QUERIES, 1–2 WORDS EACH
(as keywords for searching on a job portal, NOT full phrases with locations or prepositions).

Examples of the correct format: “data analyst”, “business analyst”, “BI specialist”
Examples of the INCORRECT format: “Data Analyst Poland”, “IT Analyst Job Krakow”

Return ONLY JSON: {{“queries”: [‘query1’, “query2”, ...]}}

Translated with DeepL.com (free version)"""

def expand_search_query(role: str, skills: list[str]) -> list[str]:
    client = get_llm_client()
    try:
        raw = client.complete(EXPAND_PROMPT.format(role=role, skills=", ".join(skills)), max_tokens=150)
        queries = json.loads(raw)["queries"]
        valid_queries = [q for q in queries if len(q.split()) <= 2]
        return valid_queries[:4] if valid_queries else [role]
    except (json.JSONDecodeError, Exception):
        return[role]