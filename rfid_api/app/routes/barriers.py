from fastapi import APIRouter, Query, HTTPException

router = APIRouter(prefix="/barrera", tags=["Barrera"])

@router.get("/control")
def barrera_control(endpoint: str = Query(...), action: str = Query(...)):
    if action not in ("open", "close"):
        raise HTTPException(status_code=400, detail="Acción no válida (use open/close)")
    return {"status": "ok", "mensaje": f"Barrera {endpoint} → {action}"}
