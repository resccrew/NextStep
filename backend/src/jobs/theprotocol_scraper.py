import logging
import sys
from bs4 import BeautifulSoup
import random
import re
import os
import hashlib
import django
import time
import urllib.parse
from .scraper_utils import (HEADERS, IT_KEYWORDS, SKILL_TAGS, extract_experience, 
                            infer_level, extract_tags, parse_scraped_date, _extract_work_mode, save_to_db)
from .base_scraper import BaseScraper

CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))

DJANGO_PROJECT_DIR = os.path.dirname(CURRENT_DIR)

sys.path.append(DJANGO_PROJECT_DIR)

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'base.settings')
django.setup()

class TheProtocolScraper(BaseScraper):
    def __init__(self):
        super().__init__(source_name="theprotocol.it", base_url="https://theprotocol.it")

    def get_job_urls(self, keyword):
        clean_keyword = keyword.replace("/", "-").replace(" ", "+")
        encoded_kw = urllib.parse.quote(clean_keyword)
        page_url = f"{self.base_url}/praca?kw={encoded_kw}"
        logging.info(f"Page url for {keyword}: {page_url}")
        try:
            resp = self.session.get(page_url, headers=HEADERS, timeout=20)
            resp.raise_for_status()
        except Exception as e:
            logging.error(f"  Error fetching listing for '{keyword}': {e}")
            return []

        soup = BeautifulSoup(resp.text, "html.parser")
        if soup.find("div", attrs={"class": "r4179ok bldcnq5 ihmj1ec h1cht0ge"}):
            return []
        urls = []

        for link in soup.find_all("a", href=True):
            href = link.get("href", "")
            if '/szczegoly/praca/' in href:
                if href.startswith('/'):
                    href = self.base_url + href
                href = href.split('?')[0]
                if href not in [u[0] for u in urls]:
                    urls.append((href, ""))

        return urls

    def get_job_detail(self, url):
        try:
            resp = self.session.get(url, headers=HEADERS, timeout=15)
            resp.raise_for_status()
        except Exception as e:
            logging.error(f"    Error fetching detail: {e}")
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
        company_el = soup.find('a', attrs={"data-test": "anchor-company-link"})
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

        #Location display
        location_display = f"Poland · {work_mode}"
        location_el = soup.find('span', attrs={'data-test': 'text-primaryLocation'})
        if location_el:
            location_text = location_el.get_text(strip=True)
            if location_text:
                location_display = f"Poland · {location_text} · {work_mode}"

        #Salary
        salary_el = soup.find('span', attrs={'data-test': 'text-salary-value'})
        if salary_el:
            salary = salary_el.get_text(strip=True)
            if salary == "brak widełek":
                salary = "Negotiable"
        else:
            salary = "Negotiable"

        #Posted date
        posted_el = soup.find('span', attrs={'data-test': 'text-fromDate'})
        posted_date = parse_scraped_date(posted_el.get_text(strip=True)) if posted_el else None

        logo = company[0].upper() if company and company != "Unknown" else "T"
        exp = extract_experience(full_text)
        level = infer_level(title, full_text, exp['min'])
        tags = extract_tags(title + " " + full_text)

        return {
            "title": title,
            "company": company,
            "logo": logo,
            "location": location_display,
            "salary": salary,
            "type": "Full-time",
            "experience_level": level,
            "experience_years_min": exp['min'],
            "experience_years_max": exp['max'],
            "posted": posted_date,
            "match": random.randint(65, 97),
            "tags": tags,
            "why": "Matched from theprotocol.it IT listings",
            "featured": False,
            "description": "View full job description on theprotocol.it.",
            "url": url,
        }

if __name__ == "__main__":
    logging.info("Starting theprotocol.it scraper...")
    scraper = TheProtocolScraper()
    scraper.scrape(IT_KEYWORDS, remote_only=False)