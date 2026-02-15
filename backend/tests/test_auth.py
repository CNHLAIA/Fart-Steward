from models import User


def _register(client, username="testuser", password="Test123!"):
    return client.post(
        "/api/auth/register",
        json={"username": username, "password": password},
    )


def _login(client, username="testuser", password="Test123!"):
    return client.post(
        "/api/auth/login",
        json={"username": username, "password": password},
    )


def _auth_headers(token: str):
    return {"Authorization": f"Bearer {token}"}


def test_register_success_returns_token_and_user(client):
    res = _register(client, username="testuser", password="Test123!")
    assert res.status_code == 201

    body = res.get_json()
    assert "token" in body
    assert body["token"]
    assert body["user"]["username"] == "testuser"


def test_register_stores_username_lowercase_and_hashes_password(app, client):
    res = _register(client, username="TestUser", password="Test123!")
    assert res.status_code == 201

    with app.app_context():
        u = User.query.filter_by(username="testuser").first()
        assert u is not None
        assert u.username == "testuser"
        assert u.password_hash != "Test123!"
        assert u.password_hash.startswith("$2")


def test_register_duplicate_username_rejected_case_insensitive(client):
    res1 = _register(client, username="testuser", password="Test123!")
    assert res1.status_code == 201

    res2 = _register(client, username="TestUser", password="Other456!")
    assert res2.status_code == 409
    assert res2.get_json()["code"] == "USERNAME_TAKEN"


def test_login_success_returns_token_and_user(client):
    assert _register(client).status_code == 201

    res = _login(client, username="testuser", password="Test123!")
    assert res.status_code == 200
    body = res.get_json()
    assert body["token"]
    assert body["user"]["username"] == "testuser"


def test_login_accepts_username_case_insensitive(client):
    assert (
        _register(client, username="testuser", password="Test123!").status_code == 201
    )

    res = _login(client, username="TestUser", password="Test123!")
    assert res.status_code == 200
    assert res.get_json()["user"]["username"] == "testuser"


def test_login_wrong_password_rejected(client):
    assert (
        _register(client, username="testuser", password="Test123!").status_code == 201
    )

    res = _login(client, username="testuser", password="WrongPass")
    assert res.status_code == 401
    assert res.get_json()["code"] == "INVALID_CREDENTIALS"


def test_me_requires_auth(client):
    res = client.get("/api/auth/me")
    assert res.status_code == 401
    assert res.get_json()["code"] == "UNAUTHORIZED"


def test_me_success_returns_current_user(client):
    reg = _register(client)
    token = reg.get_json()["token"]

    res = client.get("/api/auth/me", headers=_auth_headers(token))
    assert res.status_code == 200
    assert res.get_json() == {"user": {"username": "testuser"}}


def test_invalid_token_rejected(client):
    res = client.get("/api/auth/me", headers=_auth_headers("not-a-jwt"))
    assert res.status_code == 401
    assert res.get_json()["code"] == "INVALID_TOKEN"
