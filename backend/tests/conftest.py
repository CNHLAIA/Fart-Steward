import os

import pytest

from app import create_app
from config import TestingConfig
from models import db


@pytest.fixture()
def app(tmp_path):
    db_path = tmp_path / "test.db"
    cfg = type(
        "TestConfig",
        (TestingConfig,),
        {
            "SQLITE_PATH": str(db_path),
            "SQLALCHEMY_DATABASE_URI": f"sqlite:///{db_path}",
        },
    )

    app = create_app(cfg)
    yield app

    with app.app_context():
        db.session.remove()
        db.drop_all()
        try:
            db.engine.dispose()
        except Exception:
            pass
    try:
        if os.path.exists(db_path):
            os.remove(db_path)
    except OSError:
        pass


@pytest.fixture()
def client(app):
    return app.test_client()
