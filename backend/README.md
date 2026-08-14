# Zodiac & Numerology — backend

FastAPI. The only service allowed to talk to `ai_service`/ALL_API — see
`../MIGRATION_PLAN.md` for the full architecture and `../DEPLOYMENT.md`
for deploying this to Render.

Imports `calculations/`, `models.py`, `locales.py`, and `ai_service.py`
directly from the repo root (a `sys.path` bootstrap in `main.py`) rather
than duplicating any business logic — the exact same modules
`streamlit_app.py` uses.

## Local development

```bash
cp .env.example .env   # or just reuse the repo-root .env — see the comment
                        # at the top of .env.example for why either works
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```
Or from the repo root: `uvicorn backend.main:app --reload --port 8000`.
Interactive API docs at `http://localhost:8000/docs` once running.

## Endpoints

| Method | Path            | Needs consent? | Calls the AI? |
|---|---|---|---|
| GET  | `/health`         | no | no |
| POST | `/profile`         | no | no |
| POST | `/zodiac`           | no | no |
| POST | `/numerology`        | no | no |
| POST | `/ai-reading`         | **yes** | yes |
| POST | `/compatibility`       | **yes** | yes |

`/ai-reading` and `/compatibility` return `consent: false`/omitted as a
`403` and never call `ai_service` — see `main.py`'s `_require_consent`.

## Tests

```bash
pytest tests   # or just `pytest` from the repo root — runs this suite too
```
All AI calls are mocked (`tests/conftest.py`'s `FakeGateway`) — no
network, no real provider keys, no cost.
