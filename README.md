# NextStep

Aplikacja webowa do wyszukiwania ofert pracy IT z personalizowanymi rekomendacjami. System automatycznie scrapuje polskie portale z ofertami pracy, dopasowuje oferty do profilu użytkownika i wyświetla najbardziej pasujące propozycje.

---

## Uruchomienie projektu

### Wymagania

- [Docker Desktop](https://www.docker.com/products/docker-desktop/)

### Krok 0 — Skonfiguruj zmienne środowiskowe

W katalogu `backend/src/` utwórz plik `.env` z wymaganymi zmiennymi:

```env
# Baza danych
DB_NAME=nextstep
DB_USER=nextstep
DB_PASSWORD=nextstep
DB_HOST=db
DB_PORT=5432

# Integracja AI (LLM) — patrz sekcja "Integracja AI i LLM"
LLM_PROVIDER=ollama          # ollama | anthropic | gemini
OLLAMA_BASE_URL=http://ollama:11434
OLLAMA_MODEL=llama3.2:3b
GEMINI_API_KEY=
GEMINI_MODEL=gemini-flash-latest
```

> Jeśli `LLM_PROVIDER` nie zostanie ustawiony, domyślnie używany jest `ollama`. Do korzystania z Anthropic/Gemini wymagany jest odpowiedni klucz API dostawcy.

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

Projekt zawiera dwa niezależne scrapery dla polskich portali IT, które opierają się na wspólnej klasie i wykorzystują wielowątkowość w celu przyspieszenia działania.

#### Podstawowa architektura (`jobs/base_scraper.py` i `jobs/scraper_utils.py`)

Cała wspólna logika została przeniesiona do klasy bazowej `BaseScraper` oraz narzędzi pomocniczych (utils):

- **Wielowątkowość:** Do pobierania stron ze szczegółami ofert pracy wykorzystywany jest `ThreadPoolExecutor` (do 5 jednoczesnych wątków), co znacznie przyspiesza proces zbierania danych.
- **Odporność na błędy:** Zapytania sieciowe są wykonywane przez `get_robust_session()`, która automatycznie ponawia zapytanie (Retry) w przypadku otrzymania błędów (429, 500, 502, 503, 504).
- **Cache i statusy:** Proces wyszukiwania jest rejestrowany w `SearchQueryCache`. Każde zapytanie przechodzi przez statusy `pending`, `completed` lub `failed`.
- **Uniwersalny parsing:** Funkcje z `scraper_utils.py` odpowiadają za wyciąganie tagów (wyszukiwanie spośród ~40 technologii IT), określanie poziomu doświadczenia z tekstu (lata pracy i słowa kluczowe takie jak "senior" czy "junior"), parsowanie dat oraz standaryzację formatu pracy (Remote, Hybrid, On-site).
- **Zapis i deduplikacja:** Wszystkie zapisy do bazy danych przechodzą przez `save_to_db()` z wygenerowaniem hasha SHA256 z URL, aby uniknąć duplikatów. System automatycznie tworzy również wpisy dla nowych firm.

#### Scraper 1 — praca.pl (`jobs/scraper.py`)

**Docelowa strona:** `https://www.praca.pl`

**Algorytm:**

1. Tworzy URL wyszukiwania dla danego słowa kluczowego (np. `https://www.praca.pl/s-python.html?p=python`).
2. Przy pomocy `BeautifulSoup` parsuje stronę i za pomocą wyrażenia regularnego `^https://www\.praca\.pl/[^,]+_\d+\.html` wyciąga unikalne linki do ofert pracy.
3. Wielowątkowo otwiera każdą ofertę i pobiera dane za pomocą selektorów CSS (tytuł, firma, lokalizacja, wynagrodzenie, typ zatrudnienia).
4. Jeśli oferta zawiera pełny opis, przepuszcza go przez narzędzia (utils) w celu wyciągnięcia tagów i określenia `experience_level`.

#### Scraper 2 — theprotocol.it (`jobs/theprotocol_scraper.py`)

**Docelowa strona:** `https://theprotocol.it`

**Algorytm:**

1. Tworzy URL wyszukiwania (np. `https://theprotocol.it/praca?kw=python`).
2. Znajduje wszystkie linki zawierające `/szczegoly/praca/` i formuje pełne adresy URL.
3. Parsuje stronę oferty. Format pracy (Remote, Hybrid, On-site) jest określany bezpośrednio z tekstu opisu, jeśli zawiera on słowa takie jak "praca zdalna", "100% remote" itp.
4. Dane są przetwarzane przez podstawowe narzędzia; tagi i lata doświadczenia są wyciągane z ogólnego bloku tekstu oferty.

---

#### Uruchamianie scraperów przez Celery

Scrapery są zarządzane przez Celery i uruchamiane asynchronicznie. W nowej architekturze system wykorzystuje przetwarzanie równoległe (Celery `group`) oraz automatyczne rozszerzanie zapytań (np. wyszukiwanie "frontend" pod maską szuka również "react", "vue" itd.):

```
Użytkownik wyszukuje "frontend"
        ↓
Django rozszerza zapytanie (np. frontend, react, vue...) i sprawdza cache (SearchQueryCache)
        ↓
Jeśli cache jest nieaktualny lub go brakuje → status 'pending', Celery uruchamia scrape_all_sources_parallel_task
        ↓
Zadania (tasks) uruchamiają się RÓWNOLEGLE dla każdego słowa kluczowego i każdego źródła:
├── theprotocol_scraper("frontend")
├── praca_pl_scraper("frontend")
├── theprotocol_scraper("react")
└── ...
        ↓
Wyniki są zapisywane do bazy danych → cache zmienia status na 'completed' → frontend otrzymuje dane przez endpoint /search/status/
```

**Automatyczne uruchamianie** — Celery Beat uruchamia pełny cykl co 12 godzin dla bazowych słów kluczowych:

```
python, react, java, javascript, devops,
frontend, backend, fullstack, php, data
```

---

### Integracja AI i LLM

Projekt wykorzystuje duże modele językowe (LLM) do inteligentnej analizy dopasowania między profilem użytkownika a ofertami pracy, a także do semantycznego rozszerzania zapytań wyszukiwania.

#### Architektura wielodostawcowa (Multi-provider)

Moduł sztucznej inteligencji został zaprojektowany przy użyciu wzorca Factory (`jobs/llm/factory.py`), co pozwala na dynamiczne przełączanie się między różnymi dostawcami bez zmiany głównej logiki biznesowej. Dostępne integracje:

- **Ollama** — do uruchamiania lokalnych modeli open-source (wysyła zapytania z wymuszonym `format: "json"`). Domyślny model: `llama3.2:3b`.
- **Anthropic** — integracja z modelami z rodziny Claude.
- **Gemini** — integracja z Google Gemini (używa `response_mime_type: "application/json"` dla ścisłego formatowania). Domyślny model: `gemini-flash-latest`.

Aktywny dostawca wybierany jest zmienną środowiskową `LLM_PROVIDER` (domyślnie `ollama`, patrz [Krok 0](#krok-0--skonfiguruj-zmienne-środowiskowe)) — zmiana nie wymaga edycji kodu, tylko `.env`.

#### Inteligentne dopasowanie (AI Matching)

Jeśli użytkownik wyszukuje z parametrem `mode=ai`, system podłącza sztuczną inteligencję do głębokiej analizy dopasowania kandydata i oferty pracy (`jobs/services/ai_matcher.py`):

- **Analiza kontekstu:** LLM otrzymuje kompleksowy prompt, łączący profil użytkownika (rola, umiejętności, doświadczenie, format pracy, wynagrodzenie) i dane oferty (opis, wymagania, warunki).
- **Ustrukturyzowana odpowiedź:** Model zwraca wyłącznie obiekt JSON, zawierający dokładny procent dopasowania (`match_percent`), listy znalezionych i brakujących umiejętności, a także uzasadnienie oceny w 1-2 zdaniach (`reasoning`).
- **Wykonywanie równoległe:** Ocena ofert pracy odbywa się asynchronicznie przez `ThreadPoolExecutor` (w 5 wątkach), co zapobiega blokowaniu aplikacji przy masowej analizie wyników.
- **Niezawodność (mechanizm Fallback):** W przypadku błędu API lub nieprawidłowej odpowiedzi modelu (JSONDecodeError), system płynnie przełącza się na klasyczny algorytm dopasowywania tagów, aby użytkownik w każdym przypadku otrzymał wynik.

#### Rozszerzanie zapytań (Query Expansion)

W celu maksymalizacji zasięgu podczas scrapingu wykorzystywany jest serwis `jobs/services/query_expander.py`.

- AI analizuje rolę i umiejętności użytkownika, generując 3–5 krótkich, trafnych synonimów (po 1-2 słowa).
- Przykład: Zapytanie "data" może zostać rozszerzone do "data analyst", "BI specialist", "business analyst". Pozwala to scraperom zbierać oferty, które mogłyby zostać pominięte przy bezpośrednim wyszukiwaniu.
- Wbudowana walidacja odrzuca zbyt długie (powyżej 2 słów) lub zależne od lokalizacji frazy.

#### Klasyczne dopasowanie (Tag Matcher)

Bazowy algorytm (`jobs/services/tag_matcher.py`), który działa domyślnie w trybie `mode=classic` lub służy jako zabezpieczenie (fallback) dla AI:

- Oblicza bazowy scoring na podstawie części wspólnej (Set Intersection) umiejętności użytkownika i wyciągniętych tagów z oferty pracy.
- Przyznaje +10 punktów bonusowych, jeśli format pracy oferty pokrywa się z preferencjami kandydata.
- Koryguje ocenę na podstawie poziomu doświadczenia: +10 punktów za dokładne dopasowanie (np. middle == middle) lub -5 punktów za brak dopasowania.

---

### Jak działa autoryzacja przez Google

NextStep obsługuje logowanie przez Google OAuth 2.0. Użytkownik nie musi tworzyć hasła — wystarczy konto Google.

#### Krok 1 — Google Identity Services na frontendzie

Na stronie logowania ładowana jest biblioteka Google Identity Services (`accounts.google.id`). Przy wejściu na stronę inicjalizuje się przycisk "Sign in with Google":

```js
window.google.accounts.id.initialize({
  client_id: GOOGLE_CLIENT_ID,
  callback: handleGoogleResponse
});
window.google.accounts.id.renderButton(
  document.getElementById("google-btn-div"),
  { theme: "outline", size: "large", width: 400 }
);
```

Użytkownik klika przycisk → Google otwiera popup z wyborem konta → po wybraniu konta Google zwraca **JWT credential token** (id_token) podpisany przez Google.

#### Krok 2 — Weryfikacja tokenu na backendzie

Frontend wysyła id_token do backendu:

```
POST /api/users/google/
{ "token": "<id_token od Google>" }
```

Backend weryfikuje token biblioteką `google-auth`:

```python
idinfo = id_token.verify_oauth2_token(token, google_requests.Request(), CLIENT_ID)
email = idinfo['email']
first_name = idinfo.get('given_name', '')
last_name = idinfo.get('family_name', '')
```

`verify_oauth2_token` sprawdza podpis kryptograficzny Google, datę wygaśnięcia i `CLIENT_ID` — jeśli cokolwiek się nie zgadza, rzuca `ValueError` i zwracamy `400 Bad Request`.

#### Krok 3 — Tworzenie lub wyszukiwanie użytkownika

```
Token ważny → backend sprawdza, czy user z tym emailem już istnieje
       ↓
Istnieje → używamy go
       ↓
Nie istnieje → tworzymy nowe konto (username z prefixu email, set_unusable_password)
       ↓
Generujemy JWT (access + refresh) i zwracamy dane użytkownika
```

Nowy użytkownik stworzony przez Google **nie ma hasła** — `set_unusable_password()` blokuje logowanie przez klasyczny formularz email/hasło. Konto można obsługiwać wyłącznie przez Google.

Przy kolejnym logowaniu przez Google token znowu trafia do `verify_oauth2_token` — jeśli email już jest w bazie, użytkownik po prostu dostaje nowe tokeny JWT.

#### Krok 4 — Frontend przechowuje tokeny

Po odpowiedzi `200 OK`:

```js
localStorage.setItem('access_token', data.access);
localStorage.setItem('refresh_token', data.refresh);
```

Od tej chwili wszystkie zapytania do API lecą z nagłówkiem `Authorization: Bearer <access_token>` — tak samo jak przy logowaniu przez email.

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
├── .vscode/
│   └── settings.json
├── backend/
│   ├── Dockerfile
│   ├── pytest.ini
│   ├── requirements.txt
│   └── src/
│       ├── manage.py
│       ├── .env
│       ├── celerybeat-schedule
│       ├── celerybeat-schedule.bak
│       ├── celerybeat-schedule.dir
│       ├── api/              I
│       │   ├── migrations/
│       │   ├── admin.py
│       │   ├── apps.py
│       │   ├── models.py
│       │   ├── serializers.py
│       │   ├── tests.py
│       │   ├── urls.py
│       │   └── views.py
│       ├── base/              # Ustawienia Django, Celery, LLM
│       │   ├── asgi.py
│       │   ├── celery.py
│       │   ├── settings.py
│       │   ├── urls.py
│       │   └── wsgi.py
│       ├── jobs/               # Oferty pracy, scrapery, zadania Celery
│       │   ├── migrations/
│       │   ├── tests/
│       │   ├── llm/            # Integracja AI — wzorzec Factory, dostawcy LLM
│       │   │   ├── base.py
│       │   │   ├── factory.py
│       │   │   └── providers.py
│       │   ├── services/       # AI matching, tag matcher, query expander
│       │   │   ├── ai_matcher.py
│       │   │   ├── matching.py
│       │   │   ├── query_expander.py
│       │   │   └── tag_matcher.py
│       │   ├── admin.py
│       │   ├── apps.py
│       │   ├── base_scraper.py
│       │   ├── models.py
│       │   ├── pagination.py
│       │   ├── scraper.py
│       │   ├── scraper_utils.py
│       │   ├── serializers.py
│       │   ├── tasks.py
│       │   ├── theprotocol_scraper.py
│       │   ├── urls.py
│       │   └── views.py
│       └── users/              # Autentykacja, profile, zapisane oferty
│           ├── migrations/
│           ├── tests/
│           │   ├── factories.py
│           │   ├── test_auth.py
│           │   └── test_google_oauth.py
│           ├── admin.py
│           ├── apps.py
│           ├── backends.py
│           ├── models.py
│           ├── pagination.py
│           ├── serializers.py
│           ├── urls.py
│           └── views.py
├── frontend/
│   ├── assets/
│   │   ├── logo.png
│   │   └── logo.svg
│   ├── uploads/
│   ├── app.jsx              # Główny komponent
│   ├── components.jsx       # Wielokrotnie używane komponenty
│   ├── data.js
│   ├── index.html
│   ├── NextStep.html        # Punkt wejścia
│   ├── pages-app.jsx        # Strony aplikacji
│   ├── pages-auth.jsx       # Strony autoryzacji
│   └── styles.css           # Globalne style
├── docker-compose.yml
├── package.json
└── README.md
```
