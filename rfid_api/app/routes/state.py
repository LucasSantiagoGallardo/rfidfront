from fastapi import APIRouter
from fastapi.responses import JSONResponse
from app.services import state_service

router = APIRouter(prefix="/estado-lectores", tags=["Estado"])

@router.get("/")
def listar_estados():
    data = state_service.get_estado_completo()
    return JSONResponse(content=data)

@router.get("/logs/{endpoint}")
def obtener_logs(endpoint: str):
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute(
        "SELECT * FROM logs_lectores WHERE endpoint = %s ORDER BY fecha DESC LIMIT 100",
        (endpoint,)
    )
    data = cursor.fetchall()
    cursor.close()
    conn.close()
    return data

@router.get("/{endpoint}")
def estado_individual(endpoint: str):
    data = state_service.get_estado_completo().get(endpoint)
    if not data:
        return {"status": "error", "mensaje": f"Lector '{endpoint}' no encontrado"}
    return data

@router.get("/resumen")
def resumen_general():
    """Devuelve un resumen de los estados."""
    estados = state_service.get_estado_completo()
    total = len(estados)
    conectados = sum(1 for e in estados.values() if e["conectado"])
    total_lecturas = sum(e["lecturas_hoy"] for e in estados.values())
    return {
        "total_lectores": total,
        "conectados": conectados,
        "desconectados": total - conectados,
        "total_lecturas_hoy": total_lecturas
    }