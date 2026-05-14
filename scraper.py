import requests
from bs4 import BeautifulSoup
import json
import time
import random
import re
import os

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

def save_data_js(jobs, output_path):
    skill_groups = [
        {"name": "Development", "skills": ["React", "Vue", "TypeScript", "JavaScript", "Node.js", "Python", "Go", "Java", "PHP", "SQL", "GraphQL", "Next.js"]},
        {"name": "Design", "skills": ["Figma", "UI/UX", "Prototyping", "Illustration", "Motion", "Adobe XD"]},
        {"name": "Marketing", "skills": ["SEO", "Content", "Email campaigns", "Analytics", "Performance", "Brand"]},
        {"name": "Analytics", "skills": ["SQL", "Power BI", "Tableau", "Excel", "Python", "A/B tests"]},
        {"name": "Management", "skills": ["Agile", "Scrum", "Product", "Team management", "OKR"]},
    ]

    jobs_json = json.dumps(jobs, ensure_ascii=False, indent=2)
    sg_json = json.dumps(skill_groups, ensure_ascii=False, indent=2)

    content = f"""/* global window */
// Auto-generated by scraper.py — praca.pl IT jobs

const SKILL_GROUPS = {sg_json};

const JOBS = {jobs_json};

Object.assign(window, {{ SKILL_GROUPS, JOBS }});
"""
    with open(output_path, "w", encoding="utf-8") as f:
        f.write(content)
    print(f"\nSaved {len(jobs)} jobs → {output_path}")

if __name__ == "__main__":
    # Set remote_only=True to get only remote/hybrid jobs
    REMOTE_ONLY = False

    print("Starting praca.pl IT scraper...")
    print(f"Remote only: {REMOTE_ONLY}\n")

    jobs = scrape_all(remote_only=REMOTE_ONLY)

    if not jobs:
        print("No IT jobs found.")
    else:
        output = os.path.join(os.path.dirname(os.path.abspath(__file__)), "data.js")
        save_data_js(jobs, output)
        print(f"\nDone! {len(jobs)} IT jobs saved.")
