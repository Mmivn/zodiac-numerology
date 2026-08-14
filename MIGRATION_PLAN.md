# Migration plan: Streamlit → Next.js + FastAPI

Status: in progress. The Streamlit app (`streamlit_app.py`, `ui/`, `app.py`)
stays untouched and deployed as the working fallback until the new stack is
verified end to end.

## What exists today (audit)

| Concern | Where | Notes |
|---|---|---|
| Zodiac sign calculation | `calculations/zodiac.py` | Pure function, date → sign key. No I/O. |
| Numerology calculation | `calculations/numerology.py` | Pure functions: life path, personal day/month/year. |
| Birth date parsing/validation | `calculations/dates.py` | 3 formats, raises `InvalidDateError` with a `reason` for localized messages. |
| Profile construction | `models.py` | `build_user_profile`/`build_companion_profile` — combine input + derived facts. |
| Consent logic | `ui/common.py` (Streamlit-only) | `st.session_state["consent_given"]`, gated before every `ai_service.ask_ai` call. Being re-implemented as an explicit `consent: bool` request field, enforced server-side in the new backend — not client-trust-only. |
| Language/localization | `locales.py` | `LOCALES["ru"|"en"|"vi"]` — UI strings, AI system instructions, and the exact per-action request text sent to the AI. Reused as-is by the backend. |
| AI prompt generation | `ui/zodiac_tab.py`, `ui/numerology_tab.py` | Builds `facts` (name/sign/numbers/date) + a localized request string per action (`my_sign`, `today`, `month`, `year`, `full_reading`, `compatibility`, `ask_ai`). Reproduced exactly in `backend/main.py`'s reading builders. |
| ALL_API integration | `ai_service.py` | Thin adapter over `all_api.AIGateway` — `ask_ai()`/`translate_text()`. Reused unmodified by the backend (imported directly, not duplicated). |
| Provider fallback order | `ALL_API` package (`git+https://github.com/Mmivn/ALL_API`) | Gemini → Groq → Mistral → Cloudflare Workers AI → OpenAI (last resort), paid-fallback + daily budget gating. Unchanged. |
| Current Streamlit UI | `ui/*.py`, `streamlit_app.py` | Card-grid actions, cached AI-call wrapper, reading-card rendering, consent gate (fixed in a prior commit — inline, unconditional per-panel checkbox). Visual identity (dark cosmic theme, purple/gold) is the reference the new frontend preserves. |

## Target architecture

```
zodiac-numerology/
├── frontend/        Next.js (App Router) + TypeScript — calls backend only, never a provider directly
├── backend/         FastAPI — the ONLY thing that imports ai_service/ALL_API
├── streamlit_app.py  unchanged, stays deployed as fallback
├── calculations/, models.py, locales.py, ai_service.py   unchanged, imported by both
└── ...
```

`backend/` imports the existing root-level `calculations/`, `models.py`,
`locales.py`, `ai_service.py` directly (a `sys.path` bootstrap in
`backend/main.py` adds the repo root) — no business logic is duplicated or
rewritten. The backend is stateless: profile data lives in the browser
(the frontend sends birth date/name/consent with each request); there is no
server-side session, so `POST /profile` is a computation+validation
endpoint (returns the derived sign/numbers), not a database write.

## Consent flow fix (carried over from the Streamlit fix, done properly here)

The backend enforces `consent: bool` on every request that would call the
AI (`/ai-reading`, `/compatibility`) — a request with `consent: false` (or
omitted) never reaches `ai_service`, full stop, and gets a `403` with a
machine-readable reason the frontend uses to show the "why" explanation
inline, right next to the button — never a dead-end error with no way
forward. This is enforcement, not just UI polish: even if the frontend had
a bug, the backend still refuses to call any provider without explicit
consent.

## Endpoints

- `GET /health` — gateway status (configured providers, no keys), safe to
  poll from the frontend.
- `POST /profile` — validate name + birth date, return computed zodiac
  sign / life path number (no AI, no consent needed).
- `POST /zodiac`, `POST /numerology` — deterministic calculations only.
- `POST /ai-reading` — the AI-backed readings (`my_sign`, `today`,
  `month`, `year`, `full_reading`, `life_path`, `ask_ai`), consent-gated.
- `POST /compatibility` — two-person AI compatibility reading, consent-gated.

## Deployment target

- Frontend → Vercel
- Backend → Render or Railway (whichever proves simpler to configure without
  interactive browser auth — see final report)
- Repo stays `Mmivn/zodiac-numerology`, single repo for all three surfaces
