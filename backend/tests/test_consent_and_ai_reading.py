"""POST /ai-reading — consent enforcement plus the AI call path itself.
Every AI call here goes through the FakeGateway (see conftest.py); no
network, no real provider keys, no cost."""
import ai_service
from all_api.exceptions import AllProvidersFailedError, ConfigurationError


def _base_payload(**overrides):
    payload = {
        "domain": "zodiac",
        "kind": "my_sign",
        "name": "Anna",
        "birth_date": "20.05.1990",
        "language": "en",
        "consent": True,
    }
    payload.update(overrides)
    return payload


# --------------------------------------------------------------------------
# Consent enforcement — must be checked BEFORE any AI call is attempted.
# --------------------------------------------------------------------------

def test_consent_false_is_rejected_and_ai_is_never_called(client, fake_gateway):
    response = client.post("/ai-reading", json=_base_payload(consent=False))
    assert response.status_code == 403
    assert "consent" in response.json()["detail"].lower()
    assert fake_gateway.call_count == 0


def test_consent_omitted_is_rejected(client, fake_gateway):
    payload = _base_payload()
    del payload["consent"]
    response = client.post("/ai-reading", json=payload)
    # Missing a required bool field is itself a validation error (422),
    # not a silent default to False that reaches the handler — either way
    # the AI must never be called.
    assert response.status_code in (422, 403)
    assert fake_gateway.call_count == 0


def test_consent_true_allows_the_ai_call(client, fake_gateway):
    response = client.post("/ai-reading", json=_base_payload(consent=True))
    assert response.status_code == 200
    assert fake_gateway.call_count == 1


# --------------------------------------------------------------------------
# The AI call itself — provider/model/fallback metadata surfaced correctly.
# --------------------------------------------------------------------------

def test_ai_reading_reports_provider_and_model(client, fake_gateway):
    response = client.post("/ai-reading", json=_base_payload())
    assert response.status_code == 200
    body = response.json()
    assert body["provider"] == "gemini"
    assert body["model"] == "gemini-flash-latest"
    assert body["fallback_count"] == 0
    assert body["used_paid_provider"] is False
    assert body["text"]


def test_ai_reading_reports_fallback_count_when_earlier_providers_failed(
    client, monkeypatch, fake_gateway_factory
):
    fake = fake_gateway_factory(provider="groq", model="openai/gpt-oss-20b", fallback_count=2)
    monkeypatch.setattr(ai_service, "_gateway", fake)

    response = client.post("/ai-reading", json=_base_payload())
    assert response.status_code == 200
    body = response.json()
    assert body["provider"] == "groq"
    assert body["fallback_count"] == 2


def test_ai_reading_sends_the_expected_facts_and_instructions(client, fake_gateway):
    client.post("/ai-reading", json=_base_payload(kind="my_sign"))
    assert "Anna" in fake_gateway.last_kwargs["prompt"]
    assert "Taurus" in fake_gateway.last_kwargs["prompt"] or "taurus" in fake_gateway.last_kwargs["prompt"].lower()
    assert fake_gateway.last_kwargs["system_prompt"]  # zodiac instructions, non-empty


def test_ai_reading_numerology_full_reading(client, fake_gateway):
    response = client.post(
        "/ai-reading",
        json=_base_payload(domain="numerology", kind="full_reading"),
    )
    assert response.status_code == 200
    assert "Life Path Number" in fake_gateway.last_kwargs["prompt"]


def test_ask_ai_kind_requires_a_question(client, fake_gateway):
    response = client.post("/ai-reading", json=_base_payload(kind="ask_ai"))
    assert response.status_code == 422
    assert fake_gateway.call_count == 0


def test_ask_ai_kind_with_question_calls_ai(client, fake_gateway):
    response = client.post(
        "/ai-reading", json=_base_payload(kind="ask_ai", question="What about love?")
    )
    assert response.status_code == 200
    assert "What about love?" in fake_gateway.last_kwargs["prompt"]


def test_unknown_kind_is_rejected(client, fake_gateway):
    response = client.post("/ai-reading", json=_base_payload(kind="not_a_real_kind"))
    assert response.status_code == 422
    assert fake_gateway.call_count == 0


def test_unknown_domain_is_rejected(client, fake_gateway):
    response = client.post("/ai-reading", json=_base_payload(domain="tarot"))
    assert response.status_code == 422
    assert fake_gateway.call_count == 0


# --------------------------------------------------------------------------
# Fallback / error handling — the API must never crash or leak internals.
# --------------------------------------------------------------------------

def test_all_providers_failed_returns_clean_502_not_a_crash(
    client, monkeypatch, fake_gateway_factory
):
    fake = fake_gateway_factory(raise_error=AllProvidersFailedError("all providers failed"))
    monkeypatch.setattr(ai_service, "_gateway", fake)

    response = client.post("/ai-reading", json=_base_payload())
    assert response.status_code == 502
    assert "AI request failed" in response.json()["detail"]


def test_no_provider_configured_returns_503(client, monkeypatch, fake_gateway_factory):
    fake = fake_gateway_factory(raise_error=ConfigurationError("no provider is configured"))
    monkeypatch.setattr(ai_service, "_gateway", fake)

    response = client.post("/ai-reading", json=_base_payload())
    assert response.status_code == 503


def test_empty_ai_response_returns_502(client, monkeypatch, fake_gateway_factory):
    fake = fake_gateway_factory(text="   ")
    monkeypatch.setattr(ai_service, "_gateway", fake)

    response = client.post("/ai-reading", json=_base_payload())
    assert response.status_code == 502


def test_provider_error_message_never_leaks_a_key_shaped_value(
    client, monkeypatch, fake_gateway_factory
):
    fake = fake_gateway_factory(raise_error=RuntimeError("boom, unexpected"))
    monkeypatch.setattr(ai_service, "_gateway", fake)

    response = client.post("/ai-reading", json=_base_payload())
    assert response.status_code == 502
    assert "sk-" not in response.text
