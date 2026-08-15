"""FastAPI backend for Zodiac & Numerology.

The only service allowed to talk to ai_service/ALL_API — the frontend
(and any other client) only ever calls this API, never a provider
directly, and never sees a provider key.

Deterministic calculations (calculations/, models.py) and AI-facing
business logic (which facts + which localized request text go into each
reading — mirrors ui/zodiac_tab.py and ui/numerology_tab.py exactly) are
imported unmodified from the repo root, not duplicated here. This module
is stateless: there is no server-side session, so the frontend sends
name/birth date/language/consent with every request that needs them.

Run locally (from the repo root):
    uvicorn backend.main:app --reload --port 8000
or (from backend/):
    uvicorn main:app --reload --port 8000
Both work — the sys.path bootstrap below finds the repo root either way.
"""
from __future__ import annotations

import os
import sys
from datetime import date
from pathlib import Path

# Make both this directory (schemas.py) and the repo-root modules
# (calculations/, models.py, locales.py, ai_service.py) importable
# regardless of the process's cwd or how uvicorn was invoked — this is
# what lets the backend reuse them without copying a single line of
# business logic. Both directories are needed: `uvicorn backend.main:app`
# from the repo root only puts the repo root on sys.path (backend/ is
# reached as a namespace package, not flatly importable from), while
# `uvicorn main:app` from inside backend/ only puts backend/ on sys.path
# — either invocation style needs the other directory added explicitly.
_BACKEND_DIR = Path(__file__).resolve().parent
_REPO_ROOT = _BACKEND_DIR.parent
for _path in (_REPO_ROOT, _BACKEND_DIR):
    if str(_path) not in sys.path:
        sys.path.insert(0, str(_path))

from fastapi import FastAPI, HTTPException  # noqa: E402
from fastapi.middleware.cors import CORSMiddleware  # noqa: E402

import ai_service  # noqa: E402
from calculations.dates import InvalidDateError, parse_birth_date  # noqa: E402
from calculations.numerology import (  # noqa: E402
    personal_day_number,
    personal_month_number,
    personal_year_number,
)
from locales import LOCALES  # noqa: E402
from models import build_companion_profile, build_user_profile  # noqa: E402

from schemas import (  # noqa: E402
    AIReadingRequest,
    AIReadingResponse,
    CompatibilityRequest,
    CompatibilityResponse,
    HealthResponse,
    NUMEROLOGY_KINDS,
    NumerologyRequest,
    NumerologyResponse,
    ProfileRequest,
    ProfileResponse,
    TranslateRequest,
    ZODIAC_KINDS,
    ZodiacRequest,
    ZodiacResponse,
)

# English names ai_service.translate_text_detailed/AIGateway.translate expect
# for their target-language prompt — mirrors ui/common.py's
# _TRANSLATION_LANGUAGE_NAMES so both front ends translate identically.
_TRANSLATION_LANGUAGE_NAMES = {"ru": "Russian", "en": "English", "vi": "Vietnamese"}

DATE_REASON_TO_DETAIL = {
    "unparseable": "Could not parse the birth date. Use DD.MM.YYYY, DD/MM/YYYY, or YYYY-MM-DD.",
    "future_date": "Birth date cannot be in the future.",
    "too_old": "That birth date is not realistic.",
}


def _frontend_origins() -> list[str]:
    """Comma-separated list from FRONTEND_ORIGIN, e.g.
    "http://localhost:3000,https://zodiac-numerology.vercel.app". Falls
    back to the local Next.js dev server so `npm run dev` + this backend
    work together with zero configuration."""
    raw = os.environ.get("FRONTEND_ORIGIN", "http://localhost:3000")
    return [origin.strip() for origin in raw.split(",") if origin.strip()]


app = FastAPI(
    title="Zodiac & Numerology API",
    description=(
        "Deterministic zodiac/numerology calculations plus AI-narrated "
        "readings via ALL_API's multi-provider gateway (Gemini -> Groq -> "
        "Mistral -> Cloudflare Workers AI -> OpenAI last resort)."
    ),
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=_frontend_origins(),
    allow_credentials=False,
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)


