import requests
import sys
from bs4 import BeautifulSoup
import json
import time
import random
import re
import os
import hashlib
import django
import os

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DJANGO_PROJECT_DIR = os.path.join(BASE_DIR, 'backend', 'src')
sys.path.append(DJANGO_PROJECT_DIR)

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'base.settings')

django.setup()

from jobs.models import Job, Company, ScrapingSource
from django.utils import timezone

BASE_URL = "https://www.praca.pl"

# IT keywords — only jobs with these in title will be kept
IT_KEYWORDS = [
    "developer", "programista", "programistka", "frontend", "backend",
    "fullstack", "devops", "python", "java", "javascript", "react", "vue",
    "angular", "php", "node", "kotlin", "swift", "android", "ios",
    "data", "qa", "tester", "analyst", "analityk", "it ", "software",
    "engineer", "inżynier", "architect", "chmura", "cloud", "sql",
    "machine learning", "ai ", "ux", "ui ", "product manager", "scrum",
    "cybersecurity", "network", "linux", "administrator", "systemu",
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
    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
                  "AppleWebKit/537.36 (KHTML, like Gecko) "
                  "Chrome/120.0.0.0 Safari/537.36",
    "Accept-Language": "pl-PL,pl;q=0.9,en-US;q=0.8",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
}

# Search pages — remote IT jobs
SEARCH_PAGES = [
    "https://www.praca.pl/oferty-pracy.html?q=developer+programista",
    "https://www.praca.pl/oferty-pracy_2.html?q=developer+programista",
    "https://www.praca.pl/oferty-pracy_3.html?q=developer+programista",
]

def is_it_job(title):
    t = title.lower()
    return any(kw in t for kw in IT_KEYWORDS)

def extract_tags(text):
    found = []
    text_lower = text.lower()
    for tag in SKILL_TAGS:
        if tag.lower() in text_lower:
            found.append(tag)
    return found[:5] if found else ["IT"]

def get_job_urls(page_url):
    """Get all job URLs from a listing page."""
    try:
        resp = requests.get(page_url, headers=HEADERS, timeout=15)
        resp.raise_for_status()
    except Exception as e:
        print(f"  Error fetching listing: {e}")
        return []

    soup = BeautifulSoup(resp.text, "html.parser")
    job_pattern = re.compile(r'^https://www\.praca\.pl/[^,]+_\d+\.html')

    urls = []
    for link in soup.find_all("a", href=True):
        href = link.get("href", "")
        title = link.get_text(strip=True)
        if job_pattern.match(href) and href not in urls:
            urls.append((href, title))

    return urls

def extract_experience(text: str) -> dict:
    text_lower = text.lower()
    
    # Шукаємо "2-4 years", "3+ years", "від 2 років" тощо
    pattern = re.search(r'(\d+)\s*[-–]\s*(\d+)\s*(years?|років|lat)', text_lower)
    if pattern:
        return {
            'min': int(pattern.group(1)),
            'max': int(pattern.group(2)),
        }
    
    pattern_plus = re.search(r'(\d+)\+?\s*(years?|років|lat)', text_lower)
    if pattern_plus:
        years = int(pattern_plus.group(1))
        return {'min': years, 'max': None}
    
    return {'min': None, 'max': None}


def infer_level(title: str, text: str, years_min: int | None) -> str:
    combined = (title + ' ' + text).lower()
    
    # Спочатку по явних ключових словах
    if any(w in combined for w in ['senior', 'sr.', 'lead', 'principal', 'staff']):
        return 'senior'
    if any(w in combined for w in ['junior', 'jr.', 'entry', 'graduate', 'intern']):
        return 'junior'
    if any(w in combined for w in ['mid', 'middle', 'regular', 'medior']):
        return 'middle'
    
    # Якщо є кількість років — визначаємо по ній
    if years_min is not None:
        if years_min <= 1:
            return 'junior'
        if years_min <= 3:
            return 'middle'
        if years_min <= 6:
            return 'senior'
        return 'lead'
    
    return 'any'

