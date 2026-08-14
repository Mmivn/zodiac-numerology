def test_health_reports_ok_and_provider_order(client, fake_gateway):
    response = client.get("/health")
    assert response.status_code == 200
    body = response.json()
    assert body["status"] == "ok"
    assert body["provider_order"] == ["gemini", "groq", "mistral", "cloudflare", "openai"]
    assert isinstance(body["providers_configured"], list)
    assert isinstance(body["paid_fallback_enabled"], bool)


def test_health_never_exposes_key_values(client, fake_gateway):
    body = client.get("/health").json()
    serialized = str(body).lower()
    for suspicious in ("api_key", "sk-", "token"):
        assert suspicious not in serialized
