import time
from loguru import logger
from app.core.database import get_connection  # ✅ conexión a MySQL

# Diccionario global con estado actual de cada lector
LECTOR_STATE = {}

def init_lector(endpoint: str):
    """Inicializa o actualiza el estado de un lector al conectarse."""
    if endpoint not in LECTOR_STATE:
        LECTOR_STATE[endpoint] = {
            "conectado": True,
            "uptime_start": time.time(),
            "lecturas_hoy": 0,
            "logs": [],
        }
    else:
        LECTOR_STATE[endpoint]["conectado"] = True
        LECTOR_STATE[endpoint]["uptime_start"] = time.time()

    msg = f"{_timestamp()} — ✅ Conectado"
    LECTOR_STATE[endpoint]["logs"].append(msg)
    _registrar_log(endpoint, "conexion", msg)
    logger.info(f"[{endpoint}] Conectado")

def desconectar_lector(endpoint: str):
    """Marca un lector como desconectado."""
    if endpoint not in LECTOR_STATE:
        LECTOR_STATE[endpoint] = {"logs": []}
    LECTOR_STATE[endpoint]["conectado"] = False

    msg = f"{_timestamp()} — ❌ Desconectado"
    LECTOR_STATE[endpoint]["logs"].append(msg)
    _registrar_log(endpoint, "desconexion", msg)
    logger.warning(f"[{endpoint}] Desconectado")

def registrar_lectura(endpoint: str):
    """Incrementa contador de lecturas del día."""
    if endpoint not in LECTOR_STATE:
        init_lector(endpoint)
    LECTOR_STATE[endpoint]["lecturas_hoy"] += 1
    msg = f"{_timestamp()} — 🔖 Nueva lectura"
    LECTOR_STATE[endpoint]["logs"].append(msg)
    _registrar_log(endpoint, "lectura", msg)

def registrar_error(endpoint: str, error: str):
    """Registra un error de conexión o lectura."""
    if endpoint not in LECTOR_STATE:
        LECTOR_STATE[endpoint] = {"logs": []}
    msg = f"{_timestamp()} — ⚠️ Error: {error}"
    LECTOR_STATE[endpoint]["logs"].append(msg)
    _registrar_log(endpoint, "error", error)
    logger.error(f"[{endpoint}] {error}")

def get_estado_completo():
    """Devuelve el estado actual de todos los lectores."""
    salida = {}
    for endpoint, data in LECTOR_STATE.items():
        uptime = 0
        if data.get("conectado") and data.get("uptime_start"):
            uptime = int(time.time() - data["uptime_start"])
        salida[endpoint] = {
            "conectado": data.get("conectado", False),
            "tiempo_online": _fmt_tiempo(uptime),
            "lecturas_hoy": data.get("lecturas_hoy", 0),
            "logs": data.get("logs", [])[-20:],
        }
    return salida

# === Funciones internas ===

def _registrar_log(endpoint: str, tipo_evento: str, mensaje: str):
    """Guarda un evento en la tabla logs_lectores."""
    try:
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO logs_lectores (endpoint, tipo_evento, mensaje)
            VALUES (%s, %s, %s)
        """, (endpoint, tipo_evento, mensaje))
        conn.commit()
        cursor.close()
        conn.close()
    except Exception as e:
        logger.error(f"[{endpoint}] Error guardando log en DB: {e}")

def _fmt_tiempo(segundos: int) -> str:
    m, s = divmod(segundos, 60)
    h, m = divmod(m, 60)
    return f"{h}h {m}m {s}s"

def _timestamp() -> str:
    return time.strftime("%H:%M:%S", time.localtime())
