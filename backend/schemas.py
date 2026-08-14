"""Pydantic request/response models for the FastAPI backend.

Kept separate from main.py so the API contract is easy to read/review on
its own. Nothing here touches ai_service/ALL_API or the calculations —
this module only describes shapes and validates input.
"""
from __future__ import annotations

from typing import Literal, Optional

from pydantic import BaseModel, Field

Language = Literal["ru", "en", "vi"]

ZODIAC_KINDS = ("my_sign", "today", "month", "year", "ask_ai")
NUMEROLOGY_KINDS = ("life_path", "today", "month", "year", "full_reading", "ask_ai")


class ErrorResponse(BaseModel):
    detail: str
    reason: Optional[str] = None


# --------------------------------------------------------------------------
# Profile / calculations — deterministic, no AI, no consent required.
# --------------------------------------------------------------------------

class ProfileRequest(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    birth_date: str = Field(
        ..., description="DD.MM.YYYY, DD/MM/YYYY, or YYYY-MM-DD", examples=["20.05.1990"]
    )
    language: Language = "en"


class ProfileResponse(BaseModel):
    name: str
    birth_date: str  # ISO (YYYY-MM-DD)
    language: Language
    zodiac_sign: str
    zodiac_sign_name: str
    life_path_number: int


class ZodiacRequest(BaseModel):
    birth_date: str = Field(..., examples=["20.05.1990"])
    language: Language = "en"


class ZodiacResponse(BaseModel):
    zodiac_sign: str
    zodiac_sign_name: str


class NumerologyRequest(BaseModel):
    birth_date: str = Field(..., examples=["20.05.1990"])
    language: Language = "en"


class NumerologyResponse(BaseModel):
    life_path_number: int
    personal_day_number: int
    personal_month_number: int
    personal_year_number: int


# --------------------------------------------------------------------------
# AI readings — consent-gated.
# --------------------------------------------------------------------------

class AIReadingRequest(BaseModel):
    domain: Literal["zodiac", "numerology"]
    kind: str = Field(..., description="e.g. my_sign, today, month, year, full_reading, ask_ai")
    name: str = Field(..., min_length=1, max_length=100)
    birth_date: str = Field(..., examples=["20.05.1990"])
    language: Language = "en"
    consent: bool = Field(
        ..., description="Must be true — explicit user consent to send name/birth date to the AI."
    )
    question: Optional[str] = Field(
        None, max_length=2000, description="Required when kind == 'ask_ai'."
    )


class AIReadingResponse(BaseModel):
    text: str
    provider: str
    model: str
    fallback_count: int
    cached: bool
    used_paid_provider: bool


class PersonInput(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    birth_date: str = Field(..., examples=["20.05.1990"])


class CompatibilityRequest(BaseModel):
    domain: Literal["zodiac", "numerology"]
    person_a: PersonInput
    person_b: PersonInput
    language: Language = "en"
    consent: bool = Field(
        ..., description="Must be true — explicit user consent to send both people's facts to the AI."
    )


class CompatibilityResponse(BaseModel):
    text: str
    provider: str
    model: str
    fallback_count: int
    cached: bool
    used_paid_provider: bool
    person_a_zodiac_sign: Optional[str] = None
    person_b_zodiac_sign: Optional[str] = None
    person_a_life_path_number: Optional[int] = None
    person_b_life_path_number: Optional[int] = None


# --------------------------------------------------------------------------
# Health
# --------------------------------------------------------------------------

class HealthResponse(BaseModel):
    status: Literal["ok"]
    providers_configured: list[str]
    provider_order: list[str]
    paid_fallback_enabled: bool
