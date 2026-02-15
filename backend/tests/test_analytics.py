from __future__ import annotations

from datetime import datetime, timedelta, timezone
from models import FartType


def _auth_headers(token: str):
    return {"Authorization": f"Bearer {token}"}


def _register_and_get_token(client, username: str, password: str = "Test123!") -> str:
    res = client.post(
        "/api/auth/register",
        json={"username": username, "password": password},
    )
    assert res.status_code == 201
    return res.get_json()["token"]


def _preset_type_id(app, name: str = "响屁") -> int:
    with app.app_context():
        ft = FartType.query.filter_by(name=name).first()
        assert ft is not None
        return int(ft.id)


def _create_record(client, token, type_id, **kwargs):
    payload = {
        "duration": "short",
        "type_id": type_id,
        "smell_level": "mild",
        "temperature": "cold",
        "moisture": "dry",
        "notes": "test",
    }
    payload.update(kwargs)
    return client.post("/api/records", json=payload, headers=_auth_headers(token))


def test_daily_count(client, app):
    token = _register_and_get_token(client, "user_analytics")
    type_id = _preset_type_id(app)

    now = datetime.now(timezone.utc)
    _create_record(
        client, token, type_id, timestamp=now.isoformat().replace("+00:00", "Z")
    )
    _create_record(
        client, token, type_id, timestamp=now.isoformat().replace("+00:00", "Z")
    )
    yesterday = now - timedelta(days=1)
    _create_record(
        client, token, type_id, timestamp=yesterday.isoformat().replace("+00:00", "Z")
    )

    res = client.get("/api/analytics/daily-count?days=7", headers=_auth_headers(token))
    assert res.status_code == 200
    data = res.get_json()

    assert "dates" in data
    assert "counts" in data
    assert len(data["dates"]) > 0
    assert len(data["counts"]) > 0

    today_str = now.strftime("%Y-%m-%d")
    yesterday_str = yesterday.strftime("%Y-%m-%d")

    if today_str in data["dates"]:
        idx = data["dates"].index(today_str)
        assert data["counts"][idx] >= 2

    if yesterday_str in data["dates"]:
        idx = data["dates"].index(yesterday_str)
        assert data["counts"][idx] >= 1


def test_weekly_count(client, app):
    token = _register_and_get_token(client, "user_analytics_weekly")
    type_id = _preset_type_id(app)

    now = datetime.now(timezone.utc)
    _create_record(
        client, token, type_id, timestamp=now.isoformat().replace("+00:00", "Z")
    )

    res = client.get(
        "/api/analytics/weekly-count?weeks=4", headers=_auth_headers(token)
    )
    assert res.status_code == 200
    data = res.get_json()
    assert "weeks" in data
    assert "counts" in data


def test_type_distribution(client, app):
    token = _register_and_get_token(client, "user_analytics_type")
    type1 = _preset_type_id(app, "响屁")
    type2 = _preset_type_id(app, "无声屁")

    _create_record(client, token, type1)
    _create_record(client, token, type1)
    _create_record(client, token, type2)

    res = client.get("/api/analytics/type-distribution", headers=_auth_headers(token))
    assert res.status_code == 200
    data = res.get_json()

    assert isinstance(data, list)
    names = [item["name"] for item in data]
    assert "响屁" in names
    assert "无声屁" in names

    for item in data:
        if item["name"] == "响屁":
            assert item["value"] == 2
        if item["name"] == "无声屁":
            assert item["value"] == 1


def test_smell_distribution(client, app):
    token = _register_and_get_token(client, "user_analytics_smell")
    type_id = _preset_type_id(app)

    _create_record(client, token, type_id, smell_level="stinky")
    _create_record(client, token, type_id, smell_level="mild")

    res = client.get("/api/analytics/smell-distribution", headers=_auth_headers(token))
    assert res.status_code == 200
    data = res.get_json()

    assert "categories" in data
    assert "values" in data
    assert "stinky" in data["categories"]
    assert "mild" in data["categories"]


def test_hourly_heatmap(client, app):
    token = _register_and_get_token(client, "user_analytics_heatmap")
    type_id = _preset_type_id(app)

    now = datetime.now(timezone.utc)
    _create_record(
        client, token, type_id, timestamp=now.isoformat().replace("+00:00", "Z")
    )

    res = client.get("/api/analytics/hourly-heatmap", headers=_auth_headers(token))
    assert res.status_code == 200
    data = res.get_json()

    assert isinstance(data, list)
    if len(data) > 0:
        assert len(data[0]) == 3


def test_duration_distribution(client, app):
    token = _register_and_get_token(client, "user_analytics_duration")
    type_id = _preset_type_id(app)

    _create_record(client, token, type_id, duration="short")
    _create_record(client, token, type_id, duration="long")

    res = client.get(
        "/api/analytics/duration-distribution", headers=_auth_headers(token)
    )
    assert res.status_code == 200
    data = res.get_json()

    assert isinstance(data, list)
    names = [d["name"] for d in data]
    assert "short" in names
    assert "long" in names


def test_cross_analysis(client, app):
    token = _register_and_get_token(client, "user_analytics_cross")
    type_id = _preset_type_id(app)

    _create_record(client, token, type_id, smell_level="stinky", duration="long")

    res = client.get("/api/analytics/cross-analysis", headers=_auth_headers(token))
    assert res.status_code == 200
    data = res.get_json()
    assert isinstance(data, list)
