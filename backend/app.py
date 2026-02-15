import os

from flask import Flask
from flask_cors import CORS

from auth import init_jwt
from config import Config
from models import db, FartType
from routes import register_blueprints


PRESET_FART_TYPES = ["响屁", "闷屁", "连环屁", "无声屁", "喷射屁"]


def _ensure_sqlite_dir(app: Flask) -> None:
    uri = app.config.get("SQLALCHEMY_DATABASE_URI", "")
    if not uri.startswith("sqlite:"):
        return

    sqlite_path = app.config.get("SQLITE_PATH")
    if not sqlite_path:
        sqlite_path = uri.replace("sqlite:///", "", 1)

    directory = os.path.dirname(os.path.abspath(sqlite_path))
    if directory:
        os.makedirs(directory, exist_ok=True)


def _seed_preset_fart_types() -> None:
    existing = {
        ft.name
        for ft in FartType.query.filter(FartType.name.in_(PRESET_FART_TYPES)).all()
    }
    to_add = []
    for name in PRESET_FART_TYPES:
        if name in existing:
            continue
        ft = FartType()
        ft.name = name
        ft.is_preset = True
        to_add.append(ft)
    if not to_add:
        return
    db.session.add_all(to_add)
    db.session.commit()


def create_app(config_object=None):
    app = Flask(__name__)
    app.config.from_object(config_object or Config)

    init_jwt(app)

    _ensure_sqlite_dir(app)

    CORS(app, resources={r"/api/*": {"origins": "*"}})
    db.init_app(app)
    register_blueprints(app)

    with app.app_context():
        db.create_all()
        _seed_preset_fart_types()

    return app
