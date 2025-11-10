from app.core.database import get_connection
from loguru import logger
from datetime import datetime

def validar_tag(uid: str, lector: str) -> dict:
    """
    Valida un tag RFID contra la base de datos 'adeco2'.
    Verifica si el tag existe en 'dni', si está activo y registra el evento en 'hist' y 'lecturas'.
    """
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)

    try:
        # 1️⃣ Buscar el UID en la tabla DNI
        cursor.execute("SELECT * FROM dni WHERE tag = %s", (uid,))
        persona = cursor.fetchone()

        if not persona:
            logger.warning(f"[{lector}] UID {uid} no registrado en tabla DNI.")
            registrar_hist(cursor, lector, uid, estado="denegado", resultado="tag_no_registrado")
            conn.commit()
            return {"autorizado": False, "motivo": "tag_no_registrado"}

        dni = persona["Dni"]
        nombre = persona.get("Name", "")
        apellido = persona.get("Last_Name", "")
        activo = str(persona.get("Active", "")).lower() in ("1", "true", "si", "activo")

        if not activo:
            logger.info(f"[{lector}] UID {uid} pertenece a {nombre} {apellido} — INACTIVO")
            registrar_hist(cursor, lector, uid, dni, nombre, apellido, estado="denegado", resultado="inactivo")
            conn.commit()
            return {"autorizado": False, "dni": dni, "nombre": nombre, "apellido": apellido, "motivo": "inactivo"}

        # 2️⃣ Usuario activo → autorizado
        logger.info(f"[{lector}] ✅ {nombre} {apellido} ({dni}) autorizado")
        registrar_hist(cursor, lector, uid, dni, nombre, apellido, estado="permitido", resultado="ok")
        registrar_lectura(cursor, uid, lector, dni, nombre, apellido, estado="permitido")
        conn.commit()

        return {
            "autorizado": True,
            "dni": dni,
            "nombre": nombre,
            "apellido": apellido,
            "motivo": "ok"
        }

    except Exception as e:
        logger.error(f"[{lector}] Error validando UID {uid}: {e}")
        return {"autorizado": False, "motivo": "error"}
    finally:
        cursor.close()
        conn.close()


def registrar_hist(cursor, lector, uid, dni=None, nombre=None, apellido=None, estado="denegado", resultado="error"):
    """Registra un intento de acceso en la tabla hist."""
    cursor.execute("""
        INSERT INTO hist (Id_Key, dni, barrera, estado, nombre, apellido, resultado)
        VALUES (%s, %s, %s, %s, %s, %s, %s)
    """, (uid, dni, lector, estado, nombre, apellido, resultado))


def registrar_lectura(cursor, uid, lector, dni, nombre, apellido, estado):
    """Guarda una lectura en la tabla lecturas."""
    cursor.execute("""
        INSERT INTO lecturas (uid, lector, estado, dni, nombre, apellido, fecha)
        VALUES (%s, %s, %s, %s, %s, %s, %s)
    """, (uid, lector, estado, dni, nombre, apellido, datetime.now()))
