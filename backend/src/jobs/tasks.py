import hashlib
import logging
import random
import time
from celery import shared_task, chain, group
from django.utils import timezone
from .scraper import PracaPlScraper
from .models import Job, Company, ScrapingSource, SearchQueryCache
from .theprotocol_scraper import TheProtocolScraper

@shared_task
def scrape_theprotocol_task(keywords):
    if isinstance(keywords, str):
        keywords = [keywords]
    logging.info(f"[THEPROTOCOL] Celery task for: {keywords}")
    
    saved_count = TheProtocolScraper().scrape(keywords, remote_only=False)
    return f"[THEPROTOCOL] Saved {saved_count} new jobs."

@shared_task(bind=True, max_retries=3, default_retry_delay=60)
def scrape_praca_pl(self, keywords):
    if isinstance(keywords, str):
        keywords = [keywords]
    logging.info(f"[Praca.pl] Celery task for: {keywords}")
    
    saved_count = PracaPlScraper().scrape(keywords, remote_only=False)
    return f"[Praca.pl] Saved {saved_count} new jobs."

@shared_task
def scrape_all_sources_parallel_task(keywords):
    job_group = group(
        scrape_theprotocol_task.s(keywords),
        scrape_praca_pl.s(keywords)
    )
    job_group.apply_async()
    return "[ORCHESTRATOR] Parallel group triggered successfully."