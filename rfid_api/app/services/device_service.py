from app.core.database import get_connection
from loguru import logger

TABLE = "lectores"

def get_all_devices():
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute(f"SELECT * FROM {TABLE}")
    data = cursor.fetchall()
    cursor.close()
    conn.close()
    return data

def get_device_by_endpoint(endpoint: str):
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute(f"SELECT * FROM {TABLE} WHERE endpoint = %s", (endpoint,))
    data = cursor.fetchone()
    cursor.close()
    conn.close()
    return data

def create_device(data: dict):
    conn = get_connection()
    cursor = conn.cursor()
    sql = f"""
        INSERT INTO {TABLE} (nombre, ip, puerto, endpoint, rele_on, rele_off, rtsp_url, lectura_auto)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
    """
    values = (
        data["nombre"], data["ip"], data["puerto"], data["endpoint"],
        data["rele_on"], data["rele_off"], data.get("rtsp_url"),
        data.get("lectura_auto", True),
    )
    cursor.execute(sql, values)
    conn.commit()
    cursor.close()
    conn.close()
    logger.info(f"✅ Lector creado: {data['nombre']} ({data['endpoint']})")
    return {"status": "ok", "mensaje": "Lector creado correctamente"}

def update_device(endpoint: str, data: dict):
    conn = get_connection()
    cursor = conn.cursor()
    sql = f"""
        UPDATE {TABLE}
        SET nombre=%s, ip=%s, puerto=%s, rele_on=%s, rele_off=%s, rtsp_url=%s, lectura_auto=%s
        WHERE endpoint=%s
    """
    cursor.execute(sql, (
        data["nombre"], data["ip"], data["puerto"],
        data["rele_on"], data["rele_off"], data.get("rtsp_url"),
        data.get("lectura_auto", True), endpoint
    ))
    conn.commit()
    cursor.close()
    conn.close()
    logger.info(f"✏️ Lector actualizado: {endpoint}")
    return {"status": "ok", "mensaje": "Lector actualizado"}

def delete_device(endpoint: str):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute(f"DELETE FROM {TABLE} WHERE endpoint=%s", (endpoint,))
    conn.commit()
    cursor.close()
    conn.close()
    logger.warning(f"🗑️ Lector eliminado: {endpoint}")
    return {"status": "ok", "mensaje": f"Lector '{endpoint}' eliminado"}
