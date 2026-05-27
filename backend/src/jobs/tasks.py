import hashlib
import random
import time
from celery import shared_task, chain
from django.utils import timezone

from .models import Job, Company, ScrapingSource, SearchQueryCache
from .theprotocol_scraper import scrape_protocol_keywords, save_to_db as save_protocol_to_db

PRACA_PL_SEARCH_URL = "https://www.praca.pl/oferty-pracy.html?q={query}"
PRACA_PL_SEARCH_PAGES = [
    "https://www.praca.pl/oferty-pracy.html?q={query}",
    "https://www.praca.pl/oferty-pracy_2.html?q={query}",
    "https://www.praca.pl/oferty-pracy_3.html?q={query}",
]

@shared_task
def scrape_theprotocol_task(keywords):
    print(f"[THEPROTOCOL] Starting Celery task for keywords: {keywords}")
    jobs_data = scrape_protocol_keywords(keywords, remote_only=False)
    
    if jobs_data:
        saved_count = save_protocol_to_db(jobs_data)
        return f"[THEPROTOCOL] Saved {saved_count} new jobs out of {len(jobs_data)} scraped."
    
    return "[THEPROTOCOL] No jobs found or scraped."

@shared_task(bind=True, max_retries=3, default_retry_delay=60)
def scrape_keyword(self, keywords):
    """
    Scrapes praca.pl for a list of keywords.
    Can be called as:
      scrape_keyword.delay(['python', 'react'])   — list
      scrape_keyword.delay('python')              — single string
    """
    if isinstance(keywords, str):
        keywords = [keywords]

    from jobs.scraper import (
        get_job_urls, get_job_detail, is_it_job,
        _extract_work_mode, HEADERS
    )

    source, _ = ScrapingSource.objects.get_or_create(
        name='praca.pl',
        defaults={'base_url': 'https://www.praca.pl'}
    )

    for keyword in keywords:
        cache_entry, _ = SearchQueryCache.objects.get_or_create(
            query_text=keyword.lower()
        )
        cache_entry.status = 'pending'
        cache_entry.save(update_fields=['status', 'updated_at'])

        try:
            all_urls = []
            seen = set()

            for page_tpl in PRACA_PL_SEARCH_PAGES:
                page_url = page_tpl.format(query=keyword)
                job_links = get_job_urls(page_url)
                for href, raw_title in job_links:
                    if href not in seen and is_it_job(raw_title):
                        seen.add(href)
                        all_urls.append(href)
                time.sleep(random.uniform(2.0, 3.0))

            new_count = 0
            for url in all_urls:
                url_hash = hashlib.sha256(url.encode()).hexdigest()
                if Job.objects.filter(url_hash=url_hash).exists():
                    continue

                job_data = get_job_detail(url)
                if not job_data:
                    continue

                company, _ = Company.objects.get_or_create(
                    name=job_data['company'],
                    defaults={'logo_letter': job_data.get('logo', '?')}
                )

                Job.objects.create(
                    company=company,
                    source=source,
                    title=job_data['title'],
                    description=job_data.get('description', ''),
                    location=job_data.get('location', ''),
                    salary=job_data.get('salary', ''),
                    employment_type='full_time',
                    work_mode=_extract_work_mode(job_data.get('location', '')),
                    tags=job_data.get('tags', []),
                    original_url=url,
                    url_hash=url_hash,
                    experience_level=job_data.get('experience_level', 'any'),
                    experience_years_min=job_data.get('experience_years_min'),
                    experience_years_max=job_data.get('experience_years_max'),
                )
                new_count += 1
                time.sleep(random.uniform(0.8, 1.5))

            cache_entry.status = 'completed'
            cache_entry.save(update_fields=['status', 'updated_at'])

            source.last_scraped_at = timezone.now()
            source.save(update_fields=['last_scraped_at'])

        except Exception as exc:
            cache_entry.status = 'failed'
            cache_entry.save(update_fields=['status', 'updated_at'])
            raise self.retry(exc=exc)
        

@shared_task
def scrape_all_sources_sequential_task(keywords):
    print(f"[ORCHESTRATOR] Starting sequential scraping for: {keywords}")
    sequential_chain = chain(
        scrape_theprotocol_task.si(keywords),
        scrape_keyword.si(keywords)
    )
    
    sequential_chain.delay()
    
    return "[ORCHESTRATOR] Chain triggered successfully."