# Zodiac & Numerology AI Assistant

Combines a Python-computed **zodiac sign** and **numerology** engine with
an AI assistant that turns those facts into a friendly, personal read —
in Russian, English, or Vietnamese. Available as a **terminal app** and
as a **Streamlit GUI**, both built on the exact same business logic.

AI calls go through [ALL_API](https://github.com/Mmivn/ALL_API), a
reusable multi-provider gateway with automatic fallback: **Gemini → Groq
→ Mistral → Cloudflare Workers AI → OpenAI** (paid, last resort). A free
provider being down or rate-limited never breaks a reading — the
gateway silently moves to the next one; OpenAI is only ever reached
once every free provider ahead of it has failed.

> **Entertainment disclaimer.** Astrology and numerology are offered here
> as entertainment and a prompt for self-reflection, not as scientifically
> validated ways to predict the future. The app never presents a forecast
> as a guaranteed outcome.

## What it does

You pick a language, fill in a short profile (name + birth date), and
get two **independent** branches:

### ♈ Zodiac
- Your zodiac sign (computed in Python, not by the AI) — plus an
  AI-written characteristic, strengths and possible challenges
- Forecast for today / this month / this year
- Compatibility between two people's zodiac signs
- Free-form questions to the AI about your sign

### 🔢 Numerology
- Life Path Number
- Personal Day / Personal Month / Personal Year numbers
- A full numerology reading (all of the above, plus self-development tips)
- Compatibility between two people's Life Path Numbers
- Free-form questions to the AI about your numerology

**All numbers and signs are computed by plain Python code** in
`calculations/`. The AI is only ever asked to *interpret* facts that
were already decided — it never invents a sign or does the arithmetic
itself.

## Two front ends, one engine

| | Terminal | Streamlit GUI |
|---|---|---|
| Entry point | `app.py` | `streamlit_app.py` |
| Interaction | numbered menus, `input()` | forms, tabs, buttons |
| Run with | `python app.py` | `streamlit run streamlit_app.py` |

Both import the same `calculations/`, `models.py`, `ai_service.py` and
`locales.py` — nothing about a sign, a number, or an AI call is
duplicated between them.

## Languages

Fully supported: **Russian**, **English**, **Tiếng Việt** — menus,
forms, buttons, prompts, error messages, computed-result labels, sign
names, and the instructions sent to the AI.

## Project structure

```
streamlit_app.py             # Streamlit entry point (repo root — Streamlit Cloud main file)
app.py                        # Terminal UI — the only place with input()/print()
ui/
    styles.py                  # CSS for the Streamlit GUI (theme-adaptive)
    common.py                    # Profile/companion forms, cached AI-call wrapper
    zodiac_tab.py                  # ♈ Zodiac branch UI
    numerology_tab.py               # 🔢 Numerology branch UI
calculations/
    dates.py                     # Birth date parsing/validation
    zodiac.py                      # Zodiac sign from a date — pure function
    numerology.py                   # Life Path / Personal Year/Month/Day — pure functions
models.py                            # UserProfile / CompanionProfile dataclasses
ai_service.py                         # Adapter over ALL_API's AIGateway (multi-provider fallback)
locales.py                             # ru/en/vi text, structured for easy extension
tests/                                  # pytest suite (AI calls mocked, no cost)
.streamlit/config.toml                  # Streamlit theme (cosmic/dark)
requirements.txt
runtime.txt                              # pinned Python version (3.12)
.env.example
.gitignore
README.md
```

`calculations/`, `models.py`, `ai_service.py`, and `locales.py` have no
dependency on either UI.

## ALL_API dependency

`requirements.txt` installs [ALL_API](https://github.com/Mmivn/ALL_API)
via a `git+https://` URL pinned to a specific commit, rather than
duplicating any provider code here or depending on a local filesystem
path. To pick up a newer ALL_API version, bump the pinned commit SHA in
`requirements.txt` — no other change needed.

## Setup

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
# then edit .env and fill in the provider keys you actually have
```

`.env` is git-ignored and never printed by the app. It's read by
ALL_API's `Config.from_env()`, not by this project's code directly — see
`.env.example` for the full list of variables (provider keys, model
overrides, `PROVIDER_ORDER`, cost-protection settings). Never commit
`.env` — only `.env.example` (placeholders only) belongs in git. In a
cloud deployment (e.g. Streamlit Community Cloud), the same variable
names are set as platform **secrets** instead of a `.env` file.

## Run

**Terminal:**
```bash
python app.py
```

**Streamlit GUI:**
```bash
streamlit run streamlit_app.py
```
Opens in your browser (defaults to `http://localhost:8501`).

## Tests

```bash
pytest
```

All AI calls are mocked — no network access, no real provider keys
needed, no cost. `tests/test_ai_service_fallback.py` additionally drives
a real `AIGateway`/`FallbackRouter` (with `requests.post` mocked)
through `ai_service.ask_ai`/`translate_text` — the actual call path the
app uses — to verify the free-first fallback chain end to end: a
working provider stops the chain, a failing/rate-limited/timing-out one
falls through to the next, and OpenAI is reached only once Gemini,
Groq, Mistral, and Cloudflare have all failed.

## Deploying to Streamlit Community Cloud

- **Main file path:** `streamlit_app.py`
- **Requirements file:** `requirements.txt` (repo root, auto-discovered)
- **Python version:** 3.12 — also pinned via `runtime.txt`
- **Secrets** (this app's Settings → Secrets):
  `GEMINI_API_KEY`, `GROQ_API_KEY`, `MISTRAL_API_KEY`,
  `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`, `OPENAI_API_KEY` —
  recommended additions: `PROVIDER_ORDER=gemini,groq,mistral,cloudflare,openai`,
  `TRANSLATION_PROVIDER_ORDER=gemini,groq,mistral,cloudflare,openai`,
  `PAID_FALLBACK_ENABLED=true`, `DAILY_PAID_BUDGET_USD=2.00`.
- Do **not** add `CEREBRAS_API_KEY`, `OPENROUTER_API_KEY`, or
  `DEEPSEEK_API_KEY` as secrets — ALL_API's `Config` only reads keys for
  providers actually listed in `PROVIDER_ORDER`, so those three stay
  excluded from automatic routing by construction, not just convention.

This repository is standalone and deployment-ready but has not been
deployed yet.
