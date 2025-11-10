from fastapi import APIRouter, Query
from fastapi.responses import StreamingResponse
import io, csv
from app.core.database import get_connection
from loguru import logger

router = APIRouter(prefix="/export", tags=["Exportaciones"])

@router.get("/logs")
def exportar_logs(
    endpoint: str | None = Query(None),
    desde: str | None = Query(None),
    hasta: str | None = Query(None)
):
    """
    Exporta los logs de lectores a CSV. Permite filtrar por endpoint y rango de fechas.
    """
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)

    sql = "SELECT * FROM logs_lectores WHERE 1=1"
    params = []

    if endpoint:
        sql += " AND endpoint = %s"
        params.append(endpoint)
    if desde and hasta:
        sql += " AND fecha BETWEEN %s AND %s"
        params.extend([desde, hasta])
    sql += " ORDER BY fecha DESC"

    cursor.execute(sql, tuple(params))
    data = cursor.fetchall()
    cursor.close()
    conn.close()

    # Crear CSV en memoria
    output = io.StringIO()
    writer = csv.DictWriter(output, fieldnames=data[0].keys() if data else [])
    writer.writeheader()
    writer.writerows(data)
    output.seek(0)

    logger.info(f"📤 Exportando {len(data)} registros de logs a CSV")
    return StreamingResponse(output, media_type="text/csv", headers={
        "Content-Disposition": f"attachment; filename=logs_lectores.csv"
    })
