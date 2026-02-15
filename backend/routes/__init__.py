from flask import Blueprint, jsonify

from routes.auth import auth_bp  # pyright: ignore[reportMissingImports]
from routes.export import export_bp  # pyright: ignore[reportMissingImports]
from routes.fart_types import fart_types_bp  # pyright: ignore[reportMissingImports]
from routes.records import records_bp  # pyright: ignore[reportMissingImports]
from routes.analytics import analytics_bp  # pyright: ignore[reportMissingImports]


api_bp = Blueprint("api", __name__, url_prefix="/api")

api_bp.register_blueprint(auth_bp)
api_bp.register_blueprint(records_bp)
api_bp.register_blueprint(fart_types_bp)
api_bp.register_blueprint(export_bp)
api_bp.register_blueprint(analytics_bp)


@api_bp.get("/health")
def health():
    return jsonify({"status": "ok"})


def register_blueprints(app):
    app.register_blueprint(api_bp)
