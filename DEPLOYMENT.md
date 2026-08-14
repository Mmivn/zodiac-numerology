# Deploying the Next.js + FastAPI stack

Reference for deploying `frontend/` to Vercel and `backend/` to Render.
The Streamlit app (`streamlit_app.py`) deploys and runs completely
independently of this — see the repo's existing Streamlit Cloud setup,
untouched by any of this.

Neither platform can be authenticated or deployed from this environment
(both require an interactive browser login) — this file is the exact
manual steps, prepared so no field has to be guessed.

## Backend — Render

A `render.yaml` Blueprint is committed at the repo root — Render reads it
automatically and pre-fills everything except the secret values below.

1. Go to https://dashboard.render.com → **New** → **Blueprint**.
2. Connect/select the `Mmivn/zodiac-numerology` repo, branch `main`.
   Render detects `render.yaml` and shows the `zodiac-numerology-backend`
   service pre-configured:
   - **Root directory:** `backend`
   - **Runtime:** Python
   - **Build command:** `pip install -r requirements.txt`
   - **Start command:** `uvicorn main:app --host 0.0.0.0 --port $PORT`
   - **Health check path:** `/health`
   - **Python version:** `3.12.8` (via `PYTHON_VERSION` env var)
3. Before/after creating the service, set these **secret** environment
   variables in the Render dashboard (Environment tab) — real values
   only there, never in a file:
   ```
   GEMINI_API_KEY
   GROQ_API_KEY
   MISTRAL_API_KEY
   CLOUDFLARE_API_TOKEN
   CLOUDFLARE_ACCOUNT_ID
   OPENAI_API_KEY
   ```
4. Everything else is already set by `render.yaml`:
   `PROVIDER_ORDER=gemini,groq,mistral,cloudflare,openai`,
   `TRANSLATION_PROVIDER_ORDER` (same), `PAID_FALLBACK_ENABLED=true`,
   `DAILY_PAID_BUDGET_USD=2.00`, `FRONTEND_ORIGIN` (update in step 6).
5. Deploy. Render assigns a URL like
   `https://zodiac-numerology-backend.onrender.com` — copy it, it's
   needed for the frontend's `NEXT_PUBLIC_API_URL` below.
6. Once the frontend is deployed (below) and its real Vercel URL is
   known, come back to this service's **Environment** tab and set
   `FRONTEND_ORIGIN` to that exact URL (comma-separate if you keep
   `http://localhost:3000` too, for local-frontend-against-prod-backend
   testing) — this is what CORS actually checks; nothing works cross-origin
   until this matches.

## Frontend — Vercel

> **If the deployed site returns `404 NOT_FOUND` on every route**, this is
> almost always **Root Directory not set to `frontend`** — this is a
> monorepo (backend/ and frontend/ both at the repo root, no
> package.json at the repo root itself), so unless Root Directory is set
> explicitly, Vercel tries to build from the repo root, finds no Next.js
> app there, and the deployment serves nothing. `frontend/vercel.json`
> now pins `framework: "nextjs"` explicitly (removes one failure mode),
> but **Root Directory itself is a Project Settings field Vercel does
> not expose via any committed file** — it must be set by hand, once,
> in the dashboard:
> Project → **Settings → General → Root Directory → Edit → `frontend`**
> → Save, then **Deployments → ⋯ → Redeploy** (unchecking any build
> cache) on the latest deployment.

1. Go to https://vercel.com/new and import `Mmivn/zodiac-numerology`.
2. In the import screen (or Project Settings → General afterward):
   - **Root Directory:** `frontend` — **do not leave this at the repo root**
   - **Framework Preset:** Next.js (auto-detected once Root Directory is
     set correctly; `frontend/vercel.json` also pins it explicitly)
   - **Build Command:** `next build` (default — leave as-is)
   - **Output Directory:** leave at the framework default — do **not**
     manually set this to `.next`; Vercel's Next.js builder has its own
     internal convention and a manual override here is a common cause of
     broken deployments
   - **Install Command:** `npm install` (default — leave as-is)
   - **Node.js Version:** 20.x or later (Project Settings → General →
     Node.js Version — Next.js 16 requires Node ≥20.9)
3. **Environment Variables** (Project Settings → Environment Variables),
   for the Production environment:
   ```
   NEXT_PUBLIC_API_URL = https://zodiac-numerology-backend.onrender.com
   ```
   (use the real Render URL from backend step 5 — this becomes part of
   the client JS bundle, which is fine: it's a URL, not a secret. Never
   put a provider API key in a `NEXT_PUBLIC_*` variable — the frontend
   must never hold one.)
4. Deploy. Vercel assigns a URL like
   `https://zodiac-numerology.vercel.app` (exact subdomain depends on
   availability/Vercel's naming — confirm the real one after deploying).
5. Go back to the Render backend's `FRONTEND_ORIGIN` (step 6 above) and
   set it to this exact URL.

## Verifying after both are live

```bash
curl https://zodiac-numerology-backend.onrender.com/health
```
Then open the Vercel URL, complete the profile form, give consent, and
request a reading — confirms frontend → backend → ALL_API → a real
provider end to end. See the final report for what was already verified
locally with this exact request/response shape.

## Local development recap (not a public URL)

```bash
# backend, from the repo root:
uvicorn backend.main:app --reload --port 8000

# frontend, in another terminal:
cd frontend && npm run dev
```
`frontend/.env.local` already points `NEXT_PUBLIC_API_URL` at
`http://localhost:8000` for this.
