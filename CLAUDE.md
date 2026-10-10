# NextStep

AI job search for IT specialists in Poland. Django REST API (`backend/`) + static React frontend without a build step (`frontend/`, React UMD + Babel standalone).

## Design
- `DESIGN.md` is the single source of truth for the design: colors, fonts, components, screens, interaction rules. Read it before any UI change and keep it updated when the design changes.
- Interface language: Polish.

## Frontend
- `frontend/index.html`: landing page (dc runtime `support.js`).
- `frontend/app.html`: the app (`components.jsx`, `pages-auth.jsx`, `pages-app.jsx`, `app.jsx`, `styles.css`).
- API: `http://localhost:8000/api/...`.

## Rules
- Branches: `feat/...`, `fix/...`.
- Never commit `.env` or secrets.
