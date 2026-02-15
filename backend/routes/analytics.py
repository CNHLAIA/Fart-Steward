from __future__ import annotations

from datetime import datetime, timedelta, timezone
from typing import Any

from flask import Blueprint, jsonify, request
from sqlalchemy import func, text

from auth import error_response, get_jwt_identity, jwt_required
from models import FartRecord, FartType, User, db

analytics_bp = Blueprint("analytics", __name__, url_prefix="/analytics")


def _current_user() -> User | None:
    identity = get_jwt_identity()
    if not identity:
        return None
    try:
        user_id = int(identity)
    except (TypeError, ValueError):
        return None
    return User.query.get(user_id)


def _parse_date_boundary(value: str, end_of_day: bool) -> str | None:
    raw = (value or "").strip()
    if not raw:
        return None

    if len(raw) == 10 and raw[4] == "-" and raw[7] == "-":
        if end_of_day:
            raw = raw + "T23:59:59Z"
        else:
            raw = raw + "T00:00:00Z"

    try:
        if raw.endswith("Z"):
            raw = raw[:-1] + "+00:00"
        dt = datetime.fromisoformat(raw)
        if dt.tzinfo is None:
            dt = dt.replace(tzinfo=timezone.utc)
        return dt.astimezone(timezone.utc).isoformat().replace("+00:00", "Z")
    except ValueError:
        return None


def _apply_filters(q):
    date_from = _parse_date_boundary(
        request.args.get("date_from", ""), end_of_day=False
    )
    date_to = _parse_date_boundary(request.args.get("date_to", ""), end_of_day=True)

    if date_from:
        q = q.filter(FartRecord.timestamp >= date_from)
    if date_to:
        q = q.filter(FartRecord.timestamp <= date_to)

    days = request.args.get("days")
    if days:
        try:
            days_int = int(days)
            cutoff = (datetime.now(timezone.utc) - timedelta(days=days_int)).isoformat()
            q = q.filter(FartRecord.timestamp >= cutoff)
        except ValueError:
            pass

    weeks = request.args.get("weeks")
    if weeks:
        try:
            weeks_int = int(weeks)
            cutoff = (
                datetime.now(timezone.utc) - timedelta(weeks=weeks_int)
            ).isoformat()
            q = q.filter(FartRecord.timestamp >= cutoff)
        except ValueError:
            pass

    return q


@analytics_bp.get("/daily-count")
@jwt_required()
def daily_count():
    user = _current_user()
    if user is None:
        return error_response("Unauthorized", "UNAUTHORIZED", 401)

    q = db.session.query(
        func.substr(FartRecord.timestamp, 1, 10).label("date"),
        func.count(FartRecord.id).label("count"),
    ).filter(FartRecord.user_id == user.id)

    q = _apply_filters(q)

    results = q.group_by(text("date")).order_by(text("date")).all()

    dates = [r.date for r in results]
    counts = [r.count for r in results]

    return jsonify({"dates": dates, "counts": counts})


@analytics_bp.get("/weekly-count")
@jwt_required()
def weekly_count():
    user = _current_user()
    if user is None:
        return error_response("Unauthorized", "UNAUTHORIZED", 401)

    q = db.session.query(
        func.strftime("%Y-%W", FartRecord.timestamp).label("week"),
        func.count(FartRecord.id).label("count"),
    ).filter(FartRecord.user_id == user.id)

    q = _apply_filters(q)

    results = q.group_by(text("week")).order_by(text("week")).all()

    weeks = [r.week for r in results]
    counts = [r.count for r in results]

    return jsonify({"weeks": weeks, "counts": counts})


@analytics_bp.get("/type-distribution")
@jwt_required()
def type_distribution():
    user = _current_user()
    if user is None:
        return error_response("Unauthorized", "UNAUTHORIZED", 401)

    q = (
        db.session.query(FartType.name, func.count(FartRecord.id).label("count"))
        .join(FartType, FartRecord.type_id == FartType.id)
        .filter(FartRecord.user_id == user.id)
    )

    q = _apply_filters(q)

    results = q.group_by(FartType.name).all()

    data = [{"name": r.name, "value": r.count} for r in results]

    return jsonify(data)


@analytics_bp.get("/smell-distribution")
@jwt_required()
def smell_distribution():
    user = _current_user()
    if user is None:
        return error_response("Unauthorized", "UNAUTHORIZED", 401)

    q = db.session.query(
        FartRecord.smell_level, func.count(FartRecord.id).label("count")
    ).filter(FartRecord.user_id == user.id)

    q = _apply_filters(q)

    results = q.group_by(FartRecord.smell_level).all()

    categories = [r.smell_level for r in results]
    values = [r.count for r in results]

    return jsonify({"categories": categories, "values": values})


@analytics_bp.get("/hourly-heatmap")
@jwt_required()
def hourly_heatmap():
    user = _current_user()
    if user is None:
        return error_response("Unauthorized", "UNAUTHORIZED", 401)

    q = db.session.query(
        func.strftime("%w", FartRecord.timestamp).label("dow"),
        func.strftime("%H", FartRecord.timestamp).label("hour"),
        func.count(FartRecord.id).label("count"),
    ).filter(FartRecord.user_id == user.id)

    q = _apply_filters(q)

    results = q.group_by(text("dow"), text("hour")).all()

    data = []
    for r in results:
        data.append([int(r.hour), int(r.dow), r.count])

    return jsonify(data)


@analytics_bp.get("/duration-distribution")
@jwt_required()
def duration_distribution():
    user = _current_user()
    if user is None:
        return error_response("Unauthorized", "UNAUTHORIZED", 401)

    q = db.session.query(
        FartRecord.duration, func.count(FartRecord.id).label("count")
    ).filter(FartRecord.user_id == user.id)

    q = _apply_filters(q)

    results = q.group_by(FartRecord.duration).all()

    data = [{"name": r.duration, "value": r.count} for r in results]

    return jsonify(data)


@analytics_bp.get("/cross-analysis")
@jwt_required()
def cross_analysis():
    user = _current_user()
    if user is None:
        return error_response("Unauthorized", "UNAUTHORIZED", 401)

    smell_map = {"mild": 1, "tolerable": 2, "stinky": 3, "extremely_stinky": 4}
    duration_map = {"very_short": 1, "short": 2, "medium": 3, "long": 4}

    q = db.session.query(
        FartRecord.smell_level,
        FartRecord.duration,
        FartRecord.temperature,
        FartRecord.moisture,
    ).filter(FartRecord.user_id == user.id)

    q = _apply_filters(q)

    results = q.all()

    data = []
    for r in results:
        s_val = smell_map.get(r.smell_level, 0)
        d_val = duration_map.get(r.duration, 0)
        data.append(
            {
                "value": [d_val, s_val],
                "meta": {
                    "smell": r.smell_level,
                    "duration": r.duration,
                    "temperature": r.temperature,
                    "moisture": r.moisture,
                },
            }
        )

    return jsonify(data)
