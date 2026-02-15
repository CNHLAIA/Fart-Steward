from __future__ import annotations

from typing import Any

from flask import Blueprint, jsonify, request

from auth import error_response, get_jwt_identity, jwt_required
from models import FartType, User, db


fart_types_bp = Blueprint("fart_types", __name__, url_prefix="/fart-types")


def _current_user() -> User | None:
    identity = get_jwt_identity()
    if not identity:
        return None
    try:
        user_id = int(identity)
    except (TypeError, ValueError):
        return None
    return User.query.get(user_id)


def _serialize_type(ft: FartType) -> dict[str, Any]:
    return {"id": int(ft.id), "name": ft.name, "is_preset": bool(ft.is_preset)}


@fart_types_bp.get("")
@jwt_required()
def list_fart_types():
    if _current_user() is None:
        return error_response("Unauthorized", "UNAUTHORIZED", 401)

    types = FartType.query.order_by(
        FartType.is_preset.desc(), FartType.name.asc()
    ).all()
    return jsonify([_serialize_type(ft) for ft in types])


@fart_types_bp.post("")
@jwt_required()
def create_fart_type():
    if _current_user() is None:
        return error_response("Unauthorized", "UNAUTHORIZED", 401)

    payload = request.get_json(silent=True) or {}
    name = (payload.get("name") or "").strip()
    if not name:
        return error_response("Missing name", "INVALID_REQUEST", 400)

    if FartType.query.filter_by(name=name).first() is not None:
        return error_response("Type already exists", "TYPE_EXISTS", 409)

    ft = FartType()
    ft.name = name
    ft.is_preset = False
    db.session.add(ft)
    db.session.commit()

    return jsonify(_serialize_type(ft)), 201
