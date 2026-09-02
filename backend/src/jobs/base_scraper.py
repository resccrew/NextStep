import logging
import time
import random
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
        all_jobs = []
        seen_urls = set()

        for kw in keywords:
            logging.info(f"\n[{self.source_name}] Searching keyword: '{kw}'")
            cache_entry, _ = SearchQueryCache.objects.get_or_create(query_text=kw.lower())
            cache_entry.status = 'pending'
            cache_entry.save(update_fields=['status', 'updated_at'])

            try:
                job_links = self.get_job_urls(kw)
                logging.info(f"[{self.source_name}] Found {len(job_links)} links")

                for href, raw_title in job_links:
                    if href in seen_urls:
                        continue
                    seen_urls.add(href)

                    job = self.get_job_detail(href)
                    if not job:
                        continue

                    if remote_only and "Remote" not in job["location"] and "Hybrid" not in job["location"]:
                        continue

                    all_jobs.append(job)
                    time.sleep(random.uniform(0.8, 1.5))

                time.sleep(random.uniform(2.0, 3.0))
                
                cache_entry.status = 'completed'
                cache_entry.save(update_fields=['status', 'updated_at'])
                
            except Exception as exc:
                cache_entry.status = 'failed'
                cache_entry.save(update_fields=['status', 'updated_at'])
                logging.error(f"[{self.source_name}] Error scraping '{kw}': {exc}")

        if all_jobs:
            saved_count = save_to_db(all_jobs, self.source_name, self.base_url)
            return saved_count
        return 0