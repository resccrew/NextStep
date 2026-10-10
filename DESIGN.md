# NextStep — Design System & Screens

AI job search for IT specialists in Poland. Interface language: **Polish**.

Files in this package:

| File | What it is |
|---|---|
| `NextStep Landing v3.dc.html` | Marketing landing page (bold "Steps" style) |
| `NextStep App v4.dc.html` | Clickable app prototype (calm product UI, light + dark) |
| `frontend/assets/logo.svg` | Logo |
| `support.js` | Runtime needed to open the `.dc.html` files in a browser |

Open the `.dc.html` files directly in a browser. Keep `support.js` and `frontend/assets/` next to them.

---

## 1. Brand

- **Idea:** "Zrób swój next step." Career progress shown as a **staircase** of 4 steps that rise left to right.
- **Brand motif:** the staircase appears in the landing hero, the "Dla kogo" section, the final CTA, the login panel, and the profile progress.
- **Tone of copy:** short, direct, second person ("Twój profil", "Zapisz"). No hype words.

## 2. Color

### Brand (landing, login, accents)
| Token | Hex | Use |
|---|---|---|
| Mint | `#96FF99` | Brand color, hero background, primary CTA on landing, "Rekomendacje" button |
| Mint soft | `#D6FFD8` | Step 1 tile, soft fills |
| Green | `#2DBE49` | Step 3 tile, live dots, progress bars, "NOWA" badge |
| Ink | `#0B1F12` | Text and borders on mint, dark sections, step 4 tile |
| Off-white | `#F7FAF5` | Landing section background |

### Product UI — light theme
| Token | Hex |
|---|---|
| `--bg` | `#F6F8F6` |
| `--surface` | `#FFFFFF` |
| `--surface2` | `#F1F5F2` (hover, subtle fills) |
| `--ink` | `#0F1A13` |
| `--muted` | `#5B6B60` |
| `--line` | `#E1E7E2` |
| `--mintSoft` | `#E3FAE4` (selected chip, match pill bg) |
| `--accentInk` | `#157A2E` (green text: match %, links) |
| `--invert` / `--onInvert` | `#0F1A13` / `#FFFFFF` (primary buttons) |

### Product UI — dark theme
| Token | Hex |
|---|---|
| `--bg` | `#121413` |
| `--surface` | `#1A1D1B` |
| `--surface2` | `#232725` |
| `--ink` | `#F3F5F4` |
| `--muted` | `#B7BFBA` |
| `--line` | `#343A37` |
| `--mintSoft` | `rgba(150,255,153,0.13)` |
| `--accentInk` | `#8EF293` |
| `--invert` / `--onInvert` | `#F3F5F4` / `#121413` |

Dark theme uses neutral graphite (not green-black) for readability. Mint is only an accent, never a large fill.

### Application status colors
| Status | Color |
|---|---|
| Zapisana | `#9AA59E` |
| Wysłana | `#5B8DEF` |
| Rozmowa | `#E3A93B` |
| Oferta | `#2DBE49` |
| Odrzucona | `#D9534F` |

Statuses are always shown as **dot + text label**, never by color alone.

## 3. Typography

| Role | Font | Notes |
|---|---|---|
| Display / headings | **Bricolage Grotesque** 700 (landing up to 800) | Tight letter-spacing (−0.025 to −0.055em) |
| Body / UI | **Geist** 400–700 | 14px base in app, 16px on landing |
| Labels / meta | **Geist Mono** 400–500 | Small labels on landing (`[ 01 — JAK TO DZIAŁA ]`), keyboard hints |

Scale in the app: page title 30px · section title 16–20px · body 14px · meta 12–13px.
Landing: hero `clamp(64px, 9.4vw, 136px)`, section titles `clamp(40px, 5vw, 68px)`.

## 4. Shape & elevation

- **Landing:** 2px ink borders, square-ish tiles, radius 12–16px, hard offset shadow `10px 10px 0 #0B1F12` on featured cards, 64px grid lines on mint backgrounds.
- **App:** 1px `--line` borders, radius 8–14px, no hard shadows. Hover = `--surface2` background or subtle `0 4px 16px rgba(0,0,0,.08)`. Menus/popovers: `0 12px 32px rgba(0,0,0,.14)`.

## 5. Components (app)

- **Match pill:** 50px wide, % in bold. ≥80% → mint-soft bg + accent ink; below → surface2 + muted.
- **Job row:** match pill · title + badges (NOWA / WYSOKIE ZAROBKI / MAŁO APLIKACJI) · company · city · format · salary · skill line ("✓ React, TypeScript · brak: Figma") · posted · Zapisz / status · × hide. Compact view hides the skill line.
- **Chips (filters):** pill, 1px border; selected = mint-soft + accent-ink border. Show result count inside the chip.
- **Segmented control:** 3px padded track, active item = surface + small shadow.
- **Tabs:** text + count, active = 2px ink underline.
- **Toast:** inverted, bottom center, with optional **Cofnij** (undo) action for every destructive or status change.
- **Toggle:** 40×22, green when on.

## 6. Information architecture (app v4)

