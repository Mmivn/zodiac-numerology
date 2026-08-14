# Zodiac & Numerology — frontend

Next.js (App Router) + TypeScript + Tailwind v4. Talks only to the
FastAPI backend in `../backend` — never to Gemini/Groq/Mistral/
Cloudflare/OpenAI/ALL_API directly, and never sees a provider key. See
`../MIGRATION_PLAN.md` for the full architecture and `../DEPLOYMENT.md`
for deploying this to Vercel.

## Local development

```bash
cp .env.example .env.local   # NEXT_PUBLIC_API_URL, defaults to localhost:8000
npm install
npm run dev
```
Requires the backend running too — see `../backend/README.md` (or just
`uvicorn backend.main:app --reload --port 8000` from the repo root).

## Structure

```
app/            Next.js App Router: layout.tsx, page.tsx (the whole app
                  is one client-rendered page — profile, tabs, panels),
                  globals.css (cosmic dark theme, matches
                  ../.streamlit/config.toml's palette 1:1)
components/     ProfileForm, Hero, ActionGrid, AIPanel, AskAiPanel,
                  CompatibilityPanel, ConsentGate, ReadingCard,
                  LanguageSelector, Disclaimer
lib/
  api.ts          the ONLY module that calls the backend
  i18n.ts          ru/en/vi UI copy (carried over from ../locales.py)
  storage.ts        client-side profile/consent/language persistence
  types.ts           mirrors backend/schemas.py
tests/           Vitest + Testing Library
```

## Tests

```bash
npm test
```

## Build

```bash
npm run build
npm run lint
```
