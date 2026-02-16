from __future__ import annotations

from datetime import datetime, timezone
from typing import Any

from flask import Blueprint, jsonify, request
from sqlalchemy.orm import joinedload

from auth import error_response, get_jwt_identity, jwt_required
from models import FartRecord, FartType, User, db


records_bp = Blueprint("records", __name__, url_prefix="/records")


ALLOWED_DURATION = {"very_short", "short", "medium", "long"}
ALLOWED_SMELL_LEVEL = {"mild", "tolerable", "stinky", "extremely_stinky"}
ALLOWED_TEMPERATURE = {"hot", "cold"}
ALLOWED_MOISTURE = {"moist", "dry"}


def _current_user() -> User | None:
    identity = get_jwt_identity()
    if not identity:
        return None
    try:
        user_id = int(identity)
    except (TypeError, ValueError):
        return None
    return User.query.get(user_id)


def _normalize_iso_timestamp(value: str) -> str | None:
    raw = (value or "").strip()
    if not raw:
        return None

    candidate = raw
    if candidate.endswith("Z"):
        candidate = candidate[:-1] + "+00:00"
    try:
        dt = datetime.fromisoformat(candidate)
    except ValueError:
        return None

    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    dt_utc = dt.astimezone(timezone.utc)
    return dt_utc.isoformat().replace("+00:00", "Z")


def _default_timestamp() -> str:
    return datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")


def _serialize_record(r: FartRecord) -> dict[str, Any]:
    return {
        "id": int(r.id),
        "timestamp": r.timestamp,
        "duration": r.duration,
        "type_id": int(r.type_id),
        "type_name": r.fart_type.name if r.fart_type else None,
        "smell_level": r.smell_level,
        "temperature": r.temperature,
        "moisture": r.moisture,
        "notes": r.notes,
    }


def _validate_enum(field: str, value: Any, allowed: set[str]):
    if not isinstance(value, str) or value not in allowed:
        return error_response(
            f"Invalid {field}",
            "INVALID_ENUM",
            400,
        )
    return None


def _validate_type_id(type_id: Any):
    try:
        type_id_int = int(type_id)
    except (TypeError, ValueError):
        return None, error_response("Invalid type_id", "INVALID_TYPE", 400)

    if FartType.query.get(type_id_int) is None:
        return None, error_response("Unknown type_id", "INVALID_TYPE", 400)
    return type_id_int, None


def _parse_date_boundary(value: str, end_of_day: bool) -> str | None:
    raw = (value or "").strip()
    if not raw:
        return None

    if len(raw) == 10 and raw[4] == "-" and raw[7] == "-":
        if end_of_day:
            raw = raw + "T23:59:59Z"
        else:
            raw = raw + "T00:00:00Z"

    return _normalize_iso_timestamp(raw)


@records_bp.post("")
@jwt_required()
def create_record():
    user = _current_user()
    if user is None:
        return error_response("Unauthorized", "UNAUTHORIZED", 401)

    payload = request.get_json(silent=True) or {}

    duration = payload.get("duration")
    type_id = payload.get("type_id")
    smell_level = payload.get("smell_level")
    temperature = payload.get("temperature")
    moisture = payload.get("moisture")
    notes = payload.get("notes")

    if (
        not duration
        or type_id is None
        or not smell_level
        or not temperature
        or not moisture
    ):
        return error_response("Missing required fields", "INVALID_REQUEST", 400)

    if (err := _validate_enum("duration", duration, ALLOWED_DURATION)) is not None:
        return err
    if (
        err := _validate_enum("smell_level", smell_level, ALLOWED_SMELL_LEVEL)
    ) is not None:
        return err
    if (
        err := _validate_enum("temperature", temperature, ALLOWED_TEMPERATURE)
    ) is not None:
        return err
    if (err := _validate_enum("moisture", moisture, ALLOWED_MOISTURE)) is not None:
        return err

    type_id_int, err = _validate_type_id(type_id)
    if err is not None:
        return err

    ts = payload.get("timestamp")
    if ts is None or str(ts).strip() == "":
        timestamp = _default_timestamp()
    else:
        timestamp = _normalize_iso_timestamp(str(ts))
        if timestamp is None:
            return error_response("Invalid timestamp", "INVALID_REQUEST", 400)

    rec = FartRecord()
    rec.user_id = int(user.id)
    rec.timestamp = timestamp
    rec.duration = duration
    rec.type_id = type_id_int
    rec.smell_level = smell_level
    rec.temperature = temperature
    rec.moisture = moisture
    rec.notes = notes

    db.session.add(rec)
    db.session.commit()

    return jsonify(_serialize_record(rec)), 201


