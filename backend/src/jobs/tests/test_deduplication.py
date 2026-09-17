import pytest
from jobs.models import Job, Company
from jobs.tests.factories import JobFactory
from jobs.scraper_utils import save_to_db

pytestmark = pytest.mark.django_db

def test_same_url_not_duplicated():
    existing_url = "https://www.praca.pl/oferta_existing.html"
    existing_job = JobFactory(
        original_url = existing_url,
        company__name = "Tech Corp"
    )

    assert Job.objects.count() == 1

    new_url = "https://www.praca.pl/oferta_new.html"
    scraped_jobs_data = [
        {
            'title': 'Python Developer (Old)',
            'company': 'Tech Corp',
            'url': existing_url,
        },
        {
            'title': 'Django Developer (New)',
            'company': 'New Corp',
            'url': new_url,
        },
        {
            'title': 'Django Developer (Duplicate in batch)',
            'company': 'New Corp',
            'url': new_url,
        }
    ]

    saved_count = save_to_db(scraped_jobs_data, source_name="praca.pl", base_url="https://www.praca.pl")
    assert saved_count == 1

    assert Job.objects.filter(original_url=new_url).exists()

    job_in_db = Job.objects.get(original_url=existing_url)

    assert job_in_db.title == existing_job.title