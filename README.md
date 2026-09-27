# NextStep

🇵🇱 [Polski](#-wersja-polska) · 🇬🇧 [English](#-english-version)

---

## 🇵🇱 Wersja polska

Aplikacja webowa do wyszukiwania ofert pracy IT z personalizowanymi rekomendacjami. System automatycznie scrapuje polskie portale z ofertami pracy, dopasowuje oferty do profilu użytkownika i wyświetla najbardziej pasujące propozycje.

#### Spis treści

- [Uruchomienie projektu](#uruchomienie-projektu)
  - [Wymagania](#wymagania)
  - [Krok 0 — Skonfiguruj zmienne środowiskowe](#krok-0--skonfiguruj-zmienne-środowiskowe)
  - [Krok 1 — Uruchom Docker Desktop](#krok-1--uruchom-docker-desktop)
  - [Krok 2 — Uruchom kontenery](#krok-2--uruchom-kontenery)
  - [Krok 3 — Wykonaj migracje](#krok-3--wykonaj-migracje)
  - [Krok 4 — Utwórz superużytkownika (opcjonalnie)](#krok-4--utwórz-superużytkownika-opcjonalnie)
  - [Krok 5 — Uruchom testy (opcjonalnie)](#krok-5--uruchom-testy-opcjonalnie)
  - [Gotowe](#gotowe)
- [Zrzuty ekranu / Screenshots](#zrzuty-ekranu--screenshots)
- [Opis projektu](#opis-projektu)
  - [Czym jest NextStep](#czym-jest-nextstep)
  - [Dlaczego React](#dlaczego-react)
  - [Dlaczego Django](#dlaczego-django)
  - [Jak działają scrapery](#jak-działają-scrapery)
  - [Integracja AI i LLM](#integracja-ai-i-llm)
  - [Jak działa autoryzacja przez Google](#jak-działa-autoryzacja-przez-google)
  - [Stos technologiczny](#stos-technologiczny)
  - [Struktura projektu](#struktura-projektu)

---

### Uruchomienie projektu

#### Wymagania

- [Docker Desktop](https://www.docker.com/products/docker-desktop/)

#### Krok 0 — Skonfiguruj zmienne środowiskowe

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

# Logowanie przez Google OAuth — patrz sekcja "Jak działa autoryzacja przez Google"
GOOGLE_CLIENT_ID=
```

> Jeśli `LLM_PROVIDER` nie zostanie ustawiony, domyślnie używany jest `ollama`. Do korzystania z Anthropic/Gemini wymagany jest odpowiedni klucz API dostawcy.

> **Skąd wziąć `GOOGLE_CLIENT_ID`:** wejdź na [Google Cloud Console](https://console.cloud.google.com/apis/credentials), utwórz (lub wybierz) projekt, następnie **Create Credentials → OAuth client ID** typu *Web application*. Jako *Authorized JavaScript origins* dodaj `http://localhost:5500`. Skopiowany Client ID wklej zarówno do `.env` backendu (`GOOGLE_CLIENT_ID`), jak i do konfiguracji frontendu (`GOOGLE_CLIENT_ID` w `frontend/data.js` lub odpowiednim pliku konfiguracyjnym), ponieważ ten sam identyfikator jest używany po obu stronach — patrz [Jak działa autoryzacja przez Google](#jak-działa-autoryzacja-przez-google).

#### Krok 1 — Uruchom Docker Desktop

Upewnij się, że Docker Desktop jest uruchomiony (ikona wieloryba na pasku menu).

#### Krok 2 — Uruchom kontenery

```bash
docker-compose up --build
```

Poczekaj, aż wszystkie serwisy się uruchomią — zobaczysz logi od `db`, `redis`, `api`, `celery`, `frontend`.

#### Krok 3 — Wykonaj migracje

W **nowym terminalu**, gdy kontenery działają:

```bash
docker-compose exec api python manage.py migrate
```

#### Krok 4 — Utwórz superużytkownika (opcjonalnie)

Aby uzyskać dostęp do panelu Django Admin:

```bash
docker-compose exec api python manage.py createsuperuser
```

Panel dostępny jest pod adresem `http://localhost:8000/admin/`.

#### Krok 5 — Uruchom testy (opcjonalnie)

```bash
docker-compose exec api pytest
```

Testy (`test_auth.py`, `test_google_oauth.py` i inne) korzystają z fabryk danych (`factories.py`) i konfiguracji z `pytest.ini`.

#### Gotowe

| Serwis | Adres |
|--------|-------|
| Frontend (strona) | http://localhost:5500 |
| Backend API | http://localhost:8000 |
| Baza danych | localhost:5432 |
| Redis | localhost:6380 |

> Migracje należy wykonać tylko raz (lub po pojawieniu się nowych). Przy kolejnych uruchomieniach wystarczy `docker-compose up`.

---

### Zrzuty ekranu / Screenshots

**LoginPage** — logowanie przez email/hasło oraz Google OAuth
<img width="2558" height="1228" alt="Image" src="https://github.com/user-attachments/assets/3e7cb5ec-09da-4f2e-88a3-661e5a3d0fac" />

**OnboardingPage** — formularz profilu (rola, umiejętności, doświadczenie, format, wynagrodzenie)
<img width="2558" height="1227" alt="Image" src="https://github.com/user-attachments/assets/0325636d-2b89-4f9e-9c78-56bcb15a51d7" />

**HomePage** — dashboard ze statystykami, top ofertą i rekomendacjami
<img width="2547" height="1228" alt="Image" src="https://github.com/user-attachments/assets/059672df-45ea-47c8-891e-698850234a61" />

**SearchPage — tryb klasyczny (`mode=classic`)** — lista ofert z `MatchMeter` i filtrami
<img width="2540" height="1230" alt="Image" src="https://github.com/user-attachments/assets/af4029f4-e0d2-4ff1-b6f1-edcdb4e8daba" />

**SearchPage — tryb AI (`mode=ai`)** — dopasowanie oparte na LLM z uzasadnieniem (`reasoning`)
<img width="2547" height="1227" alt="Image" src="https://github.com/user-attachments/assets/c32ea4a8-880b-4ec2-a5dd-3c04598db024" />

**Otwarta oferta (JobCard)** — pełny opis, tagi technologii, przycisk zapisu
<img width="2545" height="1227" alt="Image" src="https://github.com/user-attachments/assets/e12d395c-9b05-4527-9452-bffc6e327b7d" />

**SavedPage** — zapisane oferty pracy
<img width="2543" height="1230" alt="Image" src="https://github.com/user-attachments/assets/0c2acbba-02e9-4f2b-b6c5-f0d4d15dd564" />

**ProfilePage** — podgląd profilu i wgrane CV
<img width="2557" height="1230" alt="Image" src="https://github.com/user-attachments/assets/95e79021-6ceb-4a27-958c-135eb21d0fae" />

**SettingsPage** — motyw jasny / ciemny
<img width="2557" height="1227" alt="Image" src="https://github.com/user-attachments/assets/6f080c65-12af-4ba3-902a-9d2fa708c1d8" />
<img width="2557" height="1227" alt="Image" src="https://github.com/user-attachments/assets/bfb664f1-b8f0-4af1-9c5d-879038464dd2" />

**Główny przepływ aplikacji (demo)** — logowanie → onboarding → wyszukiwanie → wyniki → zapis oferty + przełączanie motywu

https://github.com/user-attachments/assets/6d276c6a-6bd5-4d2f-b229-92320141d58d

---

### Opis projektu

#### Czym jest NextStep

NextStep to SPA z Django REST API po stronie backendu. Użytkownik rejestruje się, wypełnia profil (rola, umiejętności, doświadczenie, format pracy, oczekiwane wynagrodzenie), a następnie system wyszukuje pasujące oferty pracy na polskich portalach IT i wyświetla je z procentem dopasowania.

---

#### Dlaczego React

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

#### Dlaczego Django

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

#### Jak działają scrapery

Projekt zawiera dwa niezależne scrapery dla polskich portali IT, które opierają się na wspólnej klasie i wykorzystują wielowątkowość w celu przyspieszenia działania.

##### Podstawowa architektura (`jobs/base_scraper.py` i `jobs/scraper_utils.py`)

Cała wspólna logika została przeniesiona do klasy bazowej `BaseScraper` oraz narzędzi pomocniczych (utils):

- **Wielowątkowość:** Do pobierania stron ze szczegółami ofert pracy wykorzystywany jest `ThreadPoolExecutor` (do 5 jednoczesnych wątków), co znacznie przyspiesza proces zbierania danych.
- **Odporność na błędy:** Zapytania sieciowe są wykonywane przez `get_robust_session()`, która automatycznie ponawia zapytanie (Retry) w przypadku otrzymania błędów (429, 500, 502, 503, 504).
- **Cache i statusy:** Proces wyszukiwania jest rejestrowany w `SearchQueryCache`. Każde zapytanie przechodzi przez statusy `pending`, `completed` lub `failed`.
- **Uniwersalny parsing:** Funkcje z `scraper_utils.py` odpowiadają za wyciąganie tagów (wyszukiwanie spośród ~40 technologii IT), określanie poziomu doświadczenia z tekstu (lata pracy i słowa kluczowe takie jak "senior" czy "junior"), parsowanie dat oraz standaryzację formatu pracy (Remote, Hybrid, On-site).
- **Zapis i deduplikacja:** Wszystkie zapisy do bazy danych przechodzą przez `save_to_db()` z wygenerowaniem hasha SHA256 z URL, aby uniknąć duplikatów. System automatycznie tworzy również wpisy dla nowych firm.

##### Scraper 1 — praca.pl (`jobs/scraper.py`)

**Docelowa strona:** `https://www.praca.pl`

**Algorytm:**

1. Tworzy URL wyszukiwania dla danego słowa kluczowego (np. `https://www.praca.pl/s-python.html?p=python`).
2. Przy pomocy `BeautifulSoup` parsuje stronę i za pomocą wyrażenia regularnego `^https://www\.praca\.pl/[^,]+_\d+\.html` wyciąga unikalne linki do ofert pracy.
3. Wielowątkowo otwiera każdą ofertę i pobiera dane za pomocą selektorów CSS (tytuł, firma, lokalizacja, wynagrodzenie, typ zatrudnienia).
4. Jeśli oferta zawiera pełny opis, przepuszcza go przez narzędzia (utils) w celu wyciągnięcia tagów i określenia `experience_level`.

##### Scraper 2 — theprotocol.it (`jobs/theprotocol_scraper.py`)

**Docelowa strona:** `https://theprotocol.it`

**Algorytm:**

1. Tworzy URL wyszukiwania (np. `https://theprotocol.it/praca?kw=python`).
2. Znajduje wszystkie linki zawierające `/szczegoly/praca/` i formuje pełne adresy URL.
3. Parsuje stronę oferty. Format pracy (Remote, Hybrid, On-site) jest określany bezpośrednio z tekstu opisu, jeśli zawiera on słowa takie jak "praca zdalna", "100% remote" itp.
4. Dane są przetwarzane przez podstawowe narzędzia; tagi i lata doświadczenia są wyciągane z ogólnego bloku tekstu oferty.

---

##### Uruchamianie scraperów przez Celery

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

#### Integracja AI i LLM

Projekt wykorzystuje duże modele językowe (LLM) do inteligentnej analizy dopasowania między profilem użytkownika a ofertami pracy, a także do semantycznego rozszerzania zapytań wyszukiwania.

##### Architektura wielodostawcowa (Multi-provider)

Moduł sztucznej inteligencji został zaprojektowany przy użyciu wzorca Factory (`jobs/llm/factory.py`), co pozwala na dynamiczne przełączanie się między różnymi dostawcami bez zmiany głównej logiki biznesowej. Dostępne integracje:

- **Ollama** — do uruchamiania lokalnych modeli open-source (wysyła zapytania z wymuszonym `format: "json"`). Domyślny model: `llama3.2:3b`.
- **Anthropic** — integracja z modelami z rodziny Claude.
- **Gemini** — integracja z Google Gemini (używa `response_mime_type: "application/json"` dla ścisłego formatowania). Domyślny model: `gemini-flash-latest`.

Aktywny dostawca wybierany jest zmienną środowiskową `LLM_PROVIDER` (domyślnie `ollama`, patrz Krok 0 powyżej) — zmiana nie wymaga edycji kodu, tylko `.env`.

##### Inteligentne dopasowanie (AI Matching)

Jeśli użytkownik wyszukuje z parametrem `mode=ai`, system podłącza sztuczną inteligencję do głębokiej analizy dopasowania kandydata i oferty pracy (`jobs/services/ai_matcher.py`):

- **Analiza kontekstu:** LLM otrzymuje kompleksowy prompt, łączący profil użytkownika (rola, umiejętności, doświadczenie, format pracy, wynagrodzenie) i dane oferty (opis, wymagania, warunki).
- **Ustrukturyzowana odpowiedź:** Model zwraca wyłącznie obiekt JSON, zawierający dokładny procent dopasowania (`match_percent`), listy znalezionych i brakujących umiejętności, a także uzasadnienie oceny w 1-2 zdaniach (`reasoning`).
- **Wykonywanie równoległe:** Ocena ofert pracy odbywa się asynchronicznie przez `ThreadPoolExecutor` (w 5 wątkach), co zapobiega blokowaniu aplikacji przy masowej analizie wyników.
- **Niezawodność (mechanizm Fallback):** W przypadku błędu API lub nieprawidłowej odpowiedzi modelu (JSONDecodeError), system płynnie przełącza się na klasyczny algorytm dopasowywania tagów, aby użytkownik w każdym przypadku otrzymał wynik.

##### Rozszerzanie zapytań (Query Expansion)

W celu maksymalizacji zasięgu podczas scrapingu wykorzystywany jest serwis `jobs/services/query_expander.py`.

- AI analizuje rolę i umiejętności użytkownika, generując 3–5 krótkich, trafnych synonimów (po 1-2 słowa).
- Przykład: Zapytanie "data" może zostać rozszerzone do "data analyst", "BI specialist", "business analyst". Pozwala to scraperom zbierać oferty, które mogłyby zostać pominięte przy bezpośrednim wyszukiwaniu.
- Wbudowana walidacja odrzuca zbyt długie (powyżej 2 słów) lub zależne od lokalizacji frazy.

##### Klasyczne dopasowanie (Tag Matcher)

Bazowy algorytm (`jobs/services/tag_matcher.py`), który działa domyślnie w trybie `mode=classic` lub służy jako zabezpieczenie (fallback) dla AI:

- Oblicza bazowy scoring na podstawie części wspólnej (Set Intersection) umiejętności użytkownika i wyciągniętych tagów z oferty pracy.
- Przyznaje +10 punktów bonusowych, jeśli format pracy oferty pokrywa się z preferencjami kandydata.
- Koryguje ocenę na podstawie poziomu doświadczenia: +10 punktów za dokładne dopasowanie (np. middle == middle) lub -5 punktów za brak dopasowania.

---

#### Jak działa autoryzacja przez Google

NextStep obsługuje logowanie przez Google OAuth 2.0. Użytkownik nie musi tworzyć hasła — wystarczy konto Google.

##### Krok 1 — Google Identity Services na frontendzie

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

##### Krok 2 — Weryfikacja tokenu na backendzie

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

##### Krok 3 — Tworzenie lub wyszukiwanie użytkownika

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

##### Krok 4 — Frontend przechowuje tokeny

Po odpowiedzi `200 OK`:

```js
localStorage.setItem('access_token', data.access);
localStorage.setItem('refresh_token', data.refresh);
```

Od tej chwili wszystkie zapytania do API lecą z nagłówkiem `Authorization: Bearer <access_token>` — tak samo jak przy logowaniu przez email.

---

#### Stos technologiczny

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

#### Struktura projektu

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
│       ├── api/              # Dodatkowe endpointy API
│       │   ├── migrations/
│       │   ├── admin.py
│       │   ├── apps.py
│       │   ├── models.py
│       │   ├── serializers.py
│       │   ├── tests.py
│       │   ├── urls.py
│       │   └── views.py
│       ├── base/              # Ustawienia Django, Celery
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

---

## 🇬🇧 English version

A web application for searching IT job offers with personalized recommendations. The system automatically scrapes Polish job boards, matches job offers to the user's profile, and displays the best-matching proposals.

#### Table of contents

- [Running the project](#running-the-project)
  - [Requirements](#requirements)
  - [Step 0 — Configure environment variables](#step-0--configure-environment-variables)
  - [Step 1 — Start Docker Desktop](#step-1--start-docker-desktop)
  - [Step 2 — Start the containers](#step-2--start-the-containers)
  - [Step 3 — Run migrations](#step-3--run-migrations)
  - [Step 4 — Create a superuser (optional)](#step-4--create-a-superuser-optional)
  - [Step 5 — Run the tests (optional)](#step-5--run-the-tests-optional)
  - [Done](#done)
- [Screenshots](#screenshots)
- [Project overview](#project-overview)
  - [What is NextStep](#what-is-nextstep)
  - [Why React](#why-react)
  - [Why Django](#why-django)
  - [How the scrapers work](#how-the-scrapers-work)
  - [AI & LLM Integration](#ai--llm-integration)
  - [How Google authorization works](#how-google-authorization-works)
  - [Tech stack](#tech-stack)
  - [Project structure](#project-structure)

---

### Running the project

#### Requirements

- [Docker Desktop](https://www.docker.com/products/docker-desktop/)

#### Step 0 — Configure environment variables

In the `backend/src/` directory, create a `.env` file with the required variables:

```env
# Database
DB_NAME=nextstep
DB_USER=nextstep
DB_PASSWORD=nextstep
DB_HOST=db
DB_PORT=5432

# AI (LLM) integration — see the "AI & LLM Integration" section
LLM_PROVIDER=ollama          # ollama | anthropic | gemini
OLLAMA_BASE_URL=http://ollama:11434
OLLAMA_MODEL=llama3.2:3b
GEMINI_API_KEY=
GEMINI_MODEL=gemini-flash-latest

# Google OAuth login — see the "How Google authorization works" section
GOOGLE_CLIENT_ID=
```

> If `LLM_PROVIDER` is not set, `ollama` is used by default. Using Anthropic/Gemini requires the corresponding provider's API key.

> **Where to get `GOOGLE_CLIENT_ID`:** go to the [Google Cloud Console](https://console.cloud.google.com/apis/credentials), create (or select) a project, then **Create Credentials → OAuth client ID** of type *Web application*. Add `http://localhost:5500` as an *Authorized JavaScript origin*. Paste the resulting Client ID into both the backend `.env` (`GOOGLE_CLIENT_ID`) and the frontend configuration (`GOOGLE_CLIENT_ID` in `frontend/data.js` or the relevant config file), since the same identifier is used on both sides — see [How Google authorization works](#how-google-authorization-works).

#### Step 1 — Start Docker Desktop

Make sure Docker Desktop is running (the whale icon in the menu bar).

#### Step 2 — Start the containers

```bash
docker-compose up --build
```

Wait until all services have started — you'll see logs from `db`, `redis`, `api`, `celery`, and `frontend`.

#### Step 3 — Run migrations

In a **new terminal**, while the containers are running:

```bash
docker-compose exec api python manage.py migrate
```

#### Step 4 — Create a superuser (optional)

To get access to the Django Admin panel:

```bash
docker-compose exec api python manage.py createsuperuser
```

The panel is available at `http://localhost:8000/admin/`.

#### Step 5 — Run the tests (optional)

```bash
docker-compose exec api pytest
```

The tests (`test_auth.py`, `test_google_oauth.py`, and others) use data factories (`factories.py`) and the configuration from `pytest.ini`.

#### Done

| Service | Address |
|---------|---------|
| Frontend (site) | http://localhost:5500 |
| Backend API | http://localhost:8000 |
| Database | localhost:5432 |
| Redis | localhost:6380 |

> Migrations only need to be run once (or when new ones appear). On subsequent runs, `docker-compose up` is enough.

---

### Screenshots

**LoginPage** — login via email/password and Google OAuth
<img width="2558" height="1228" alt="Image" src="https://github.com/user-attachments/assets/3e7cb5ec-09da-4f2e-88a3-661e5a3d0fac" />

**OnboardingPage** — profile form (role, skills, experience, format, salary)
<img width="2558" height="1227" alt="Image" src="https://github.com/user-attachments/assets/0325636d-2b89-4f9e-9c78-56bcb15a51d7" />

**HomePage** — dashboard with statistics, top offer, and recommendations
<img width="2547" height="1228" alt="Image" src="https://github.com/user-attachments/assets/059672df-45ea-47c8-891e-698850234a61" />

**SearchPage — classic mode (`mode=classic`)** — offer list with `MatchMeter` and filters
<img width="2540" height="1230" alt="Image" src="https://github.com/user-attachments/assets/af4029f4-e0d2-4ff1-b6f1-edcdb4e8daba" />

**SearchPage — AI mode (`mode=ai`)** — LLM-based matching with a visible rationale (`reasoning`)
<img width="2547" height="1227" alt="Image" src="https://github.com/user-attachments/assets/c32ea4a8-880b-4ec2-a5dd-3c04598db024" />

**Opened offer (JobCard)** — full description, technology tags, save button
<img width="2545" height="1227" alt="Image" src="https://github.com/user-attachments/assets/e12d395c-9b05-4527-9452-bffc6e327b7d" />

**SavedPage** — saved job offers
<img width="2543" height="1230" alt="Image" src="https://github.com/user-attachments/assets/0c2acbba-02e9-4f2b-b6c5-f0d4d15dd564" />

**ProfilePage** — profile overview and uploaded CV
<img width="2557" height="1230" alt="Image" src="https://github.com/user-attachments/assets/95e79021-6ceb-4a27-958c-135eb21d0fae" />

**SettingsPage** — light / dark theme
<img width="2557" height="1227" alt="Image" src="https://github.com/user-attachments/assets/6f080c65-12af-4ba3-902a-9d2fa708c1d8" />
<img width="2557" height="1227" alt="Image" src="https://github.com/user-attachments/assets/bfb664f1-b8f0-4af1-9c5d-879038464dd2" />

**Main application flow (demo)** — login → onboarding → search → results → save an offer + theme switching

https://github.com/user-attachments/assets/6d276c6a-6bd5-4d2f-b229-92320141d58d

---

### Project overview

#### What is NextStep

NextStep is an SPA with a Django REST API backend. The user registers, fills out a profile (role, skills, experience, work format, expected salary), and the system then searches for matching IT job offers on Polish job boards and displays them with a match percentage.

---

#### Why React

React was chosen to build the SPA — the user sees a single page that updates dynamically without reloading.

- The interface consists of many states: search with filters, job listing, opened card, saved offers, profile — React handles all of this without unnecessary complexity via `useState`/`useEffect`
- Components are reusable: `JobCard`, `MatchMeter`, `Chip`, `Toast` are written once and used across different pages
- Asynchronous work with the API — a search sends a request, React shows a loader, then swaps in the results without reloading the page

React is loaded via CDN with no bundler (Webpack/Vite). JSX is transpiled directly in the browser by Babel Standalone.

**Application pages:**

| Page | Description |
|------|-------------|
| LoginPage | Login / registration via email or Google OAuth |
| OnboardingPage | Filling out the profile: role, skills, experience, format, salary |
| HomePage | Dashboard — statistics, top offer, recommendations |
| SearchPage | Search with filters (format, employment type, salary, experience) |
| SavedPage | Saved job offers |
| ProfilePage | Profile overview and CV upload |
| SettingsPage | Theme (dark/light), logout |

---

#### Why Django

Django was chosen as the backend framework for the REST API. Combined with Django REST Framework, it covers most of the needs:

- **ORM** — models (`User`, `Job`, `Company`, `SavedVacancy`) are described as Python classes; Django creates the PostgreSQL tables itself and manages migrations
- **Authentication** — JWT via Simple JWT + Google OAuth without writing it from scratch
- **DRF serializers** — JSON validation and data serialization written declaratively
- **Celery integration** — the Django project is the foundation for Celery workers that run the scrapers in the background
- **Django Admin** — a ready-made panel for managing data without writing a UI

**API endpoints:**

```
POST   /api/users/register/               Registration
POST   /api/users/login/                  Login, obtain JWT
POST   /api/users/token/refresh/          Refresh token
POST   /api/users/google/                 Google OAuth login
POST   /api/users/change-password/        Change password

GET/PUT  /api/users/onboarding/           User profile
GET/PUT  /api/users/my-cv/                CV text
PUT      /api/users/settings/             Theme settings
GET/POST /api/users/saved-vacancies/      Saved offers
DELETE   /api/users/saved-vacancies/<id>/ Delete a saved offer

GET  /api/jobs/                           List of offers
GET  /api/jobs/<id>/                      Offer details
GET  /api/jobs/search/?q=&work_mode=      Search (triggers a scraper if no cache)
GET  /api/jobs/search/status/?q=          Scraping status
```

---

#### How the scrapers work

The project contains two independent scrapers for Polish IT job boards, built on a shared base class and using multithreading to speed up execution.

##### Base architecture (`jobs/base_scraper.py` and `jobs/scraper_utils.py`)

All shared logic has been moved into the `BaseScraper` base class and helper utilities:

- **Multithreading:** Fetching job-offer detail pages uses a `ThreadPoolExecutor` (up to 5 concurrent threads), significantly speeding up data collection.
- **Fault tolerance:** Network requests go through `get_robust_session()`, which automatically retries requests on errors (429, 500, 502, 503, 504).
- **Cache and statuses:** The search process is tracked in `SearchQueryCache`. Each query goes through the statuses `pending`, `completed`, or `failed`.
- **Universal parsing:** Functions in `scraper_utils.py` handle tag extraction (searching among ~40 IT technologies), determining the experience level from text (years of experience and keywords like "senior" or "junior"), date parsing, and standardizing the work format (Remote, Hybrid, On-site).
- **Saving and deduplication:** All database writes go through `save_to_db()`, which generates a SHA256 hash of the URL to avoid duplicates. The system also automatically creates entries for new companies.

##### Scraper 1 — praca.pl (`jobs/scraper.py`)

**Target site:** `https://www.praca.pl`

**Algorithm:**

1. Builds a search URL for the given keyword (e.g. `https://www.praca.pl/s-python.html?p=python`).
2. Parses the page with `BeautifulSoup` and extracts unique job-offer links using the regular expression `^https://www\.praca\.pl/[^,]+_\d+\.html`.
3. Opens each offer using multiple threads and extracts data via CSS selectors (title, company, location, salary, employment type).
4. If the offer contains a full description, it is passed through the utilities to extract tags and determine `experience_level`.

##### Scraper 2 — theprotocol.it (`jobs/theprotocol_scraper.py`)

**Target site:** `https://theprotocol.it`

**Algorithm:**

1. Builds a search URL (e.g. `https://theprotocol.it/praca?kw=python`).
2. Finds all links containing `/szczegoly/praca/` and builds the full URLs.
3. Parses the offer page. The work format (Remote, Hybrid, On-site) is determined directly from the description text if it contains words such as "praca zdalna" ("remote work"), "100% remote", etc.
4. The data is processed through the base utilities; tags and years of experience are extracted from the general text block of the offer.

---

##### Running the scrapers via Celery

The scrapers are managed by Celery and run asynchronously. In the new architecture, the system uses parallel processing (Celery `group`) and automatic query expansion (e.g. a search for "frontend" also searches under the hood for "react", "vue", etc.):

```
User searches for "frontend"
        ↓
Django expands the query (e.g. frontend, react, vue...) and checks the cache (SearchQueryCache)
        ↓
If the cache is stale or missing → status 'pending', Celery runs scrape_all_sources_parallel_task
        ↓
Tasks run IN PARALLEL for each keyword and each source:
├── theprotocol_scraper("frontend")
├── praca_pl_scraper("frontend")
├── theprotocol_scraper("react")
└── ...
        ↓
Results are saved to the database → cache status changes to 'completed' → the frontend receives data via the /search/status/ endpoint
```

**Automatic runs** — Celery Beat runs a full cycle every 12 hours for the base keywords:

```
python, react, java, javascript, devops,
frontend, backend, fullstack, php, data
```

---

#### AI & LLM Integration

The project uses large language models (LLMs) for intelligent match analysis between the user's profile and job offers, as well as for semantic search-query expansion.

##### Multi-provider architecture

The AI module is designed using the Factory pattern (`jobs/llm/factory.py`), which allows dynamically switching between different providers without changing the core business logic. Available integrations:

- **Ollama** — for running local open-source models (sends requests with `format: "json"` enforced). Default model: `llama3.2:3b`.
- **Anthropic** — integration with models from the Claude family.
- **Gemini** — integration with Google Gemini (uses `response_mime_type: "application/json"` for strict formatting). Default model: `gemini-flash-latest`.

The active provider is selected via the `LLM_PROVIDER` environment variable (defaults to `ollama`, see Step 0 above) — switching it requires no code changes, only editing `.env`.

##### AI Matching

If the user searches with the `mode=ai` parameter, the system engages AI for an in-depth analysis of the match between the candidate and a job offer (`jobs/services/ai_matcher.py`):

- **Context analysis:** The LLM receives a comprehensive prompt combining the user's profile (role, skills, experience, work format, salary) and offer data (description, requirements, conditions).
- **Structured response:** The model returns only a JSON object containing the exact match percentage (`match_percent`), lists of found and missing skills, and a 1–2 sentence rationale (`reasoning`).
- **Parallel execution:** Job-offer scoring is done asynchronously via a `ThreadPoolExecutor` (5 threads), which prevents the application from blocking during bulk analysis of results.
- **Reliability (fallback mechanism):** If there is an API error or an invalid model response (JSONDecodeError), the system seamlessly falls back to the classic tag-matching algorithm, so the user always gets a result.

##### Query Expansion

To maximize scraping coverage, the `jobs/services/query_expander.py` service is used.

- AI analyzes the user's role and skills, generating 3–5 short, relevant synonyms (1–2 words each).
- Example: the query "data" can be expanded to "data analyst", "BI specialist", "business analyst". This lets the scrapers pick up offers that might otherwise be missed with a direct search.
- Built-in validation rejects phrases that are too long (more than 2 words) or location-dependent.

##### Classic matching (Tag Matcher)

The base algorithm (`jobs/services/tag_matcher.py`), which runs by default in `mode=classic` mode or serves as a fallback for AI:

- Computes a base score from the set intersection of the user's skills and the tags extracted from the job offer.
- Awards +10 bonus points if the offer's work format matches the candidate's preferences.
- Adjusts the score based on experience level: +10 points for an exact match (e.g. middle == middle), or -5 points for a mismatch.

---

#### How Google authorization works

NextStep supports login via Google OAuth 2.0. The user doesn't need to create a password — a Google account is enough.

##### Step 1 — Google Identity Services on the frontend

The login page loads the Google Identity Services library (`accounts.google.id`). On page load, a "Sign in with Google" button is initialized:

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

The user clicks the button → Google opens a popup with an account picker → after choosing an account, Google returns a **JWT credential token** (id_token) signed by Google.

##### Step 2 — Token verification on the backend

The frontend sends the id_token to the backend:

```
POST /api/users/google/
{ "token": "<id_token from Google>" }
```

The backend verifies the token using the `google-auth` library:

```python
idinfo = id_token.verify_oauth2_token(token, google_requests.Request(), CLIENT_ID)
email = idinfo['email']
first_name = idinfo.get('given_name', '')
last_name = idinfo.get('family_name', '')
```

`verify_oauth2_token` checks Google's cryptographic signature, the expiration date, and the `CLIENT_ID` — if anything doesn't match, it raises a `ValueError` and the API returns `400 Bad Request`.

##### Step 3 — Creating or looking up the user

```
Token valid → backend checks whether a user with this email already exists
       ↓
Exists → use that user
       ↓
Doesn't exist → create a new account (username derived from the email prefix, set_unusable_password)
       ↓
Generate JWT (access + refresh) and return the user data
```

A new user created via Google **has no password** — `set_unusable_password()` blocks logging in through the classic email/password form. The account can only be used via Google.

On subsequent Google logins, the token again goes through `verify_oauth2_token` — if the email already exists in the database, the user simply gets new JWT tokens.

##### Step 4 — Frontend stores the tokens

After a `200 OK` response:

```js
localStorage.setItem('access_token', data.access);
localStorage.setItem('refresh_token', data.refresh);
```

From this point on, all API requests go out with the `Authorization: Bearer <access_token>` header — just like with email login.

---

#### Tech stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Frontend | React 18 | SPA with a dynamic UI |
| Styling | CSS (custom) | Custom design system |
| Backend | Django 5 + DRF | REST API + ORM + Auth |
| Database | PostgreSQL 14 | Storing offers and users |
| Task queue | Celery + Redis | Scrapers running in the background |
| Scrapers | BeautifulSoup4 + requests | Fetching offers from websites |
| Authentication | JWT + Google OAuth | Login via email and Google |
| Infrastructure | Docker Compose + Nginx | Local deployment of the whole stack |

#### Project structure

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
│       ├── api/              # Additional API endpoints
│       │   ├── migrations/
│       │   ├── admin.py
│       │   ├── apps.py
│       │   ├── models.py
│       │   ├── serializers.py
│       │   ├── tests.py
│       │   ├── urls.py
│       │   └── views.py
│       ├── base/              # Django settings, Celery
│       │   ├── asgi.py
│       │   ├── celery.py
│       │   ├── settings.py
│       │   ├── urls.py
│       │   └── wsgi.py
│       ├── jobs/               # Job offers, scrapers, Celery tasks
│       │   ├── migrations/
│       │   ├── tests/
│       │   ├── llm/            # AI integration — Factory pattern, LLM providers
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
│       └── users/              # Authentication, profiles, saved offers
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
│   ├── app.jsx              # Main component
│   ├── components.jsx       # Reusable components
│   ├── data.js
│   ├── index.html
│   ├── NextStep.html        # Entry point
│   ├── pages-app.jsx        # Application pages
│   ├── pages-auth.jsx       # Authentication pages
│   └── styles.css           # Global styles
├── docker-compose.yml
├── package.json
└── README.md
```
