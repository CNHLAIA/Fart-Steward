from __future__ import annotations

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


def _create_record(client, token, type_id, timestamp="2026-02-15T12:00:00Z", **kwargs):
    payload = {
        "timestamp": timestamp,
        "duration": "short",
        "type_id": type_id,
        "smell_level": "mild",
        "temperature": "cold",
        "moisture": "dry",
        **kwargs,
    }
    res = client.post("/api/records", json=payload, headers=_auth_headers(token))
    assert res.status_code == 201
    return res.get_json()["id"]


def test_export_csv_requires_auth(client):
    """CSV export should require authentication."""
    res = client.get("/api/export/csv")
    assert res.status_code == 401


def test_export_excel_requires_auth(client):
    """Excel export should require authentication."""
    res = client.get("/api/export/excel")
    assert res.status_code == 401


def test_export_csv_returns_correct_headers(client, app):
    """CSV export should return correct content type and filename."""
    token = _register_and_get_token(client, "user1")
    res = client.get("/api/export/csv", headers=_auth_headers(token))
    assert res.status_code == 200
    assert res.content_type.startswith("text/csv")
    assert "attachment" in res.headers.get("Content-Disposition", "")
    assert "fart_records.csv" in res.headers.get("Content-Disposition", "")


def test_export_csv_has_bom_for_excel_compatibility(client, app):
    """CSV export should start with UTF-8 BOM for Excel compatibility."""
    token = _register_and_get_token(client, "user1")
    res = client.get("/api/export/csv", headers=_auth_headers(token))
    assert res.status_code == 200
    # UTF-8 BOM is EF BB BF
    assert res.data.startswith(b"\xef\xbb\xbf")


def test_export_csv_has_chinese_headers(client, app):
    """CSV export should have Chinese headers."""
    token = _register_and_get_token(client, "user1")
    res = client.get("/api/export/csv", headers=_auth_headers(token))
    assert res.status_code == 200
    content = res.data.decode("utf-8")
    lines = content.strip().split("\n")
    headers = lines[0]
    assert "时间" in headers
    assert "时长" in headers
    assert "类型" in headers
    assert "臭味程度" in headers
    assert "温感" in headers
    assert "湿感" in headers
    assert "备注" in headers


def test_export_csv_contains_user_records(client, app):
    """CSV export should contain the user's records."""
    token = _register_and_get_token(client, "user1")
    type_id = _preset_type_id(app)
    _create_record(
        client, token, type_id, timestamp="2026-02-15T12:00:00Z", notes="test note"
    )

    res = client.get("/api/export/csv", headers=_auth_headers(token))
    assert res.status_code == 200
    content = res.data.decode("utf-8")
    lines = content.strip().split("\n")
    assert len(lines) == 2
    assert "test note" in content


def test_export_csv_date_range_filter(client, app):
    """CSV export should filter by date range."""
    token = _register_and_get_token(client, "user1")
    type_id = _preset_type_id(app)

    _create_record(client, token, type_id, timestamp="2026-02-01T12:00:00Z")
    _create_record(client, token, type_id, timestamp="2026-02-10T12:00:00Z")
    _create_record(client, token, type_id, timestamp="2026-02-20T12:00:00Z")

    res = client.get(
        "/api/export/csv?date_from=2026-02-05&date_to=2026-02-15",
        headers=_auth_headers(token),
    )
    assert res.status_code == 200
    content = res.data.decode("utf-8")
    lines = content.strip().split("\n")
    assert len(lines) == 2
    assert "2026-02-10" in lines[1]
    assert "2026-02-01" not in content
    assert "2026-02-20" not in content


def test_export_csv_data_isolation(client, app):
    """CSV export should only include current user's records."""
    token_a = _register_and_get_token(client, "user_a")
    token_b = _register_and_get_token(client, "user_b")
    type_id = _preset_type_id(app)

    _create_record(
        client, token_a, type_id, timestamp="2026-02-15T12:00:00Z", notes="user_a_note"
    )
    _create_record(
        client, token_b, type_id, timestamp="2026-02-15T12:00:00Z", notes="user_b_note"
    )

    res = client.get("/api/export/csv", headers=_auth_headers(token_a))
    assert res.status_code == 200
    content = res.data.decode("utf-8")
    assert "user_a_note" in content
    assert "user_b_note" not in content


def test_export_excel_returns_correct_headers(client, app):
    """Excel export should return correct content type and filename."""
    token = _register_and_get_token(client, "user1")
    res = client.get("/api/export/excel", headers=_auth_headers(token))
    assert res.status_code == 200
    assert "spreadsheet" in res.content_type or "xlsx" in res.content_type
    assert "attachment" in res.headers.get("Content-Disposition", "")
    assert "fart_records.xlsx" in res.headers.get("Content-Disposition", "")


def test_export_excel_is_valid_xlsx(client, app):
    """Excel export should return valid .xlsx file."""
    token = _register_and_get_token(client, "user1")
    res = client.get("/api/export/excel", headers=_auth_headers(token))
    assert res.status_code == 200
    # XLSX files start with PK (ZIP magic bytes)
    assert res.data[:2] == b"PK"


def test_export_excel_contains_records(client, app):
    """Excel export should contain user's records."""
    token = _register_and_get_token(client, "user1")
    type_id = _preset_type_id(app)
    _create_record(
        client,
        token,
        type_id,
        timestamp="2026-02-15T12:00:00Z",
        notes="excel_test_note",
    )

    res = client.get("/api/export/excel", headers=_auth_headers(token))
    assert res.status_code == 200
    assert len(res.data) > 1000


def test_export_excel_date_range_filter(client, app):
    """Excel export should filter by date range."""
    token = _register_and_get_token(client, "user1")
    type_id = _preset_type_id(app)

    _create_record(client, token, type_id, timestamp="2026-02-01T12:00:00Z")
    _create_record(client, token, type_id, timestamp="2026-02-10T12:00:00Z")
    _create_record(client, token, type_id, timestamp="2026-02-20T12:00:00Z")

    res = client.get(
        "/api/export/excel?date_from=2026-02-05&date_to=2026-02-15",
        headers=_auth_headers(token),
    )
    assert res.status_code == 200
    assert res.data[:2] == b"PK"


def test_export_excel_data_isolation(client, app):
    """Excel export should only include current user's records."""
    token_a = _register_and_get_token(client, "user_a")
    token_b = _register_and_get_token(client, "user_b")
    type_id = _preset_type_id(app)

    _create_record(client, token_a, type_id, timestamp="2026-02-15T12:00:00Z")
    _create_record(client, token_b, type_id, timestamp="2026-02-15T12:00:00Z")

    res_a = client.get("/api/export/excel", headers=_auth_headers(token_a))
    assert res_a.status_code == 200
    assert res_a.data[:2] == b"PK"
