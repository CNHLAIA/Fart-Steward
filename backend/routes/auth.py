from flask import Blueprint, request, jsonify

from auth import (
    auth_required,
    create_token_for_user,
    error_response,
    hash_password,
    verify_password,
    get_current_user,
)
from models import User, db


auth_bp = Blueprint("auth", __name__, url_prefix="/auth")


@auth_bp.post("/register")
def register():
    payload = request.get_json(silent=True) or {}
    username = (payload.get("username") or "").strip()
    password = payload.get("password") or ""

    if not username or not password:
        return error_response("Missing username or password", "INVALID_REQUEST", 400)

    username_lc = username.lower()
    if User.query.filter_by(username=username_lc).first() is not None:
        return error_response("Username already taken", "USERNAME_TAKEN", 409)

    user = User()
    user.username = username_lc
    user.password_hash = hash_password(password)
    db.session.add(user)
    db.session.commit()

    token = create_token_for_user(user)
    return jsonify({"token": token, "user": {"username": user.username}}), 201


@auth_bp.post("/login")
def login():
    payload = request.get_json(silent=True) or {}
    username = (payload.get("username") or "").strip()
    password = payload.get("password") or ""

    if not username or not password:
        return error_response("Missing username or password", "INVALID_REQUEST", 400)

    username_lc = username.lower()
    user = User.query.filter_by(username=username_lc).first()
    if user is None or not verify_password(password, user.password_hash):
        return error_response("Invalid credentials", "INVALID_CREDENTIALS", 401)

    token = create_token_for_user(user)
    return jsonify({"token": token, "user": {"username": user.username}})


@auth_bp.post("/logout")
def logout():
    return jsonify({"status": "ok"})


@auth_bp.get("/me")
@auth_required
def me():
    user = get_current_user()
    if user is None:
        return error_response("Unauthorized", "UNAUTHORIZED", 401)
    return jsonify({"user": {"username": user.username}})
