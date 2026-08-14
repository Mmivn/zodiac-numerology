"""Shared fixtures for backend tests.

All tests here run against a FakeGateway (no network, no real provider
keys needed, no cost) — mirrors the pattern already used by the repo
root's tests/test_ai_service.py, so both suites stay consistent.
"""
import sys
from pathlib import Path

import pytest
from fastapi.testclient import TestClient

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))  # backend/

from main import app  # noqa: E402

import ai_service  # noqa: E402 — same cached module main.py imported
from all_api.exceptions import AllProvidersFailedError, ConfigurationError  # noqa: E402
from all_api.models import GenerateResult  # noqa: E402


class FakeGateway:
    """Stand-in for AIGateway exposing only what ai_service.ask_ai_detailed calls."""

    def __init__(
        self,
        text="A mocked AI reading, structured with a couple of sections.",
        provider="gemini",
        model="gemini-flash-latest",
        fallback_count=0,
        cached=False,
        used_paid_provider=False,
        raise_error=None,
    ):
        self._text = text
        self._provider = provider
        self._model = model
        self._fallback_count = fallback_count
        self._cached = cached
        self._used_paid_provider = used_paid_provider
        self._raise_error = raise_error
        self.last_kwargs = None
        self.call_count = 0

    def generate(self, prompt, system_prompt=None, **kwargs):
        self.call_count += 1
        self.last_kwargs = {"prompt": prompt, "system_prompt": system_prompt, **kwargs}
        if self._raise_error:
            raise self._raise_error
        return GenerateResult(
            text=self._text,
            provider=self._provider,
            model=self._model,
            latency_ms=1.0,
            cached=self._cached,
            used_paid_provider=self._used_paid_provider,
            # fallback_count is a computed property = len(attempts) - 1;
            # content doesn't matter, only length.
            attempts=["attempt"] * (self._fallback_count + 1),
        )

    def status(self):
        """Mirrors AIGateway.status()'s shape (see GET /health) — never a
        key value, deterministic regardless of ambient .env state."""
        return {
            "providers_configured": ["gemini", "groq", "mistral", "cloudflare", "openai"],
            "provider_order": ["gemini", "groq", "mistral", "cloudflare", "openai"],
            "paid_fallback_enabled": True,
            "daily_paid_budget_usd": 2.0,
            "paid_budget_remaining_usd": 2.0,
        }


@pytest.fixture
def client():
    return TestClient(app)


@pytest.fixture
def fake_gateway(monkeypatch):
    """Default: a successful Gemini response, no fallback. Tests that need
    different behavior (errors, a different provider, fallback_count>0)
    should use fake_gateway_factory instead — monkeypatch reverts
    automatically after each test, so no manual reset is needed here. A
    real AIGateway() is never constructed by any test in this file: every
    scenario (including "no provider configured") uses a FakeGateway, so
    results never depend on ambient .env state."""
    fake = FakeGateway()
    monkeypatch.setattr(ai_service, "_gateway", fake)
    return fake


@pytest.fixture
def fake_gateway_factory(monkeypatch):
    """For tests that need a FakeGateway with non-default behavior (a
    different provider, fallback_count>0, or an error). Deliberately a
    fixture rather than `from tests.conftest import FakeGateway` /
    `from conftest import FakeGateway` in test files: backend/tests/ has
    no __init__.py specifically so it can never collide with the
    repo-root tests/ package (also named "tests") when the whole repo's
    suite is run together — a fixture works regardless of either
    directory's package status, an import statement would not.

    Usage:
        def test_x(client, monkeypatch, fake_gateway_factory):
            fake = fake_gateway_factory(provider="groq", fallback_count=2)
            monkeypatch.setattr(ai_service, "_gateway", fake)
    """
    return FakeGateway


__all__ = ["FakeGateway", "AllProvidersFailedError", "ConfigurationError"]
