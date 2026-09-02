import datetime
import hashlib
import logging
import re
from zoneinfo import ZoneInfo

from django.utils import timezone
import requests
from requests.adapters import HTTPAdapter
from urllib3 import Retry
from jobs.models import Job, Company, ScrapingSource, SearchQueryCache

IT_KEYWORDS = [
    "developer", "programista", "programistka",
    "frontend", "backend", "fullstack", "full-stack",
    "devops", "devsecops",
    "software engineer", "software developer",
    "inżynier oprogramowania",

    "python", "java", "javascript", "typescript",
    "react", "vue", "angular", "node.js",
    "php", "kotlin", "swift", "golang",
    ".net", "c#", "c++",
    "postgresql", "mongodb", "elasticsearch",
    "docker", "kubernetes", "terraform",
    "machine learning", "deep learning",

    "qa engineer", "qa tester", "quality assurance",
    "tester oprogramowania", "tester automatyzacji",
    "data engineer", "data scientist", "data analyst",
    "business intelligence", "bi developer",
    "cloud engineer", "cloud architect",
    "cybersecurity", "security engineer",
    "linux administrator", "system administrator",
    "android developer", "ios developer",
    "ux designer", "ui designer",
    "scrum master", "agile coach",
    "it specialist", "it analyst",
    "informatyk",
    "programowanie",
    "architect",
]

SKILL_TAGS = [
    "React", "Vue", "Angular", "TypeScript", "JavaScript", "Python",
    "Java", "Node.js", "PHP", "Go", "Kotlin", "Swift", "C#", "C++",
    "SQL", "PostgreSQL", "MongoDB", "Docker", "Kubernetes", "AWS",
    "Linux", "Git", "REST", "GraphQL", "Next.js", "Django", "Spring",
    "Figma", "UI/UX", "DevOps", "QA", "Testing", "Agile", "Scrum",
    "Machine Learning", "AI", "Data Science", "Android", "iOS",
]

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Accept-Language": "pl-PL,pl;q=0.9,en-US;q=0.8",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
}

MONTHS = {
    # Polish
    "sty": 1, "styczeń": 1, "stycznia": 1,
    "lut": 2, "luty": 2, "lutego": 2,
    "mar": 3, "marzec": 3, "marca": 3,
    "kwi": 4, "kwiecień": 4, "kwietnia": 4,
    "maj": 5, "maja": 5,
    "cze": 6, "czerwiec": 6, "czerwca": 6,
    "lip": 7, "lipiec": 7, "lipca": 7,
    "sie": 8, "sierpień": 8, "sierpnia": 8,
    "wrz": 9, "wrzesień": 9, "września": 9,
    "paź": 10, "październik": 10, "października": 10,
    "lis": 11, "listopad": 11, "listopada": 11,
    "gru": 12, "grudzień": 12, "grudnia": 12,
    # English
    "jan": 1, "january": 1,
    "feb": 2, "february": 2,
    "mar_en": 3, "march": 3,
    "apr": 4, "april": 4,
    "jun": 6, "june": 6,
    "jul": 7, "july": 7,
    "aug": 8, "august": 8,
    "sep": 9, "sept": 9, "september": 9,
    "oct": 10, "october": 10,
    "nov": 11, "november": 11,
    "dec": 12, "december": 12,
}

def get_robust_session():
    session = requests.Session()
    retry = Retry(
        total=3,
        backoff_factor=1, 
        status_forcelist=[429, 500, 502, 503, 504]
    )
    adapter = HTTPAdapter(max_retries=retry)
    session.mount('http://', adapter)
    session.mount('https://', adapter)
    session.headers.update(HEADERS)
    return session

def is_it_job(title):
    t = title.lower()
    return any(kw in t for kw in IT_KEYWORDS)

def extract_tags(text: str) -> list:
    found = []
    text_lower = text.lower()
    for tag in SKILL_TAGS:
        if tag.lower() in text_lower:
            found.append(tag)
    return found[:5] if found else ["IT"]


