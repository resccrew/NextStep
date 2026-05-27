import requests
import sys
from bs4 import BeautifulSoup
import random
import re
import os
import hashlib
import django
import time
import urllib.parse

CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))

DJANGO_PROJECT_DIR = os.path.dirname(CURRENT_DIR)

sys.path.append(DJANGO_PROJECT_DIR)

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'base.settings')
django.setup()

from jobs.models import Job, Company, ScrapingSource
from django.utils import timezone

BASE_URL = "https://theprotocol.it"

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


def is_it_job(title: str) -> bool:
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
    if any(w in combined for w in ['senior', 'sr.', 'lead', 'principal', 'staff']):
        return 'senior'
    if any(w in combined for w in ['junior', 'jr.', 'entry', 'graduate', 'intern']):
        return 'junior'
    if any(w in combined for w in ['mid', 'middle', 'regular', 'medior']):
        return 'middle'
    if years_min is not None:
        if years_min <= 1: return 'junior'
        if years_min <= 3: return 'middle'
        if years_min <= 6: return 'senior'
        return 'lead'
    return 'any'


def get_job_urls(keyword: str) -> list:
    clean_keyword = keyword.replace("/", " ").replace("-", " ")
    encoded_kw = urllib.parse.quote(clean_keyword)
    page_url = f"{BASE_URL}/filtry/{encoded_kw};kw"

    try:
        resp = requests.get(page_url, headers=HEADERS, timeout=20)
        resp.raise_for_status()
    except Exception as e:
        print(f"  Error fetching listing for '{keyword}': {e}")
        return []

    soup = BeautifulSoup(resp.text, "html.parser")
    urls = []

    for link in soup.find_all("a", href=True):
        href = link.get("href", "")
        if '/szczegoly/praca/' in href:
            if href.startswith('/'):
                href = BASE_URL + href
            href = href.split('?')[0]
            if href not in [u[0] for u in urls]:
                urls.append((href, ""))

    return urls


def get_job_detail(url: str) -> dict | None:
    try:
        resp = requests.get(url, headers=HEADERS, timeout=15)
        resp.raise_for_status()
    except Exception as e:
        print(f"    Error fetching detail: {e}")
        return None

    soup = BeautifulSoup(resp.text, "html.parser")
    full_text = soup.get_text(" ", strip=True)

    # Title
    title_el = soup.select_one("h1")
    title = title_el.get_text(strip=True) if title_el else ""
    if not title:
        return None

    # Company
    company = "Unknown"
    company_el = soup.find('a', href=re.compile(r'/szukaj/pracodawca/'))
    if company_el:
        company = company_el.get_text(strip=True)

    # Work mode
    text_lower = full_text.lower()
    if "praca zdalna" in text_lower or "100% remote" in text_lower or "remote" in text_lower:
        work_mode = "Remote"
    elif "hybryd" in text_lower or "hybrid" in text_lower:
        work_mode = "Hybrid"
    else:
        work_mode = "On-site"

    location_display = f"Poland · {work_mode}"
    logo = company[0].upper() if company and company != "Unknown" else "T"
    exp = extract_experience(full_text)
    level = infer_level(title, full_text, exp['min'])
    tags = extract_tags(title + " " + full_text)

    return {
        "title": title,
        "company": company,
        "logo": logo,
        "location": location_display,
        "salary": "Negotiable",
        "type": "Full-time",
        "experience_level": level,
        "experience_years_min": exp['min'],
        "experience_years_max": exp['max'],
        "posted": "Recently",
        "match": random.randint(65, 97),
        "tags": tags,
        "why": "Matched from theprotocol.it IT listings",
        "featured": False,
        "description": "View full job description on theprotocol.it.",
        "url": url,
    }


def scrape_protocol_keywords(keywords: list, remote_only: bool = False) -> list:
    all_jobs = []
    seen_urls = set()

    for kw in keywords:
        print(f"\nSearching keyword: '{kw}' on theprotocol.it")
        job_links = get_job_urls(kw)
        print(f"  Found {len(job_links)} links")

        for href, _ in job_links:
            if href in seen_urls:
                continue
            seen_urls.add(href)

            job = get_job_detail(href)
            if not job:
                continue

            if not is_it_job(job["title"]):
                print(f"    Skipped (not IT): {job['title']}")
                continue

            if remote_only and "Remote" not in job["location"] and "Hybrid" not in job["location"]:
                print(f"    Skipped (not remote): {job['title']}")
                continue

            print(f"  ✓ {job['title'][:70]}")
            all_jobs.append(job)
            time.sleep(random.uniform(0.8, 1.5))

        time.sleep(random.uniform(2.0, 3.0))

    for i, j in enumerate(all_jobs):
        j["id"] = i + 1
        j["featured"] = (i == 0)

    return all_jobs


def _extract_work_mode(location_string: str) -> str:
    loc_lower = location_string.lower()
    if 'remote' in loc_lower:
        return 'remote'
    elif 'hybrid' in loc_lower:
        return 'hybrid'
    elif 'on-site' in loc_lower:
        return 'office'
    return ''


def save_to_db(jobs_data: list, source_name: str = "theprotocol.it") -> int:
    source, _ = ScrapingSource.objects.get_or_create(
        name=source_name,
        defaults={'base_url': BASE_URL}
    )

    new_count = 0
    skipped_count = 0

    for data in jobs_data:
        url_hash = hashlib.sha256(data['url'].encode()).hexdigest()

        if Job.objects.filter(url_hash=url_hash).exists():
            skipped_count += 1
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

    print(f"Saved {new_count} new jobs (skipped {skipped_count} duplicates)")
    return new_count


if __name__ == "__main__":
    REMOTE_ONLY = False
    print("Starting theprotocol.it scraper...")
    jobs = scrape_protocol_keywords(['python', 'react'], remote_only=REMOTE_ONLY)
    if jobs:
        save_to_db(jobs)
        print(f"\nDone! {len(jobs)} IT jobs scraped.")
    else:
        print("\nNo jobs found.")