@records_bp.get("")
@jwt_required()
def list_records():
    user = _current_user()
    if user is None:
        return error_response("Unauthorized", "UNAUTHORIZED", 401)

    try:
        page = int(request.args.get("page", 1))
        per_page = int(request.args.get("per_page", 20))
    except ValueError:
        return error_response("Invalid pagination", "INVALID_REQUEST", 400)

    if page < 1 or per_page < 1:
        return error_response("Invalid pagination", "INVALID_REQUEST", 400)
    if per_page > 100:
        per_page = 100

    date_from = _parse_date_boundary(
        request.args.get("date_from", ""), end_of_day=False
    )
    date_to = _parse_date_boundary(request.args.get("date_to", ""), end_of_day=True)
    if request.args.get("date_from") and date_from is None:
        return error_response("Invalid date_from", "INVALID_REQUEST", 400)
    if request.args.get("date_to") and date_to is None:
        return error_response("Invalid date_to", "INVALID_REQUEST", 400)

    q = FartRecord.query.options(joinedload(FartRecord.fart_type)).filter_by(
        user_id=int(user.id)
    )
    if date_from:
        q = q.filter(FartRecord.timestamp >= date_from)
    if date_to:
        q = q.filter(FartRecord.timestamp <= date_to)

    q = q.order_by(FartRecord.timestamp.desc())

    total = q.count()
    items = q.offset((page - 1) * per_page).limit(per_page).all()

    return jsonify(
        {
            "items": [_serialize_record(r) for r in items],
            "total": total,
            "page": page,
            "per_page": per_page,
        }
    )


def _get_owned_record_or_404(user: User, record_id: int):
    rec = FartRecord.query.filter_by(id=record_id, user_id=int(user.id)).first()
    if rec is None:
        return None, error_response("Not found", "NOT_FOUND", 404)
    return rec, None


@records_bp.get("/<int:record_id>")
@jwt_required()
def get_record(record_id: int):
    user = _current_user()
    if user is None:
        return error_response("Unauthorized", "UNAUTHORIZED", 401)

    rec, err = _get_owned_record_or_404(user, record_id)
    if err is not None:
        return err
    assert rec is not None
    return jsonify(_serialize_record(rec))


@records_bp.put("/<int:record_id>")
@jwt_required()
def update_record(record_id: int):
    user = _current_user()
    if user is None:
        return error_response("Unauthorized", "UNAUTHORIZED", 401)

    rec, err = _get_owned_record_or_404(user, record_id)
    if err is not None:
        return err
    assert rec is not None

    payload = request.get_json(silent=True) or {}

    if "timestamp" in payload:
        ts = payload.get("timestamp")
        if ts is None or str(ts).strip() == "":
            return error_response("Invalid timestamp", "INVALID_REQUEST", 400)
        normalized = _normalize_iso_timestamp(str(ts))
        if normalized is None:
            return error_response("Invalid timestamp", "INVALID_REQUEST", 400)
        rec.timestamp = normalized

    if "duration" in payload:
        duration = payload.get("duration")
        if (err2 := _validate_enum("duration", duration, ALLOWED_DURATION)) is not None:
            return err2
        assert isinstance(duration, str)
        rec.duration = duration

    if "type_id" in payload:
        type_id_int, err2 = _validate_type_id(payload.get("type_id"))
        if err2 is not None:
            return err2
        rec.type_id = type_id_int

    if "smell_level" in payload:
        smell_level = payload.get("smell_level")
        if (
            err2 := _validate_enum("smell_level", smell_level, ALLOWED_SMELL_LEVEL)
        ) is not None:
            return err2
        assert isinstance(smell_level, str)
        rec.smell_level = smell_level

    if "temperature" in payload:
        temperature = payload.get("temperature")
        if (
            err2 := _validate_enum("temperature", temperature, ALLOWED_TEMPERATURE)
        ) is not None:
            return err2
        assert isinstance(temperature, str)
        rec.temperature = temperature

    if "moisture" in payload:
        moisture = payload.get("moisture")
        if (err2 := _validate_enum("moisture", moisture, ALLOWED_MOISTURE)) is not None:
            return err2
        assert isinstance(moisture, str)
        rec.moisture = moisture

    if "notes" in payload:
        rec.notes = payload.get("notes")

    db.session.commit()
    return jsonify(_serialize_record(rec))


@records_bp.delete("/<int:record_id>")
@jwt_required()
def delete_record(record_id: int):
    user = _current_user()
    if user is None:
        return error_response("Unauthorized", "UNAUTHORIZED", 401)

    rec, err = _get_owned_record_or_404(user, record_id)
    if err is not None:
        return err
    assert rec is not None

    db.session.delete(rec)
    db.session.commit()
    return jsonify({"status": "ok"})
