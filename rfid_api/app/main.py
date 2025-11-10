from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routes import readers, barriers, state, ws, export, lecturas  # ✅ agregado lecturas

from app.core.logger import logger
from app.services.lector_controller import LectorThread
from app.core.database import get_connection
import threading
import time

# 🚀 Inicialización de FastAPI primero
app = FastAPI(title="RFID Access API", version="2.0.0")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Rutas
app.include_router(readers.router)
app.include_router(barriers.router)
app.include_router(state.router)
app.include_router(ws.router)
app.include_router(export.router)
app.include_router(lecturas.router)  # ✅ NUEVO
# ====================================================
# 🔧 Inicialización de lectores en segundo plano
# ====================================================

def init_lectores():
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("SELECT * FROM lectores")
    lectores = cursor.fetchall()
    cursor.close()
    conn.close()

    logger.info(f"📡 Iniciando {len(lectores)} lectores...")
    for lector in lectores:
        t = LectorThread(
            lector["nombre"],
            lector["ip"],
            lector["puerto"],
            lector["endpoint"],
            lector["rele_on"],
            lector["rele_off"],
            backend_validate_url="http://10.10.67.195/adeco/api/vtag.php"
        )
        threading.Thread(target=t.conectar, daemon=True).start()
        time.sleep(0.5)

# ✅ Ahora que app ya existe, podemos usar el decorador
@app.on_event("startup")
def startup_event():
    threading.Thread(target=init_lectores, daemon=True).start()

# ====================================================
# Endpoint raíz
# ====================================================

@app.get("/")
def root():
    logger.info("🟢 API raíz consultada")
    return {"status": "ok", "mensaje": "RFID Access API 2.0 lista!"}
