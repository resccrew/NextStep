import pytest
from unittest.mock import patch, MagicMock
from jobs.tasks import (
    scrape_theprotocol_task,
    scrape_theprotocol_task_single,
    scrape_praca_pl,
    scrape_all_sources_parallel_task
)

class TestScrapingTasks:
    @patch('jobs.tasks.TheProtocolScraper')
    def test_scrape_theprotocol_task_with_list(self, mock_scraper_class):
        mock_instance = mock_scraper_class.return_value
        mock_instance.scrape.return_value = 5

        result = scrape_theprotocol_task(["Python", "Django"])

        mock_instance.scrape.assert_called_once_with(["Python", "Django"], remote_only = False)

        assert result == "[THEPROTOCOL] Saved 5 new jobs."

    @patch('jobs.tasks.PracaPlScraper')
    def test_scrape_praca_pl_task_with_string(self, mock_scraper_class):
        mock_instance = mock_scraper_class.return_value
        mock_instance.scrape.return_value = 12

        result = scrape_praca_pl(keywords = "Python")

        mock_instance.scrape.assert_called_once_with(["Python"], remote_only = False)
        assert result == "[Praca.pl] Saved 12 new jobs."

    @patch('jobs.tasks.TheProtocolScraper')
    def test_scrape_theprotocol_task_single(self, mock_scraper_class):
        mock_instance = mock_scraper_class.return_value
        mock_instance.scrape_single_kw.return_value = 3

        result = scrape_theprotocol_task_single("Java")

        mock_instance.scrape_single_kw.assert_called_once_with("Java", remote_only=False)

        assert result == "[THEPROTOCOL] Saved 3 new jobs."

    @patch('jobs.tasks.group')
    def test_scrape_all_sources_parallel_task(self, mock_group):
        mock_group_instance = MagicMock()
        mock_group.return_value = mock_group_instance

        keywords = ["Python", "JavaScript"]
        result = scrape_all_sources_parallel_task(keywords)

        mock_group.assert_called_once()

        mock_group_instance.apply_async.assert_called_once()

        assert result == "[ORCHESTRATOR] 4 tasks dispatched in parallel (2 keywords x 2 sources)."

        tasks_passed_to_group = mock_group.call_args[0][0]
        assert len(tasks_passed_to_group) == 4