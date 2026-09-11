import logging
import time
import random
from concurrent.futures import ThreadPoolExecutor, as_completed
from .scraper_utils import get_robust_session, save_to_db
from jobs.models import SearchQueryCache

class BaseScraper:
    def __init__(self, source_name: str, base_url: str):
        self.source_name = source_name
        self.base_url = base_url
        self.session = get_robust_session()

    def get_job_urls(self, keyword: str) -> list:
        raise NotImplementedError

    def get_job_detail(self, url: str) -> dict | None:
        raise NotImplementedError

    def scrape(self, keywords: list, remote_only: bool = False) -> int:
        total_saved = 0
        for kw in keywords:
            total_saved += self.scrape_single_kw(kw, remote_only)
        return total_saved

    def scrape_single_kw(self, keyword: str, remote_only: bool = False) -> int:
        all_jobs = []
        seen_urls = set()
        logging.info(f"\n[{self.source_name}] Searching keyword: '{keyword}'")
        cache_entry, _ = SearchQueryCache.objects.get_or_create(query_text=keyword.lower())
        cache_entry.status = 'pending'
        cache_entry.save(update_fields=['status', 'updated_at'])

        try:
            job_links = self.get_job_urls(keyword)
            logging.info(f"[{self.source_name}] Found {len(job_links)} links")

            def fetch_job(href):
                time.sleep(random.uniform(0.5, 1.2))
                return self.get_job_detail(href)

            with ThreadPoolExecutor(max_workers=5) as executor:
                future_url = {
                    executor.submit(fetch_job, href): href
                    for href, _ in job_links if href not in seen_urls
                }
                for future in as_completed(future_url):
                    href = future_url[future]
                    seen_urls.add(href)
                    try:
                        job = future.result()
                        if job:
                            if remote_only and "Remote" not in job["location"] and "Hybrid" not in job["location"]:
                                continue
                            all_jobs.append(job)
                    except Exception as exc:
                        logging.error(f"Error fetching {href}: {exc}")
                        
            cache_entry.status = 'completed'
            cache_entry.save(update_fields=['status', 'updated_at'])
                        
        except Exception as exc:
            cache_entry.status = 'failed'
            cache_entry.save(update_fields=['status', 'updated_at'])
            logging.error(f"[{self.source_name}] Error scraping '{keyword}': {exc}")
        
        if all_jobs:
            saved_count = save_to_db(all_jobs, self.source_name, self.base_url)
            return saved_count
        return 0