def _parse_birth_date_or_422(raw: str) -> date:
    try:
        return parse_birth_date(raw)
    except InvalidDateError as error:
        raise HTTPException(
            status_code=422,
            detail=DATE_REASON_TO_DETAIL.get(error.reason, "Invalid birth date."),
        ) from error


def _locale(language: str) -> dict:
    return LOCALES[language]


def _run_ai_call(instructions: str, message: str) -> AIReadingResponse:
    """Call ai_service, mapping every failure mode to a clean HTTP error —
    never lets a raw provider/network exception reach the client."""
    try:
        result = ai_service.ask_ai_detailed(instructions, message)
    except ai_service.MissingAPIKeyError as error:
        raise HTTPException(status_code=503, detail="AI service is not configured.") from error
    except ai_service.EmptyResponseError as error:
        raise HTTPException(status_code=502, detail="The AI returned an empty response.") from error
    except ai_service.AIServiceError as error:
        raise HTTPException(status_code=502, detail=f"AI request failed: {error}") from error

    return AIReadingResponse(
        text=result.text,
        provider=result.provider,
        model=result.model,
        fallback_count=result.fallback_count,
        cached=result.cached,
        used_paid_provider=result.used_paid_provider,
    )


def _require_consent(consent: bool) -> None:
    if not consent:
        raise HTTPException(
            status_code=403,
            detail=(
                "Consent is required before any data is sent to the AI. "
                "Set consent=true after the user explicitly opts in."
            ),
        )


# --------------------------------------------------------------------------
# Health
# --------------------------------------------------------------------------

@app.get("/health", response_model=HealthResponse)
def health() -> HealthResponse:
    status = ai_service.gateway_status()
    return HealthResponse(
        status="ok",
        providers_configured=status["providers_configured"],
        provider_order=status["provider_order"],
        paid_fallback_enabled=status["paid_fallback_enabled"],
    )


# --------------------------------------------------------------------------
# Profile / deterministic calculations — no AI, no consent required.
# --------------------------------------------------------------------------

@app.post("/profile", response_model=ProfileResponse)
def create_profile(payload: ProfileRequest) -> ProfileResponse:
    name = payload.name.strip()
    if not name:
        raise HTTPException(status_code=422, detail="Name must not be empty.")

    birth_date = _parse_birth_date_or_422(payload.birth_date)
    profile = build_user_profile(name, birth_date, payload.language)
    sign_name = _locale(payload.language)["zodiac"]["sign_names"][profile.zodiac_sign]

    return ProfileResponse(
        name=profile.name,
        birth_date=profile.birth_date.isoformat(),
        language=payload.language,
        zodiac_sign=profile.zodiac_sign,
        zodiac_sign_name=sign_name,
        life_path_number=profile.life_path_number,
    )


@app.post("/zodiac", response_model=ZodiacResponse)
def compute_zodiac(payload: ZodiacRequest) -> ZodiacResponse:
    birth_date = _parse_birth_date_or_422(payload.birth_date)
    profile = build_user_profile("_", birth_date, payload.language)
    sign_name = _locale(payload.language)["zodiac"]["sign_names"][profile.zodiac_sign]
    return ZodiacResponse(zodiac_sign=profile.zodiac_sign, zodiac_sign_name=sign_name)


@app.post("/numerology", response_model=NumerologyResponse)
def compute_numerology(payload: NumerologyRequest) -> NumerologyResponse:
    birth_date = _parse_birth_date_or_422(payload.birth_date)
    today = date.today()
    profile = build_user_profile("_", birth_date, payload.language)
    return NumerologyResponse(
        life_path_number=profile.life_path_number,
        personal_day_number=personal_day_number(birth_date, today),
        personal_month_number=personal_month_number(birth_date, today),
        personal_year_number=personal_year_number(birth_date, today),
    )


# --------------------------------------------------------------------------
# AI readings — consent-gated. Facts/request text mirror
# ui/zodiac_tab.py + ui/numerology_tab.py exactly, so the AI sees the same
# prompts it always has.
# --------------------------------------------------------------------------

def _format_facts(pairs) -> str:
    return "\n".join(f"{label}: {value}" for label, value in pairs)


