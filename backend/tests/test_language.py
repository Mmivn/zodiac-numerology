"""Language correctness for AI-backed endpoints.

Regression coverage for the reported bug ("UI is Vietnamese, but the AI
reading content comes back in Russian"). The backend side of this was
already correct — these tests pin that down explicitly so it can't
regress — the actual bug was on the frontend (see
frontend/tests/AIPanel.test.tsx): stale component state kept displaying
a previously-fetched reading after the language prop changed. Backend
never calls translate_text as a fallback here (see main.py) — the AI is
told, in its own system prompt, to answer directly in the requested
language.
"""
import ai_service

LANGUAGE_MARKERS = {
    "ru": "русском языке",
    "en": "English",
    "vi": "tiếng Việt",
}


def _base_payload(language, **overrides):
    payload = {
        "domain": "zodiac",
        "kind": "my_sign",
        "name": "Anna",
        "birth_date": "20.05.1990",
        "language": language,
        "consent": True,
    }
    payload.update(overrides)
    return payload


def test_each_supported_language_gets_its_own_reply_in_language_instruction(
    client, monkeypatch, fake_gateway_factory
):
    for language, marker in LANGUAGE_MARKERS.items():
        fake = fake_gateway_factory(text="a reading")
        monkeypatch.setattr(ai_service, "_gateway", fake)

        response = client.post("/ai-reading", json=_base_payload(language))
        assert response.status_code == 200, language

        system_prompt = fake.last_kwargs["system_prompt"]
        assert marker in system_prompt, f"{language} instructions missing '{marker}' marker"


def test_switching_language_for_the_same_signature_changes_the_prompt(
    client, monkeypatch, fake_gateway_factory
):
    """Same zodiac sign, different language — the actual request sent to
    the AI (facts + instructions) must differ, so ALL_API's own cache
    (keyed on the full prompt+system_prompt) can never return one
    language's cached answer for another."""
    seen = {}
    for language in ("ru", "en", "vi"):
        fake = fake_gateway_factory(text="a reading")
        monkeypatch.setattr(ai_service, "_gateway", fake)
        client.post("/ai-reading", json=_base_payload(language))
        seen[language] = (fake.last_kwargs["prompt"], fake.last_kwargs["system_prompt"])

    prompts = {v[0] for v in seen.values()}
    system_prompts = {v[1] for v in seen.values()}
    assert len(prompts) == 3, "the same message was sent for every language"
    assert len(system_prompts) == 3, "the same instructions were sent for every language"


def test_localized_zodiac_sign_name_appears_in_the_prompt(client, monkeypatch, fake_gateway_factory):
    expected_sign_name = {"ru": "Телец", "en": "Taurus", "vi": "Kim Ngưu"}
    for language, sign_name in expected_sign_name.items():
        fake = fake_gateway_factory(text="a reading")
        monkeypatch.setattr(ai_service, "_gateway", fake)
        client.post("/ai-reading", json=_base_payload(language))
        assert sign_name in fake.last_kwargs["prompt"], language


def test_compatibility_also_gets_correct_per_language_instructions(
    client, monkeypatch, fake_gateway_factory
):
    for language, marker in LANGUAGE_MARKERS.items():
        fake = fake_gateway_factory(text="a reading")
        monkeypatch.setattr(ai_service, "_gateway", fake)

        response = client.post(
            "/compatibility",
            json={
                "domain": "zodiac",
                "person_a": {"name": "Anna", "birth_date": "20.05.1990"},
                "person_b": {"name": "Ivan", "birth_date": "10.10.1998"},
                "language": language,
                "consent": True,
            },
        )
        assert response.status_code == 200, language
        assert marker in fake.last_kwargs["system_prompt"], language


def test_ask_ai_also_gets_correct_per_language_instructions(client, monkeypatch, fake_gateway_factory):
    for language, marker in LANGUAGE_MARKERS.items():
        fake = fake_gateway_factory(text="a reading")
        monkeypatch.setattr(ai_service, "_gateway", fake)

        response = client.post(
            "/ai-reading",
            json=_base_payload(language, kind="ask_ai", question="What about love?"),
        )
        assert response.status_code == 200, language
        assert marker in fake.last_kwargs["system_prompt"], language


def test_unsupported_language_on_ai_reading_is_rejected_cleanly(client, fake_gateway):
    response = client.post("/ai-reading", json=_base_payload("de"))
    assert response.status_code == 422
    assert fake_gateway.call_count == 0


def test_translate_text_is_never_used_by_ai_reading_endpoints(client, monkeypatch, fake_gateway_factory):
    """The preferred behavior (per the task) is generating directly in the
    requested language, not translating a canonical answer afterward —
    assert the backend never even touches ai_service.translate_text."""
    calls = {"translate_text": 0}

    def fail_if_called(*args, **kwargs):
        calls["translate_text"] += 1
        raise AssertionError("translate_text should never be called by /ai-reading")

    monkeypatch.setattr(ai_service, "translate_text", fail_if_called)
    fake = fake_gateway_factory(text="a reading")
    monkeypatch.setattr(ai_service, "_gateway", fake)

    response = client.post("/ai-reading", json=_base_payload("vi"))
    assert response.status_code == 200
    assert calls["translate_text"] == 0
