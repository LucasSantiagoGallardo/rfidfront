from fastapi import APIRouter, WebSocket, WebSocketDisconnect
import json
import asyncio

router = APIRouter(tags=["WebSocket"])

# Lista global de conexiones activas
active_connections: list[WebSocket] = []

@router.websocket("/ws")
async def websocket_endpoint(ws: WebSocket):
    await ws.accept()
    active_connections.append(ws)
    print(f"📡 Cliente conectado ({len(active_connections)} conexiones activas)")
    try:
        while True:
            # Escuchamos mensajes del cliente (por ahora no los usamos)
            await ws.receive_text()
    except WebSocketDisconnect:
        active_connections.remove(ws)
        print(f"❌ Cliente desconectado ({len(active_connections)} activas)")

# 🔹 NUEVA FUNCIÓN: broadcast_event
def broadcast_event(event: dict):
    """
    Envía un mensaje JSON a todos los clientes conectados vía WebSocket.
    Puede ser llamado desde cualquier parte del backend.
    """
    try:
        loop = asyncio.get_event_loop()
        if loop.is_running():
            asyncio.run_coroutine_threadsafe(_broadcast_async(event), loop)
        else:
            loop.run_until_complete(_broadcast_async(event))
    except RuntimeError:
        # Si no hay loop activo (p.ej. en threads), crear uno nuevo
        asyncio.run(_broadcast_async(event))

async def _broadcast_async(event: dict):
    """Envía de forma asíncrona a todas las conexiones activas."""
    message = json.dumps(event, default=str)
    for ws in list(active_connections):
        try:
            await ws.send_text(message)
        except Exception:
            try:
                active_connections.remove(ws)
            except ValueError:
                pass
