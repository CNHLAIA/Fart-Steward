from __future__ import annotations

from functools import wraps
from typing import Any, Callable, TypeVar, cast

import bcrypt
from flask import jsonify
from flask_jwt_extended import (
    JWTManager,
    create_access_token,
    get_jwt_identity,
    jwt_required,
)

from models import User


T = TypeVar("T", bound=Callable[..., Any])


def error_response(message: str, code: str, status_code: int):
    return jsonify({"error": message, "code": code}), status_code


def hash_password(password: str) -> str:
    hashed = bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt())
    return hashed.decode("utf-8")


def verify_password(password: str, password_hash: str) -> bool:
    try:
        return bcrypt.checkpw(password.encode("utf-8"), password_hash.encode("utf-8"))
    except ValueError:
        return False


def create_token_for_user(user: User) -> str:
    return cast(str, create_access_token(identity=str(user.id)))


def get_current_user() -> User | None:
    user_id = get_jwt_identity()
    if not user_id:
        return None
    try:
        user_id_int = int(user_id)
    except (TypeError, ValueError):
        return None
    return User.query.get(user_id_int)


def auth_required(fn: T) -> T:
    @wraps(fn)
    @jwt_required()
    def wrapper(*args: Any, **kwargs: Any):
        if get_current_user() is None:
            return error_response("Unauthorized", "UNAUTHORIZED", 401)
        return fn(*args, **kwargs)

    return cast(T, wrapper)


def init_jwt(app) -> JWTManager:
    jwt = JWTManager(app)

    @jwt.user_lookup_loader
    def _user_lookup_callback(_jwt_header, jwt_data):
        identity = jwt_data.get("sub")
        if identity is None:
            return None
        try:
            identity_int = int(identity)
        except (TypeError, ValueError):
            return None
        return User.query.get(identity_int)

    @jwt.unauthorized_loader
    def _unauthorized(_reason: str):
        return error_response("Unauthorized", "UNAUTHORIZED", 401)

    @jwt.invalid_token_loader
    def _invalid_token(_reason: str):
        return error_response("Invalid token", "INVALID_TOKEN", 401)

    @jwt.expired_token_loader
    def _expired_token(_jwt_header, _jwt_payload):
        return error_response("Token expired", "TOKEN_EXPIRED", 401)

    @jwt.revoked_token_loader
    def _revoked_token(_jwt_header, _jwt_payload):
        return error_response("Token revoked", "TOKEN_REVOKED", 401)

    @jwt.needs_fresh_token_loader
    def _needs_fresh(_jwt_header, _jwt_payload):
        return error_response("Fresh token required", "FRESH_TOKEN_REQUIRED", 401)

    @jwt.token_in_blocklist_loader
    def _token_in_blocklist(_jwt_header, _jwt_payload):
        return False

    _ = (
        _user_lookup_callback,
        _unauthorized,
        _invalid_token,
        _expired_token,
        _revoked_token,
        _needs_fresh,
        _token_in_blocklist,
    )

    return jwt
