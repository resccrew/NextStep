from jobs.scraper import PracaPlScraper
from jobs.theprotocol_scraper import TheProtocolScraper
scraper_praca_pl = PracaPlScraper()
scraper_protocol = TheProtocolScraper()

test_urls_praca_pl = [
    "https://www.praca.pl/junior-front-end-developer_11437687.html#f1c62c943eaa99914b87dbf516f9caca",
    "https://www.praca.pl/mlodszy-specjalista-mlodsza-specjalistka-ds-pozyskiwania-klientow_11445445.html",
    "https://www.praca.pl/software-developer-backend-developer-php-z-jezykiem-niemieckim_11365240.html#043cd74b84f4b780f1156aef018cb3a5",
]

test_urls_protocol = [
    "https://theprotocol.it/szczegoly/praca/programista---programistka---full-stack-developer---java-angular-warszawa-swietokrzyska-36,oferta,01000000-7291-f825-ff43-08df09cbbf79",
    "https://theprotocol.it/szczegoly/praca/senior-full-stack-engineer-net-react-or-angular-gdansk,oferta,01000000-edb4-68d9-d47f-08defc2eee3f"
]

print("Praca pl:\n")
for url in test_urls_praca_pl:
    job = scraper_praca_pl.get_job_detail(url)
    print(f"\n{job['title']}")
    print(f"Tags: {job['tags']}")


print("Protocol:\n")
for url in test_urls_protocol:
    job = scraper_protocol.get_job_detail(url)
    print(f"\n{job['title']}")
    print(f"Tags: {job['tags']}")

