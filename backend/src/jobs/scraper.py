import logging
import sys
from bs4 import BeautifulSoup
import time
import random
import re
import os
import django
import urllib.parse
from .scraper_utils import (HEADERS, IT_KEYWORDS, MONTHS, SKILL_TAGS, extract_experience, 
                            infer_level, extract_tags, parse_scraped_date, _extract_work_mode, save_to_db)
from .base_scraper import BaseScraper

CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))

DJANGO_PROJECT_DIR = os.path.dirname(CURRENT_DIR)

sys.path.append(DJANGO_PROJECT_DIR)

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'base.settings')

django.setup()

class PracaPlScraper(BaseScraper):
    def __init__(self):
        super().__init__(source_name="praca.pl", base_url="https://www.praca.pl")

    def get_job_urls(self, keyword: str) -> list:
        slug = urllib.parse.quote(keyword.strip().replace(" ", ","))
        query = urllib.parse.quote(keyword.strip())
        page_url = f"{self.base_url}/s-{slug}.html?p={query}"
        logging.info(f"Page url for {keyword}: {page_url}")
        try:
            resp = self.session.get(page_url, headers=HEADERS, timeout=15)
            resp.raise_for_status() 
        except Exception as e:
            logging.error(f"  Error fetching listing: {e}")
            return []

        soup = BeautifulSoup(resp.text, "html.parser")
        if soup.find("div", {"class": "al__no-offers-block gtm-empty-listing"}):
            return []
        job_pattern = re.compile(r'^https://www\.praca\.pl/[^,]+_\d+\.html')

        urls = []
        for link in soup.find_all("a", attrs={'class': 'listing__title'}):
            href = link.get("href", "")
            title = link.get_text(strip=True)
            if job_pattern.match(href) and href not in urls:
                urls.append((href, title))

        return urls

    def get_job_detail(self, url: str) -> dict | None:
        try:
            resp = self.session.get(url, headers=HEADERS, timeout=15)
            resp.raise_for_status()
        except Exception as e:
            logging.error(f"    Error: {e}")
            return None

        soup = BeautifulSoup(resp.text, "html.parser")

        # Title
        title_el = soup.select_one("h1.app-offer__title")
        title = title_el.get_text(strip=True) if title_el else ""
        if not title:
            return None

        # Company
        company_el = soup.select_one("span.app-offer__profile-link")
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

        # Posted (TODO: parse date)
        date_el = soup.select_one(".app-offer__date")
        posted_raw = date_el.get_text(strip=True) if date_el else ""

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
            "posted": parse_scraped_date(posted_raw),
            "match": random.randint(65, 97),
            "tags": tags,
            "why": "Matched from praca.pl IT listings",
            "featured": False,
            "description": f"View full job description on praca.pl.",
            "url": url,
        }

if __name__ == "__main__":
    logging.info("Starting praca.pl scraper...")
    scraper = PracaPlScraper()
    scraper.scrape(keywords=IT_KEYWORDS, remote_only=False)