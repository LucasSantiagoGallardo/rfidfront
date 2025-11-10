from fastapi import APIRouter, Query
from app.core.database import get_connection
from loguru import logger

router = APIRouter(prefix="/lecturas", tags=["Lecturas"])

@router.get("/por-hora")
def lecturas_por_hora(
    lector: str | None = Query(None),
    desde: str | None = Query(None),
    hasta: str | None = Query(None)
):
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)

    sql = """
        SELECT 
            DATE_FORMAT(fecha, '%Y-%m-%d %H:00:00') as hora,
            COUNT(*) as cantidad,
            lector
        FROM lecturas
        WHERE 1=1
    """
    params = []
    if lector:
        sql += " AND lector = %s"
        params.append(lector)
    if desde and hasta:
        sql += " AND fecha BETWEEN %s AND %s"
        params.extend([desde, hasta])
    sql += " GROUP BY hora, lector ORDER BY hora ASC"

    cursor.execute(sql, tuple(params))
    data = cursor.fetchall()
    cursor.close()
    conn.close()

    logger.info(f"📈 {len(data)} registros devueltos en /por-hora")
    return data


@router.get("/por-dia")
def lecturas_por_dia(
    lector: str | None = Query(None),
    dias: int = Query(7)
):
    """Devuelve lecturas agrupadas por día (últimos N días)."""
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)

    sql = """
        SELECT 
            DATE(fecha) as dia,
            COUNT(*) as cantidad,
            lector
        FROM lecturas
        WHERE fecha >= DATE_SUB(CURDATE(), INTERVAL %s DAY)
    """
    params = [dias]
    if lector:
        sql += " AND lector = %s"
        params.append(lector)
    sql += " GROUP BY dia, lector ORDER BY dia ASC"

    cursor.execute(sql, tuple(params))
    data = cursor.fetchall()
    cursor.close()
    conn.close()

    logger.info(f"📊 {len(data)} registros devueltos en /por-dia")
    return data
