"""POST /translate — turns an already-generated reading into another
supported language via a cheap translation pass, never the full,
expensive reading generation. See main.py's "Translate" section and
frontend/lib/useLanguageSyncedReading.ts (the caller: switching the UI
language while a reading is on screen)."""
import ai_service
from all_api.exceptions import AllProvidersFailedError, ConfigurationError


def _payload(**overrides):
    payload = {"text": "A mocked reading, already generated once.", "language": "ru", "consent": True}
    payload.update(overrides)
    return payload


def test_translate_returns_the_translated_text_and_provider_info(client, fake_gateway):
    fake_gateway._text = "Смоделированный перевод."
    response = client.post("/translate", json=_payload())

    assert response.status_code == 200
    body = response.json()
    assert body["text"] == "Смоделированный перевод."
    assert body["provider"] == "gemini"
    assert body["model"] == "gemini-flash-latest"
    assert body["fallback_count"] == 0


def test_translate_sends_the_english_language_name_to_the_gateway(client, monkeypatch, fake_gateway_factory):
    expected_name = {"ru": "Russian", "en": "English", "vi": "Vietnamese"}
    for language, name in expected_name.items():
        fake = fake_gateway_factory(text="translated")
        monkeypatch.setattr(ai_service, "_gateway", fake)
        response = client.post("/translate", json=_payload(language=language))
        assert response.status_code == 200, language
        assert fake.last_kwargs["system_prompt"] == f"translate:{name}"


def test_translate_requires_consent(client, fake_gateway):
    response = client.post("/translate", json=_payload(consent=False))
    assert response.status_code == 403
    assert fake_gateway.call_count == 0


def test_translate_rejects_empty_text(client, fake_gateway):
    response = client.post("/translate", json=_payload(text="   "))
    assert response.status_code == 422
    assert fake_gateway.call_count == 0


def test_translate_rejects_unsupported_language(client, fake_gateway):
    response = client.post("/translate", json=_payload(language="de"))
    assert response.status_code == 422
    assert fake_gateway.call_count == 0


def test_translate_maps_missing_api_key_to_503(client, monkeypatch, fake_gateway_factory):
    fake = fake_gateway_factory(raise_error=ConfigurationError("no provider is configured"))
    monkeypatch.setattr(ai_service, "_gateway", fake)
    response = client.post("/translate", json=_payload())
    assert response.status_code == 503


def test_translate_maps_empty_ai_response_to_502(client, monkeypatch, fake_gateway_factory):
    fake = fake_gateway_factory(text="   ")
    monkeypatch.setattr(ai_service, "_gateway", fake)
    response = client.post("/translate", json=_payload())
    assert response.status_code == 502


def test_translate_maps_provider_failure_to_502(client, monkeypatch, fake_gateway_factory):
    fake = fake_gateway_factory(raise_error=AllProvidersFailedError("all providers failed"))
    monkeypatch.setattr(ai_service, "_gateway", fake)
    response = client.post("/translate", json=_payload())
    assert response.status_code == 502


def test_ai_reading_still_never_calls_translate(client, monkeypatch, fake_gateway_factory):
    """Regression guard: adding POST /translate must not change
    /ai-reading's behavior — see test_language.py's identical assertion."""
    calls = {"translate_text_detailed": 0}

    def fail_if_called(*args, **kwargs):
        calls["translate_text_detailed"] += 1
        raise AssertionError("translate_text_detailed should never be called by /ai-reading")

    monkeypatch.setattr(ai_service, "translate_text_detailed", fail_if_called)
    fake = fake_gateway_factory(text="a reading")
    monkeypatch.setattr(ai_service, "_gateway", fake)

    response = client.post(
        "/ai-reading",
        json={
            "domain": "zodiac",
            "kind": "my_sign",
            "name": "Anna",
            "birth_date": "20.05.1990",
            "language": "vi",
            "consent": True,
        },
    )
    assert response.status_code == 200
    assert calls["translate_text_detailed"] == 0