def get_job_detail(url):
    """Fetch individual job page and extract real data."""
    try:
        resp = requests.get(url, headers=HEADERS, timeout=15)
        resp.raise_for_status()
    except Exception as e:
        print(f"    Error: {e}")
        return None

    soup = BeautifulSoup(resp.text, "html.parser")

    # Title
    title_el = soup.select_one("h1.app-offer__title")
    title = title_el.get_text(strip=True) if title_el else ""
    if not title:
        return None

    # Company
    company_el = soup.select_one(".app-offer__profile-link")
    company = company_el.get_text(strip=True) if company_el else "Unknown"

    # Location
    location_el = soup.select_one(".app-offer__main-item--location span")
    location = location_el.get_text(strip=True) if location_el else "Poland"

    # Salary
    salary_el = soup.select_one(".app-offer__salary")
    if salary_el:
        salary = salary_el.get_text(strip=True)
        salary = re.sub(r'\s+', ' ', salary).strip()
    else:
        salary = "Negotiable"

    # Work mode (zdalna / stacjonarna / hybrydowa)
    mode_el = soup.select_one(".app-offer__header-item--home span")
    work_mode = mode_el.get_text(strip=True) if mode_el else ""

    # Employment type
    emp_el = soup.select_one(".app-offer__header-item--employment-type span")
    emp_type = emp_el.get_text(strip=True) if emp_el else "Full-time"

    # Working time
    time_el = soup.select_one(".app-offer__header-item--working-time span")
    work_time = time_el.get_text(strip=True) if time_el else "Full-time"

    # Posted
    date_el = soup.select_one(".app-offer__date")
    posted = date_el.get_text(strip=True) if date_el else "Recently"

    # Logo letter
    logo = company[0].upper() if company and company != "Unknown" else "P"

    full_text = soup.get_text(" ", strip=True)
    exp = extract_experience(full_text)
    level = infer_level(title, full_text, exp['min'])

    # Format work mode in English
    mode_map = {
        "praca zdalna": "Remote",
        "praca hybrydowa": "Hybrid",
        "praca stacjonarna": "On-site",
    }
    mode_en = mode_map.get(work_mode.lower(), work_mode)
    if mode_en:
        location_display = f"{location} · {mode_en}"
    else:
        location_display = location

    # Tags from full page text
    full_text = soup.get_text(" ", strip=True)
    tags = extract_tags(title + " " + full_text)

    return {
        "title": title,
        "company": company,
        "logo": logo,
        "location": location_display,
        "salary": salary,
        "type": work_time if work_time else "Full-time",
        'experience_level': level,
        'experience_years_min': exp['min'],
        'experience_years_max': exp['max'],
        "posted": posted,
        "match": random.randint(65, 97),
        "tags": tags,
        "why": "Matched from praca.pl IT listings",
        "featured": False,
        "description": f"View full job description on praca.pl.",
        "url": url,
    }

def scrape_all(remote_only=False):
    all_jobs = []
    seen_urls = set()

    for page_url in SEARCH_PAGES:
        print(f"\nListing: {page_url}")
        job_links = get_job_urls(page_url)
        print(f"  Found {len(job_links)} links on page")

        for href, raw_title in job_links:
            if href in seen_urls:
                continue

            # Quick IT filter by title before fetching page
            if not is_it_job(raw_title):
                continue

            seen_urls.add(href)
            print(f"  Fetching: {raw_title[:60]}")
            job = get_job_detail(href)

            if not job:
                continue

            # Remote-only filter
            if remote_only and "Remote" not in job["location"] and "Hybrid" not in job["location"]:
                print(f"    Skipped (not remote)")
                continue

            all_jobs.append(job)
            time.sleep(random.uniform(0.8, 1.5))

        time.sleep(random.uniform(2.0, 3.0))

    # Assign IDs, mark first as featured
    for i, j in enumerate(all_jobs):
        j["id"] = i + 1
        j["featured"] = (i == 0)

    return all_jobs

def _extract_work_mode(location_string: str) -> str:
    """Extracts the work mode from the formatted location string."""
    loc_lower = location_string.lower()
    
    if 'remote' in loc_lower:
        return 'remote'
    elif 'hybrid' in loc_lower:
        return 'hybrid'
    elif 'on-site' in loc_lower:
        return 'office'
        
    return ''

def save_to_db(jobs_data: list, source_name: str = "praca.pl"):
    source, _ = ScrapingSource.objects.get_or_create(
        name=source_name,
        defaults={'base_url': 'https://www.praca.pl'}
    )

    new_count = 0

    for data in jobs_data:
        url_hash = hashlib.sha256(data['url'].encode()).hexdigest()

        # Дедуплікація — пропускаємо якщо вже є
        if Job.objects.filter(url_hash=url_hash).exists():
            continue

        company, _ = Company.objects.get_or_create(
            name=data['company'],
            defaults={'logo_letter': data.get('logo', '?')}
        )

        Job.objects.create(
            company=company,
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
            experience_years_min=data.get('experience_years_min', None),
            experience_years_max=data.get('experience_years_max', None),
        )
        new_count += 1

    source.last_scraped_at = timezone.now()
    source.save()

    print(f"Saved {new_count} new jobs (skipped {len(jobs_data) - new_count} duplicates)")
    return new_count

if __name__ == "__main__":
    # Set remote_only=True to get only remote/hybrid jobs
    REMOTE_ONLY = False

    print("Starting praca.pl IT scraper...")
    print(f"Remote only: {REMOTE_ONLY}\n")

    jobs = scrape_all(remote_only=REMOTE_ONLY)

    if not jobs:
        print("No IT jobs found.")
    else:
        save_to_db(jobs)
        print(f"\nDone! {len(jobs)} IT jobs saved.")


