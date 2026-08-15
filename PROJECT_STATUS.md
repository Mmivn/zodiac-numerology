# Project Status

**STABLE WORKING VERSION**

Last verified: 2026-08-15

## What's live

- **Frontend (Vercel):** https://zodiac-numerology.vercel.app — Next.js
  16 app, immersive 3D cosmic scene (multi-layer starfield, three
  animated planets incl. a ringed Saturn, glowing orbit rings, scroll
  parallax), premium glass-panel cards.
- **Backend (Render):** https://zodiac-numerology-backend.onrender.com —
  FastAPI, deterministic zodiac/numerology calculations plus AI-narrated
  readings via [ALL_API](https://github.com/Mmivn/ALL_API)'s
  multi-provider gateway (Gemini → Groq → Mistral → Cloudflare Workers
  AI → OpenAI, paid, last resort).
- **Streamlit fallback:** `app.py` / `ui/` at the repo root, kept
  working alongside the Next.js frontend, not replaced by it.

## Verified working (2026-08-15 stabilization pass)

- 3D redesign confirmed live in production: starfield, all three
  planets, orbit rings, and their animations (twinkle, planet rotation,
  scroll parallax) all confirmed actually running, not just present in
  markup.
- AI reading generation confirmed end-to-end against the production
  backend (zodiac "my sign" reading, real provider response).
- Language auto-translation confirmed end-to-end in the live UI: a
  generated EN reading auto-translates on switching to RU and to VI
  (via `POST /translate`, never a second full generation), and
  switching back to a previously-viewed language is instant (cached,
  no network call). A UX gap where the reading briefly vanished with no
  loading indicator during translation was found during this pass and
  fixed (skeleton now shows while translating, same as during the
  initial generation).
- RU / EN / VI all verified working for reading generation and
  translation.
- Mobile verified: stars + the one hero planet + backdrop show; Saturn,
  the moon, the orbit rings, and the constellation are intentionally
  hidden below the `sm` breakpoint; no horizontal overflow.
- Frontend: `npm run lint`, `tsc --noEmit`, `npm run test` (33 tests),
  `npm run build` all pass clean.
- Backend: full `pytest` suite (repo root + `backend/tests/`, 171
  tests) passes clean.
- Secret scan: no real `.env` file tracked or ever committed;
  `.gitignore` covers `.env*`; all tracked `*.env.example` files are
  blank placeholders; no hardcoded API keys/tokens anywhere in tracked
  source; `render.yaml`/`vercel.json` declare config keys with no
  values, consistent with dashboard-managed secrets.

## Known non-blocking notes

- The root-level Streamlit app (`app.py`/`ui/`) was not touched or
  re-verified in this pass — the Next.js frontend + FastAPI backend is
  the actively maintained surface.
- Render's free-tier backend can cold-start on the first request after
  idling; this is expected platform behavior, not an app bug.

## Do not

- Do not treat this file as a changelog — it reflects the state as of
  its "Last verified" date only. Update it (don't append to it) the
  next time a stabilization pass runs.