def _build_zodiac_reading(payload: AIReadingRequest, t: dict, birth_date: date):
    zt = t["zodiac"]
    profile = build_user_profile(payload.name, birth_date, payload.language)
    sign_name = zt["sign_names"][profile.zodiac_sign]
    today = date.today()

    if payload.kind == "my_sign":
        facts = _format_facts([("Name", profile.name), ("Zodiac sign", sign_name)])
        message = facts + "\n\n" + zt["requests"]["my_sign"]
    elif payload.kind in ("today", "month", "year"):
        facts = _format_facts(
            [
                ("Name", profile.name),
                ("Birth date", profile.birth_date.isoformat()),
                ("Zodiac sign", sign_name),
                ("Today", today.isoformat()),
                ("Requested period", payload.kind),
            ]
        )
        message = facts + "\n\n" + zt["requests"][payload.kind]
    elif payload.kind == "ask_ai":
        question = (payload.question or "").strip()
        if not question:
            raise HTTPException(status_code=422, detail="question is required for kind='ask_ai'.")
        facts = _format_facts([("Name", profile.name), ("Zodiac sign", sign_name)])
        message = facts + "\n\n" + question
    else:
        raise HTTPException(
            status_code=422, detail=f"Unknown zodiac kind '{payload.kind}'. Valid: {ZODIAC_KINDS}"
        )

    return zt["instructions"], message


def _build_numerology_reading(payload: AIReadingRequest, t: dict, birth_date: date):
    nt = t["numerology"]
    profile = build_user_profile(payload.name, birth_date, payload.language)
    today = date.today()

    if payload.kind == "life_path":
        facts = _format_facts(
            [("Name", profile.name), ("Life Path Number", profile.life_path_number)]
        )
        message = facts + "\n\n" + nt["requests"]["life_path"]
    elif payload.kind in ("today", "month", "year"):
        number_fn = {
            "today": personal_day_number,
            "month": personal_month_number,
            "year": personal_year_number,
        }[payload.kind]
        number = number_fn(birth_date, today)
        facts = _format_facts(
            [
                ("Name", profile.name),
                ("Birth date", profile.birth_date.isoformat()),
                ("Today", today.isoformat()),
                (f"Computed {payload.kind} number", number),
            ]
        )
        message = facts + "\n\n" + nt["requests"][payload.kind]
    elif payload.kind == "full_reading":
        personal_year = personal_year_number(birth_date, today)
        personal_month = personal_month_number(birth_date, today)
        personal_day = personal_day_number(birth_date, today)
        facts = _format_facts(
            [
                ("Name", profile.name),
                ("Birth date", profile.birth_date.isoformat()),
                ("Today", today.isoformat()),
                ("Life Path Number", profile.life_path_number),
                ("Personal Year Number", personal_year),
                ("Personal Month Number", personal_month),
                ("Personal Day Number", personal_day),
            ]
        )
        message = facts + "\n\n" + nt["requests"]["full_reading"]
    elif payload.kind == "ask_ai":
        question = (payload.question or "").strip()
        if not question:
            raise HTTPException(status_code=422, detail="question is required for kind='ask_ai'.")
        facts = _format_facts(
            [("Name", profile.name), ("Life Path Number", profile.life_path_number)]
        )
        message = facts + "\n\n" + question
    else:
        raise HTTPException(
            status_code=422,
            detail=f"Unknown numerology kind '{payload.kind}'. Valid: {NUMEROLOGY_KINDS}",
        )

    return nt["instructions"], message


@app.post("/ai-reading", response_model=AIReadingResponse)
def ai_reading(payload: AIReadingRequest) -> AIReadingResponse:
    _require_consent(payload.consent)

    name = payload.name.strip()
    if not name:
        raise HTTPException(status_code=422, detail="Name must not be empty.")

    birth_date = _parse_birth_date_or_422(payload.birth_date)
    t = _locale(payload.language)

    if payload.domain == "zodiac":
        instructions, message = _build_zodiac_reading(payload, t, birth_date)
    elif payload.domain == "numerology":
        instructions, message = _build_numerology_reading(payload, t, birth_date)
    else:  # pragma: no cover — Literal type already restricts this
        raise HTTPException(status_code=422, detail=f"Unknown domain '{payload.domain}'.")

    return _run_ai_call(instructions, message)


