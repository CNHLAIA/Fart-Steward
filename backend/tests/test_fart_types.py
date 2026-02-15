from __future__ import annotations


def _auth_headers(token: str):
    return {"Authorization": f"Bearer {token}"}


def _register_and_get_token(client, username: str, password: str = "Test123!") -> str:
    res = client.post(
        "/api/auth/register",
        json={"username": username, "password": password},
    )
    assert res.status_code == 201
    return res.get_json()["token"]


def test_fart_types_requires_auth(client):
    res = client.get("/api/fart-types")
    assert res.status_code == 401
    assert res.get_json()["code"] == "UNAUTHORIZED"


def test_list_fart_types_includes_preset_and_custom(client):
    token = _register_and_get_token(client, "user1")

    res = client.get("/api/fart-types", headers=_auth_headers(token))
    assert res.status_code == 200
    body = res.get_json()
    names = {it["name"] for it in body}
    assert {"响屁", "闷屁", "连环屁", "无声屁", "喷射屁"}.issubset(names)

    create = client.post(
        "/api/fart-types",
        json={"name": "震天屁"},
        headers=_auth_headers(token),
    )
    assert create.status_code == 201
    created = create.get_json()
    assert created["name"] == "震天屁"
    assert created["is_preset"] is False
    assert isinstance(created["id"], int)

    res2 = client.get("/api/fart-types", headers=_auth_headers(token))
    assert res2.status_code == 200
    names2 = {it["name"] for it in res2.get_json()}
    assert "震天屁" in names2


def test_create_fart_type_duplicate_name_rejected(client):
    token = _register_and_get_token(client, "user1")

    assert (
        client.post(
            "/api/fart-types",
            json={"name": "震天屁"},
            headers=_auth_headers(token),
        ).status_code
        == 201
    )

    dup = client.post(
        "/api/fart-types",
        json={"name": "震天屁"},
        headers=_auth_headers(token),
    )
    assert dup.status_code == 409
    assert dup.get_json()["code"] == "TYPE_EXISTS"
