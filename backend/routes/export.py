from io import BytesIO, StringIO

from flask import Blueprint, Response, request
from openpyxl import Workbook

from auth import auth_required, get_current_user
from models import FartRecord, FartType

export_bp = Blueprint("export", __name__, url_prefix="/export")

CSV_HEADERS = ["时间", "时长", "类型", "臭味程度", "温感", "湿感", "备注"]

DURATION_LABELS = {
    "very_short": "极短",
    "short": "短",
    "medium": "中",
    "long": "长",
}

SMELL_LABELS = {
    "mild": "轻微",
    "tolerable": "可忍受",
    "stinky": "臭",
    "extremely_stinky": "极臭",
}

TEMPERATURE_LABELS = {
    "hot": "热",
    "cold": "冷",
}

MOISTURE_LABELS = {
    "moist": "湿",
    "dry": "干",
}


def _get_filtered_records(user_id: int):
    query = FartRecord.query.filter_by(user_id=user_id)

    date_from = request.args.get("date_from")
    date_to = request.args.get("date_to")

    if date_from:
        query = query.filter(FartRecord.timestamp >= f"{date_from}T00:00:00Z")
    if date_to:
        query = query.filter(FartRecord.timestamp <= f"{date_to}T23:59:59Z")

    return query.order_by(FartRecord.timestamp.desc()).all()


def _get_type_name(type_id: int) -> str:
    ft = FartType.query.get(type_id)
    return ft.name if ft else "未知"


def _record_to_row(record: FartRecord) -> list:
    return [
        record.timestamp,
        DURATION_LABELS.get(record.duration, record.duration),
        _get_type_name(record.type_id),
        SMELL_LABELS.get(record.smell_level, record.smell_level),
        TEMPERATURE_LABELS.get(record.temperature, record.temperature),
        MOISTURE_LABELS.get(record.moisture, record.moisture),
        record.notes or "",
    ]


@export_bp.get("/csv")
@auth_required
def export_csv():
    user = get_current_user()
    assert user is not None
    records = _get_filtered_records(user.id)

    output = StringIO()
    output.write("\ufeff")

    output.write(",".join(CSV_HEADERS) + "\n")

    for record in records:
        row = _record_to_row(record)
        escaped_row = ['"' + str(v).replace('"', '""') + '"' for v in row]
        output.write(",".join(escaped_row) + "\n")

    content = output.getvalue()

    return Response(
        content,
        mimetype="text/csv; charset=utf-8",
        headers={"Content-Disposition": "attachment; filename=fart_records.csv"},
    )


@export_bp.get("/excel")
@auth_required
def export_excel():
    user = get_current_user()
    assert user is not None
    records = _get_filtered_records(user.id)

    wb = Workbook()
    ws = wb.active
    assert ws is not None
    ws.title = "屁屁记录"

    ws.append(CSV_HEADERS)

    for record in records:
        ws.append(_record_to_row(record))

    for col in range(1, len(CSV_HEADERS) + 1):
        ws.column_dimensions[chr(64 + col)].width = 15

    output = BytesIO()
    wb.save(output)
    output.seek(0)

    return Response(
        output.getvalue(),
        mimetype="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": "attachment; filename=fart_records.xlsx"},
    )
