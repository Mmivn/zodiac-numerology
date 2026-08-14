"""POST /profile, /zodiac, /numerology — deterministic, no AI, no consent
needed. These never touch ai_service, so fake_gateway is not requested
here (nothing to fake)."""
from datetime import date


def test_profile_computes_sign_and_life_path(client):
    response = client.post(
        "/profile",
        json={"name": "Anna", "birth_date": "20.05.1990", "language": "en"},
    )
    assert response.status_code == 200
    body = response.json()
    assert body["name"] == "Anna"
    assert body["birth_date"] == "1990-05-20"
    assert body["zodiac_sign"] == "taurus"
    assert body["zodiac_sign_name"]  # localized, non-empty
    assert body["life_path_number"] == 8


def test_profile_rejects_empty_name(client):
    response = client.post(
        "/profile", json={"name": "   ", "birth_date": "20.05.1990", "language": "en"}
    )
    assert response.status_code == 422


def test_profile_rejects_invalid_birth_date(client):
    response = client.post(
        "/profile", json={"name": "Anna", "birth_date": "31.02.2020", "language": "en"}
    )
    assert response.status_code == 422
    assert "birth date" in response.json()["detail"].lower()


def test_profile_rejects_future_birth_date(client):
    future = date.today().replace(year=date.today().year + 1)
    response = client.post(
        "/profile",
        json={"name": "Anna", "birth_date": future.strftime("%d.%m.%Y"), "language": "en"},
    )
    assert response.status_code == 422


def test_profile_accepts_all_three_date_formats(client):
    for raw in ("20.05.1990", "20/05/1990", "1990-05-20"):
        response = client.post(
            "/profile", json={"name": "Anna", "birth_date": raw, "language": "en"}
        )
        assert response.status_code == 200, raw
        assert response.json()["zodiac_sign"] == "taurus"


def test_zodiac_endpoint_matches_profile(client):
    response = client.post("/zodiac", json={"birth_date": "20.05.1990", "language": "ru"})
    assert response.status_code == 200
    body = response.json()
    assert body["zodiac_sign"] == "taurus"
    assert body["zodiac_sign_name"] == "Телец"


def test_numerology_endpoint_returns_all_four_numbers(client):
    response = client.post("/numerology", json={"birth_date": "20.05.1990", "language": "en"})
    assert response.status_code == 200
    body = response.json()
    assert body["life_path_number"] == 8
    for key in ("personal_day_number", "personal_month_number", "personal_year_number"):
        assert isinstance(body[key], int)


def test_numerology_rejects_invalid_date(client):
    response = client.post("/numerology", json={"birth_date": "not-a-date", "language": "en"})
    assert response.status_code == 422


def test_missing_required_field_is_422_not_500(client):
    response = client.post("/profile", json={"name": "Anna"})  # no birth_date
    assert response.status_code == 422


def test_unsupported_language_is_422(client):
    response = client.post(
        "/profile", json={"name": "Anna", "birth_date": "20.05.1990", "language": "de"}
    )
    assert response.status_code == 422
