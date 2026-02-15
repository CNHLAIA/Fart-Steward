from __future__ import annotations

from datetime import datetime, timezone

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


def _iso(ts: datetime) -> str:
    return ts.astimezone(timezone.utc).isoformat().replace("+00:00", "Z")


def test_create_record_success(client, app):
    token = _register_and_get_token(client, "user1")
    type_id = _preset_type_id(app)

    payload = {
        "duration": "short",
        "type_id": type_id,
        "smell_level": "stinky",
        "temperature": "hot",
        "moisture": "dry",
        "notes": "test",
    }
    res = client.post("/api/records", json=payload, headers=_auth_headers(token))
    assert res.status_code == 201

    body = res.get_json()
    assert isinstance(body["id"], int)
    assert body["duration"] == "short"
    assert body["type_id"] == type_id
    assert body["smell_level"] == "stinky"
    assert body["temperature"] == "hot"
    assert body["moisture"] == "dry"
    assert body["notes"] == "test"
    assert body["timestamp"]


def test_list_records_pagination_and_sort(client, app):
    token = _register_and_get_token(client, "user1")
    type_id = _preset_type_id(app)

    base = datetime(2026, 2, 15, 12, 0, 0, tzinfo=timezone.utc)
    for i in range(25):
        res = client.post(
            "/api/records",
            json={
                "timestamp": _iso(base.replace(minute=i)),
                "duration": "short",
                "type_id": type_id,
                "smell_level": "mild",
                "temperature": "cold",
                "moisture": "dry",
            },
            headers=_auth_headers(token),
        )
        assert res.status_code == 201

    res = client.get(
        "/api/records?page=1&per_page=10",
        headers=_auth_headers(token),
    )
    assert res.status_code == 200
    body = res.get_json()
    assert body["page"] == 1
    assert body["per_page"] == 10
    assert body["total"] == 25
    assert len(body["items"]) == 10

    timestamps = [it["timestamp"] for it in body["items"]]
    assert timestamps == sorted(timestamps, reverse=True)


def test_list_records_date_range_filter(client, app):
    token = _register_and_get_token(client, "user1")
    type_id = _preset_type_id(app)

    assert (
        client.post(
            "/api/records",
            json={
                "timestamp": "2026-02-01T12:00:00Z",
                "duration": "short",
                "type_id": type_id,
                "smell_level": "mild",
                "temperature": "cold",
                "moisture": "dry",
            },
            headers=_auth_headers(token),
        ).status_code
        == 201
    )
    assert (
        client.post(
            "/api/records",
            json={
                "timestamp": "2026-02-10T12:00:00Z",
                "duration": "short",
                "type_id": type_id,
                "smell_level": "mild",
                "temperature": "cold",
                "moisture": "dry",
            },
            headers=_auth_headers(token),
        ).status_code
        == 201
    )

    res = client.get(
        "/api/records?date_from=2026-02-05&date_to=2026-02-12",
        headers=_auth_headers(token),
    )
    assert res.status_code == 200
    body = res.get_json()
    assert body["total"] == 1
    assert len(body["items"]) == 1
    assert body["items"][0]["timestamp"] == "2026-02-10T12:00:00Z"


def test_data_isolation_user_cannot_see_others_records(client, app):
    token_a = _register_and_get_token(client, "user_a")
    token_b = _register_and_get_token(client, "user_b")
    type_id = _preset_type_id(app)

    create = client.post(
        "/api/records",
        json={
            "duration": "short",
            "type_id": type_id,
            "smell_level": "mild",
            "temperature": "cold",
            "moisture": "dry",
        },
        headers=_auth_headers(token_a),
    )
    assert create.status_code == 201
    record_id = create.get_json()["id"]

    res = client.get("/api/records", headers=_auth_headers(token_b))
    assert res.status_code == 200
    body = res.get_json()
    assert body["total"] == 0
    assert record_id not in [it["id"] for it in body["items"]]


def test_get_single_record_404_for_other_user(client, app):
    token_a = _register_and_get_token(client, "user_a")
    token_b = _register_and_get_token(client, "user_b")
    type_id = _preset_type_id(app)

    create = client.post(
        "/api/records",
        json={
            "duration": "short",
            "type_id": type_id,
            "smell_level": "mild",
            "temperature": "cold",
            "moisture": "dry",
        },
        headers=_auth_headers(token_a),
    )
    record_id = create.get_json()["id"]

    own = client.get(f"/api/records/{record_id}", headers=_auth_headers(token_a))
    assert own.status_code == 200

    other = client.get(f"/api/records/{record_id}", headers=_auth_headers(token_b))
    assert other.status_code == 404
    assert other.get_json()["code"] == "NOT_FOUND"


def test_update_own_record(client, app):
    token = _register_and_get_token(client, "user1")
    type_id = _preset_type_id(app)

    create = client.post(
        "/api/records",
        json={
            "duration": "short",
            "type_id": type_id,
            "smell_level": "mild",
            "temperature": "cold",
            "moisture": "dry",
            "notes": "before",
        },
        headers=_auth_headers(token),
    )
    record_id = create.get_json()["id"]

    res = client.put(
        f"/api/records/{record_id}",
        json={"notes": "after", "smell_level": "stinky"},
        headers=_auth_headers(token),
    )
    assert res.status_code == 200
    body = res.get_json()
    assert body["id"] == record_id
    assert body["notes"] == "after"
    assert body["smell_level"] == "stinky"


def test_delete_own_record(client, app):
    token = _register_and_get_token(client, "user1")
    type_id = _preset_type_id(app)

    create = client.post(
        "/api/records",
        json={
            "duration": "short",
            "type_id": type_id,
            "smell_level": "mild",
            "temperature": "cold",
            "moisture": "dry",
        },
        headers=_auth_headers(token),
    )
    record_id = create.get_json()["id"]

    res = client.delete(f"/api/records/{record_id}", headers=_auth_headers(token))
    assert res.status_code == 200

    missing = client.get(f"/api/records/{record_id}", headers=_auth_headers(token))
    assert missing.status_code == 404
    assert missing.get_json()["code"] == "NOT_FOUND"


def test_create_record_rejects_invalid_enum_value(client, app):
    token = _register_and_get_token(client, "user1")
    type_id = _preset_type_id(app)

    res = client.post(
        "/api/records",
        json={
            "duration": "nope",
            "type_id": type_id,
            "smell_level": "mild",
            "temperature": "cold",
            "moisture": "dry",
        },
        headers=_auth_headers(token),
    )
    assert res.status_code == 400
    assert res.get_json()["code"] == "INVALID_ENUM"
