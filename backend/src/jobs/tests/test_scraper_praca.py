from pathlib import Path
from bs4 import BeautifulSoup
from jobs.scraper import PracaPlScraper
from jobs.scraper_utils import infer_level
from jobs.scraper_utils import extract_tags

FIXTURES = Path(__file__).parent / "fixtures"

def test_parse_job_page_extracts_title_and_company():
    html = (FIXTURES / "praca_sample.html").read_text(encoding="utf-8")
    soup = BeautifulSoup(html, "html.parser")
    result = PracaPlScraper().parse_job_detail(soup)

    assert result["title"] == "Junior Front-End Developer"
    assert result["company"] == "Klient portalu Praca.pl"
    assert result["work_mode"] == "On-site"

def test_parse_job_page_handless_missing_salary():
    html = (FIXTURES / "praca_sample.html").read_text(encoding="utf-8")
    soup = BeautifulSoup(html, "html.parser")
    result = PracaPlScraper().parse_job_detail(soup)
    assert result["salary"] is "Negotiable"

def test_level_detection_from_years_of_experience():
    assert infer_level(title = "Middle Frontend Developer", text = "wymagane min. 3 lata doświadczenia", years_min = None) == "middle"
    assert infer_level(title = "Senior Backend Developer", text = "senior specialist", years_min = None) == "senior"

def test_tag_extraction_finds_known_technologies():
    text = "Wymagamy znajomości Python, Docker oraz AWS."
    tags = extract_tags(text)
    assert set(tags) == {"Python", "Docker", "AWS"}