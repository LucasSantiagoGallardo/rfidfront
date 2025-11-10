from fastapi import APIRouter, HTTPException, Body
from app.core.database import get_connection

router = APIRouter(prefix="/lectores", tags=["Lectores"])

@router.get("/")
def listar_lectores():
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("SELECT * FROM lectores")
    data = cursor.fetchall()
    cursor.close()
    conn.close()
    return data

@router.post("/")
def crear_lector(data: dict = Body(...)):
    conn = get_connection()
    cursor = conn.cursor()
    sql = """
        INSERT INTO lectores (nombre, ip, puerto, endpoint, rele_on, rele_off, rtsp_url, lectura_auto)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
    """
    cursor.execute(sql, (
        data["nombre"], data["ip"], data["puerto"], data["endpoint"],
        data["rele_on"], data["rele_off"], data.get("rtsp_url"), data.get("lectura_auto", True)
    ))
    conn.commit()
    cursor.close()
    conn.close()
    return {"status": "ok", "mensaje": "Lector creado correctamente"}
