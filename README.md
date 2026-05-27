# NextStep

Aplikacja webowa do wyszukiwania ofert pracy IT z personalizowanymi rekomendacjami. System automatycznie scrapuje polskie portale z ofertami pracy, dopasowuje oferty do profilu użytkownika i wyświetla najbardziej pasujące propozycje.

---

## Uruchomienie projektu

### Wymagania

- [Docker Desktop](https://www.docker.com/products/docker-desktop/)

### Krok 1 — Uruchom Docker Desktop

Upewnij się, że Docker Desktop jest uruchomiony (ikona wieloryba na pasku menu).

### Krok 2 — Uruchom kontenery

```bash
docker-compose up --build
```

Poczekaj, aż wszystkie serwisy się uruchomią — zobaczysz logi od `db`, `redis`, `api`, `celery`, `frontend`.

### Krok 3 — Wykonaj migracje

W **nowym terminalu**, gdy kontenery działają:

```bash
docker-compose exec api python manage.py migrate
```

### Gotowe

| Serwis | Adres |
|--------|-------|
| Frontend (strona) | http://localhost:5500 |
| Backend API | http://localhost:8000 |
| Baza danych | localhost:5432 |
| Redis | localhost:6380 |

> Migracje należy wykonać tylko raz (lub po pojawieniu się nowych). Przy kolejnych uruchomieniach wystarczy `docker-compose up`.

---

## Opis projektu

### Czym jest NextStep

NextStep to SPA z Django REST API po stronie backendu. Użytkownik rejestruje się, wypełnia profil (rola, umiejętności, doświadczenie, format pracy, oczekiwane wynagrodzenie), a następnie system wyszukuje pasujące oferty pracy na polskich portalach IT i wyświetla je z procentem dopasowania.

---

### Dlaczego React

React został wybrany do budowy SPA — użytkownik widzi jedną stronę, która dynamicznie się aktualizuje bez przeładowania.

- Interfejs składa się z wielu stanów: wyszukiwanie z filtrami, lista ofert, otwarta karta, zapisane, profil — React przez `useState`/`useEffect` zarządza tym wszystkim bez zbędnej złożoności
- Komponenty są wielokrotnie używane: `JobCard`, `MatchMeter`, `Chip`, `Toast` napisane raz i wykorzystywane na różnych stronach
- Asynchroniczna praca z API — wyszukiwanie wysyła zapytanie, React pokazuje loader, następnie podmienia wyniki bez przeładowania strony

React podłączony przez CDN bez bundlera (Webpack/Vite). JSX transpilowany bezpośrednio w przeglądarce przez Babel Standalone.

**Strony aplikacji:**

| Strona | Opis |
|--------|------|
| LoginPage | Logowanie / rejestracja przez email lub Google OAuth |
| OnboardingPage | Wypełnienie profilu: rola, umiejętności, doświadczenie, format, wynagrodzenie |
| HomePage | Dashboard — statystyki, top oferta, rekomendacje |
| SearchPage | Wyszukiwanie z filtrami (format, typ zatrudnienia, wynagrodzenie, doświadczenie) |
| SavedPage | Zapisane oferty pracy |
| ProfilePage | Podgląd profilu i wgrywanie CV |
| SettingsPage | Motyw (ciemny/jasny), wylogowanie |

---

### Dlaczego Django

Django zostało wybrane jako framework backendowy dla REST API. W połączeniu z Django REST Framework pokrywa większość potrzeb:

- **ORM** — modele (`User`, `Job`, `Company`, `SavedVacancy`) opisane w klasach Python, Django sam tworzy tabele w PostgreSQL i zarządza migracjami
- **Autentykacja** — JWT przez Simple JWT + Google OAuth bez pisania od zera
- **Serializatory DRF** — walidacja JSON i serializacja danych napisana deklaratywnie
- **Integracja z Celery** — projekt Django stanowi podstawę dla workerów Celery, które uruchamiają scrapery w tle
- **Django Admin** — gotowy panel do zarządzania danymi bez pisania UI

**Endpointy API:**

```
POST   /api/users/register/               Rejestracja
POST   /api/users/login/                  Logowanie, otrzymanie JWT
POST   /api/users/token/refresh/          Odświeżenie tokenu
POST   /api/users/google/                 Logowanie OAuth przez Google
POST   /api/users/change-password/        Zmiana hasła

GET/PUT  /api/users/onboarding/           Profil użytkownika
GET/PUT  /api/users/my-cv/                Tekst CV
PUT      /api/users/settings/             Ustawienia motywu
GET/POST /api/users/saved-vacancies/      Zapisane oferty
DELETE   /api/users/saved-vacancies/<id>/ Usuń zapisaną ofertę

GET  /api/jobs/                           Lista ofert
GET  /api/jobs/<id>/                      Szczegóły oferty
GET  /api/jobs/search/?q=&work_mode=      Wyszukiwanie (uruchamia scraper jeśli brak cache)
GET  /api/jobs/search/status/?q=          Status scrapowania
```

---

### Jak działają scrapery

Projekt zawiera dwa niezależne scrapery dla polskich portali z ofertami pracy.

#### Scraper 1 — praca.pl

**Docelowa strona:** `https://www.praca.pl`

**Algorytm:**

1. Tworzy URL wyszukiwania z IT-słowami kluczowymi (3 strony na każde zapytanie):
   ```
   https://www.praca.pl/oferty-pracy.html?q=python
   https://www.praca.pl/oferty-pracy_2.html?q=python
   https://www.praca.pl/oferty-pracy_3.html?q=python
   ```

2. Parsuje stronę przez BeautifulSoup, wyrażeniem regularnym wyciąga linki do ofert:
   ```python
   re.match(r'^https://www\.praca\.pl/[^,]+_\d+\.html', href)
   ```

3. Wchodzi na każdą ofertę, selektorami CSS pobiera dane:
   - Tytuł: `.app-offer__title`
   - Firma: `.app-offer__profile-link`
   - Lokalizacja: `.app-offer__main-item--location span`
   - Wynagrodzenie: `.app-offer__salary`
   - Format pracy: `.app-offer__header-item--home span`

4. Wzbogaca dane:
   - **Poziom** określany z tekstu ("senior" → senior) lub lat doświadczenia (0–1 → junior, 1–3 → middle, 3–6 → senior, 6+ → lead)
   - **Tagi** — wyszukiwanie w tekście oferty spośród ~40 technologii (React, Python, Docker, AWS i inne)
   - **Format pracy** tłumaczony z polskiego: "praca zdalna" → Remote, "praca hybrydowa" → Hybrid

5. Zapisuje do bazy z deduplikacją po hashu SHA256 URL — ta sama oferta nie trafi do bazy dwukrotnie

**Rate limiting:** losowe przerwy 0.8–1.5 sek między zapytaniami, 2–3 sek między stronami.

---

#### Scraper 2 — theprotocol.it

**Docelowa strona:** `https://theprotocol.it`

**Algorytm:**

1. Tworzy URL wyszukiwania:
   ```
   https://theprotocol.it/filtry/python;kw
   ```

2. Szuka w HTML linków z `/szczegoly/praca/` — strony ofert pracy

3. Na stronie oferty:
   - Tytuł: tag `<h1>`
   - Firma: link z `/szukaj/pracodawca/` (regex)
   - Format pracy: określany z tekstu ("praca zdalna" / "100% remote" → Remote, "hybryd" → Hybrid)

4. Ta sama logika wyciągania tagów i określania poziomu co w scraperze pierwszym

---

#### Uruchamianie scraperów przez Celery

Scrapery nie są uruchamiane ręcznie — zarządza nimi Celery:

```
Użytkownik wyszukuje "python"
        ↓
Django sprawdza cache (SearchQueryCache)
        ↓
Cache nieaktualny (> 12 godzin)? → Celery uruchamia scrape_all_sources_sequential_task
        ↓
1. Scrapuje theprotocol.it → 2. Scrapuje praca.pl
        ↓
Wyniki w bazie → frontend otrzymuje dane
```

**Automatyczne uruchamianie** — Celery Beat uruchamia pełny cykl co 12 godzin dla słów kluczowych:

```
python, react, java, javascript, devops,
frontend, backend, fullstack, php, data
```

---

### Stos technologiczny

| Warstwa | Technologia | Po co |
|---------|------------|-------|
| Frontend | React 18 | SPA z dynamicznym UI |
| Style | CSS (custom) | Własny system designu |
| Backend | Django 5 + DRF | REST API + ORM + Auth |
| Baza danych | PostgreSQL 14 | Przechowywanie ofert i użytkowników |
| Kolejka zadań | Celery + Redis | Scrapery działające w tle |
| Scrapery | BeautifulSoup4 + requests | Pobieranie ofert ze stron |
| Autentykacja | JWT + Google OAuth | Logowanie przez email i Google |
| Infrastruktura | Docker Compose + Nginx | Lokalny deployment całego stosu |

### Struktura projektu

```
NextStep/
├── backend/
│   ├── Dockerfile
│   ├── requirements.txt
│   └── src/
│       ├── manage.py
│       ├── base/           # Ustawienia Django, Celery
│       ├── users/          # Autentykacja, profile, zapisane oferty
│       ├── jobs/           # Oferty pracy, scrapery, zadania Celery
│       └── api/            # Dodatkowe endpointy API
├── frontend/
│   ├── NextStep.html       # Punkt wejścia
│   ├── app.jsx             # Główny komponent
│   ├── components.jsx      # Wielokrotnie używane komponenty
│   ├── pages-app.jsx       # Strony aplikacji
│   ├── pages-auth.jsx      # Strony autoryzacji
│   └── styles.css          # Globalne style
└── docker-compose.yml
```