# --------------------------------------------------------------------------
# Translate — consent-gated. Turns an already-generated reading into
# another supported language via a cheap translation pass (never the
# full, expensive reading generation) — see schemas.TranslateRequest.
# Used by the frontend so switching the UI language while a reading is
# on screen updates it automatically instead of requiring another click.
# --------------------------------------------------------------------------

@app.post("/translate", response_model=AIReadingResponse)
def translate(payload: TranslateRequest) -> AIReadingResponse:
    _require_consent(payload.consent)

    text = payload.text.strip()
    if not text:
        raise HTTPException(status_code=422, detail="text must not be empty.")

    language_name = _TRANSLATION_LANGUAGE_NAMES[payload.language]
    try:
        result = ai_service.translate_text_detailed(text, language_name)
    except ai_service.MissingAPIKeyError as error:
        raise HTTPException(status_code=503, detail="AI service is not configured.") from error
    except ai_service.EmptyResponseError as error:
        raise HTTPException(status_code=502, detail="The AI returned an empty response.") from error
    except ai_service.AIServiceError as error:
        raise HTTPException(status_code=502, detail=f"AI request failed: {error}") from error

    return AIReadingResponse(
        text=result.text,
        provider=result.provider,
        model=result.model,
        fallback_count=result.fallback_count,
        cached=result.cached,
        used_paid_provider=result.used_paid_provider,
    )


# --------------------------------------------------------------------------
# Compatibility — consent-gated, two-person reading.
# --------------------------------------------------------------------------

@app.post("/compatibility", response_model=CompatibilityResponse)
def compatibility(payload: CompatibilityRequest) -> CompatibilityResponse:
    _require_consent(payload.consent)

    name_a = payload.person_a.name.strip()
    name_b = payload.person_b.name.strip()
    if not name_a or not name_b:
        raise HTTPException(status_code=422, detail="Both people's names are required.")

    birth_date_a = _parse_birth_date_or_422(payload.person_a.birth_date)
    birth_date_b = _parse_birth_date_or_422(payload.person_b.birth_date)
    t = _locale(payload.language)

    profile_a = build_user_profile(name_a, birth_date_a, payload.language)
    companion_b = build_companion_profile(name_b, birth_date_b)

    if payload.domain == "zodiac":
        zt = t["zodiac"]
        sign_a = zt["sign_names"][profile_a.zodiac_sign]
        sign_b = zt["sign_names"][companion_b.zodiac_sign]
        facts = _format_facts(
            [
                ("Person A name", profile_a.name),
                ("Person A zodiac sign", sign_a),
                ("Person B name", companion_b.name),
                ("Person B zodiac sign", sign_b),
            ]
        )
        message = facts + "\n\n" + zt["requests"]["compatibility"]
        instructions = zt["instructions"]
    elif payload.domain == "numerology":
        nt = t["numerology"]
        facts = _format_facts(
            [
                ("Person A name", profile_a.name),
                ("Person A Life Path Number", profile_a.life_path_number),
                ("Person B name", companion_b.name),
                ("Person B Life Path Number", companion_b.life_path_number),
            ]
        )
        message = facts + "\n\n" + nt["requests"]["compatibility"]
        instructions = nt["instructions"]
    else:  # pragma: no cover
        raise HTTPException(status_code=422, detail=f"Unknown domain '{payload.domain}'.")

    ai_result = _run_ai_call(instructions, message)
    return CompatibilityResponse(
        **ai_result.model_dump(),
        person_a_zodiac_sign=profile_a.zodiac_sign if payload.domain == "zodiac" else None,
        person_b_zodiac_sign=companion_b.zodiac_sign if payload.domain == "zodiac" else None,
        person_a_life_path_number=profile_a.life_path_number if payload.domain == "numerology" else None,
        person_b_life_path_number=companion_b.life_path_number if payload.domain == "numerology" else None,
    )
