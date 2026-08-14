def _payload(domain="zodiac", consent=True):
    return {
        "domain": domain,
        "person_a": {"name": "Anna", "birth_date": "20.05.1990"},
        "person_b": {"name": "Ivan", "birth_date": "10.10.1998"},
        "language": "en",
        "consent": consent,
    }


def test_compatibility_requires_consent(client, fake_gateway):
    response = client.post("/compatibility", json=_payload(consent=False))
    assert response.status_code == 403
    assert fake_gateway.call_count == 0


def test_zodiac_compatibility_returns_both_signs(client, fake_gateway):
    response = client.post("/compatibility", json=_payload(domain="zodiac"))
    assert response.status_code == 200
    body = response.json()
    assert body["person_a_zodiac_sign"] == "taurus"
    assert body["person_b_zodiac_sign"] == "libra"
    assert body["person_a_life_path_number"] is None
    assert body["provider"] == "gemini"
    assert body["text"]


def test_numerology_compatibility_returns_both_life_paths(client, fake_gateway):
    response = client.post("/compatibility", json=_payload(domain="numerology"))
    assert response.status_code == 200
    body = response.json()
    assert isinstance(body["person_a_life_path_number"], int)
    assert isinstance(body["person_b_life_path_number"], int)
    assert body["person_a_zodiac_sign"] is None


def test_compatibility_rejects_invalid_companion_birth_date(client, fake_gateway):
    payload = _payload()
    payload["person_b"]["birth_date"] = "31.02.2020"
    response = client.post("/compatibility", json=payload)
    assert response.status_code == 422
    assert fake_gateway.call_count == 0


def test_compatibility_sends_both_names_in_the_prompt(client, fake_gateway):
    client.post("/compatibility", json=_payload(domain="zodiac"))
    prompt = fake_gateway.last_kwargs["prompt"]
    assert "Anna" in prompt
    assert "Ivan" in prompt
