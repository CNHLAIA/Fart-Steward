from sqlalchemy import CheckConstraint, Index, ForeignKey, text

from flask_sqlalchemy import SQLAlchemy


db = SQLAlchemy()


class User(db.Model):
    __tablename__ = "users"

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    username = db.Column(db.Text, unique=True, nullable=False)
    password_hash = db.Column(db.Text, nullable=False)
    created_at = db.Column(db.TIMESTAMP, server_default=text("CURRENT_TIMESTAMP"))


class FartType(db.Model):
    __tablename__ = "fart_types"

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    name = db.Column(db.Text, unique=True, nullable=False)
    is_preset = db.Column(db.Boolean, server_default=text("0"), nullable=False)


class FartRecord(db.Model):
    __tablename__ = "fart_records"

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    user_id = db.Column(
        db.Integer,
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
    )
    timestamp = db.Column(db.Text, nullable=False)
    duration = db.Column(db.Text, nullable=False)
    type_id = db.Column(db.Integer, ForeignKey("fart_types.id"), nullable=False)
    smell_level = db.Column(db.Text, nullable=False)
    temperature = db.Column(db.Text, nullable=False)
    moisture = db.Column(db.Text, nullable=False)
    notes = db.Column(db.Text)
    created_at = db.Column(db.Text, server_default=text("(datetime('now'))"))

    __table_args__ = (
        CheckConstraint(
            "duration IN ('very_short','short','medium','long')",
            name="ck_fart_records_duration",
        ),
        CheckConstraint(
            "smell_level IN ('mild','tolerable','stinky','extremely_stinky')",
            name="ck_fart_records_smell_level",
        ),
        CheckConstraint(
            "temperature IN ('hot','cold')",
            name="ck_fart_records_temperature",
        ),
        CheckConstraint(
            "moisture IN ('moist','dry')",
            name="ck_fart_records_moisture",
        ),
        Index("idx_records_user_ts", "user_id", "timestamp"),
    )
