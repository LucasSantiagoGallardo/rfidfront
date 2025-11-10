from fastapi import APIRouter, HTTPException, Body
from app.services import device_service

router = APIRouter(prefix="/lectores", tags=["Lectores"])

@router.get("/")
def listar_lectores():
    return device_service.get_all_devices()

@router.get("/{endpoint}")
def obtener_lector(endpoint: str):
    lector = device_service.get_device_by_endpoint(endpoint)
    if not lector:
        raise HTTPException(404, "Lector no encontrado")
    return lector

@router.post("/")
def crear_lector(data: dict = Body(...)):
    return device_service.create_device(data)

@router.put("/{endpoint}")
def editar_lector(endpoint: str, data: dict = Body(...)):
    return device_service.update_device(endpoint, data)

@router.delete("/{endpoint}")
def eliminar_lector(endpoint: str):
    return device_service.delete_device(endpoint)