def extract_experience(text: str) -> dict:
    text_lower = text.lower()
    pattern = re.search(r'(\d+)\s*[-–]\s*(\d+)\s*(years?|років|lat)', text_lower)
    if pattern:
        return {'min': int(pattern.group(1)), 'max': int(pattern.group(2))}
    pattern_plus = re.search(r'(\d+)\+?\s*(years?|років|lat)', text_lower)
    if pattern_plus:
        return {'min': int(pattern_plus.group(1)), 'max': None}
    return {'min': None, 'max': None}


def infer_level(title: str, text: str, years_min: int | None) -> str:
    combined = (title + ' ' + text).lower()
    if any(w in combined for w in ['senior', 'sr.', 'lead', 'principal', 'staff', 'expert', 'architect']):
        return 'senior'
    if any(w in combined for w in ['junior', 'jr.', 'entry', 'graduate', 'intern', 'trainee']):
        return 'junior'
    if any(w in combined for w in ['mid', 'middle', 'regular', 'medior']):
        return 'middle'
    if years_min is not None:
        if years_min <= 1: return 'junior'
        if years_min <= 3: return 'middle'
        if years_min <= 6: return 'senior'
        return 'lead'
    return 'any'

def parse_scraped_date(raw: str, tz: str = "Europe/Warsaw"):
    if not raw:
        return None

    text = raw.strip().lower()
    match = re.match(r'(\d{1,2})\s+([a-ząćęłńóśźż]+)\.?\s+(\d{4})', text)
    if not match:
        return None

    day, month_word, year = match.groups()
    month = MONTHS.get(month_word)
    if not month:
        return None

    naive_dt = datetime(int(year), month, int(day))
    return naive_dt.replace(tzinfo=ZoneInfo(tz))

def _extract_work_mode(location_string: str) -> str:
    loc_lower = location_string.lower()
    if 'remote' in loc_lower:
        return 'remote'
    elif 'hybrid' in loc_lower:
        return 'hybrid'
    elif 'on-site' in loc_lower:
        return 'office'
    return ''

def save_to_db(jobs_data: list, source_name: str, base_url: str) -> int:
    source, _ = ScrapingSource.objects.get_or_create(
        name=source_name,
        defaults={'base_url': base_url}
    )

    hashes = {hashlib.sha256(d['url'].encode()).hexdigest(): d for d in jobs_data}
    existing_hashes = set(Job.objects.filter(url_hash__in=hashes.keys()).values_list('url_hash', flat=True))
    new_data = {h: d for h, d in hashes.items() if h not in existing_hashes}

    if not new_data:
        logging.info(f"[THEPROTOCOL] No new jobs to save.")
        return 0

    company_names = {d['company'] for d in new_data.values()}
    existing_companies = {c.name: c for c in Company.objects.filter(name__in=company_names)}
    for name in company_names - existing_companies.keys():
        logo = next(d.get('logo', '?') for d in new_data.values() if d['company'] == name)
        existing_companies[name] = Company.objects.create(name=name, logo_letter=logo)

    new_jobs = [
        Job(
            company=existing_companies[data['company']],
            source=source,
            title=data['title'],
            description=data.get('description', ''),
            location=data.get('location', ''),
            salary=data.get('salary', ''),
            employment_type='full_time',
            work_mode=_extract_work_mode(data.get('location', '')),
            tags=data.get('tags', []),
            original_url=data['url'],
            url_hash=url_hash,
            experience_level=data.get('experience_level', 'any'),
            experience_years_min=data.get('experience_years_min'),
            experience_years_max=data.get('experience_years_max'),
            published_at=data.get('posted'),
        )
        for url_hash, data in new_data.items()
    ]
    Job.objects.bulk_create(new_jobs)

    source.last_scraped_at = timezone.now()
    source.save()

    logging.info(f"Saved {len(new_jobs)} new jobs (skipped {len(existing_hashes)} duplicates)")
    return len(new_jobs)