Sidebar: **Home · Oferty · Aplikacje · Profil · Ustawienia** + mint **▶ Rekomendacje** button + profile completeness + user/theme.
After login the user lands on **Oferty**.

### Home
Greeting and date; 4 clickable stats (Nowe dopasowania, Wysłane, Rozmowy, Oferty); **Do zrobienia** (auto-generated next actions); top 3 new offers; profile card (role, level, format, salary, skills, completeness); saved searches.

### Oferty (main screen)
1. Live status line + **"Dziś N nowych ofert · M z dopasowaniem 80%+"**.
2. Buttons **Przeglądaj nowe (N)** and **▶ Rekomendacje**.
3. Search with suggestions (roles, skills, cities, saved and popular queries) + mode switch **Dopasowanie AI / Słowa kluczowe** with a one-line explanation of the difference.
4. Collections tabs with counts: Dla Ciebie · Nowe · Remote · Wysokie zarobki · Bez doświadczenia.
5. Filter chips with counts (format, min. match), view toggle (Szczegóły / Kompakt), sort (Dopasowanie / Najnowsze).
6. Active filters as removable chips + **Zapisz jako alert**.
7. Sticky banner **"↑ N nowe oferty — pokaż"** when new jobs arrive.
8. Grouped feed: "Nowe — ostatnie 3 godziny" first; with sort Najnowsze: Dziś / Wczoraj / Ten tydzień / Wcześniej. Infinite scroll, viewed jobs dimmed, × hides with undo, end-of-list state with alert CTA.

### Rekomendacje (full-screen feed)
TikTok-style vertical feed, one job per screen, scroll-snap, practically infinite (loads more as you scroll). Learns from saved/applied jobs.
Card: reason chip, big match %, title, company/city/format/posted, salary, skills you have / missing, why text, badges.
Actions rail: **Zapisz · Nie dla mnie · Szczegóły · Aplikuj**. Keys: ↑/↓, S, H, Enter, Esc.
Tab **Nowe (N)** = finite triage of new jobs ending with "Wszystkie nowe przejrzane".

### Oferta (job page)
Back link to source list, "N z M" counter and **‹ / Następna ›** to step through the same list. Main: header with chips, "Dlaczego X% dopasowania" with skill coverage bar and per-skill rows, description, similar offers. Sticky side card: match %, **Aplikuj na praca.pl** (mint primary), status picker.

### Aplikacje
One pipeline: tabs Wszystkie · Zapisane · Wysłane · Rozmowa · Oferta · Odrzucone (with counts). Table: Oferta · Dopas. · Status (inline dropdown) · Zmiana.

### Profil
Completeness checklist (single source of truth), inline editing: Stanowisko, Poziom (segmented), Umiejętności (remove ×, suggestions "Często w Twoich ofertach"), Format pracy, Wynagrodzenie (slider). Changes save instantly and recompute match.

### Ustawienia
Saved searches with per-search notification toggle, notification threshold, theme, e-mail digest, account, logout.

### Logowanie / Onboarding
Split screen: mint brand panel with staircase + form (Google / e-mail). Onboarding: 3 steps (stanowisko+poziom → umiejętności, min. 3 → format+wynagrodzenie), progress bar, Skip.

## 7. Landing (v3) structure

1. **Hero** (mint, grid): `[ AI · PRACA W IT · POLSKA ]`, "Zrób swój next step.", CTA "Zacznij za darmo" / "Jak to działa", animated staircase 01 Profil → 04 Oferty 90% bleeding to the right edge.
2. **Facts strip** (ink): 3 kroki · 0–100% · 4 poziomy · 1 klik.
3. **Jak to działa:** 3 bordered steps with mini UI.
4. **Dopasowanie AI:** dark text card + mint card with job example (hard shadow).
5. **Źródła:** praca.pl active + placeholder slots "Wkrótce".
6. **Dla kogo:** staircase Junior → Mid → Senior → Lead.
7. **Opinie:** 3 quotes (placeholders — replace with real ones).
8. **FAQ:** accordion.
9. **Final CTA** (mint) with labeled staircase, then footer (ink).

## 8. Interaction rules

- Every status change / hide → toast with **Cofnij**.
- Never show an empty filter result: counts are visible before clicking.
- Match % always comes with a reason ("Pokrywa się: …, Brakuje: …").
- Primary action per screen is unique (mint or inverted button).
- Minimum text contrast 4.5:1 in both themes.

## 9. Mapping to the repo

The app lives in `frontend/app.html`; the landing is the site root `frontend/index.html`.


| Screen | Repo source |
|---|---|
| Landing | `frontend/index.html` (dc runtime `frontend/support.js`) |
| Logowanie, Onboarding | `frontend/pages-auth.jsx` |
| Home, Oferty, Aplikacje (Saved), Profil, Ustawienia | `frontend/pages-app.jsx`, `frontend/app.jsx` |
| Job page, Sidebar, Toast | `frontend/components.jsx` |
| Tokens | replace `frontend/styles.css` `:root` / `[data-theme="dark"]` with section 2 |
