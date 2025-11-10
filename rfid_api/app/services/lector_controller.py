import socket
import threading
import time
from loguru import logger
from app.services import state_service
from app.routes.ws import broadcast_event
from app.services.validation_service import validar_tag

READ_CMD = bytes.fromhex("7C FF FF 20 00 00 66")
ANTI_REBOTE_S = 3.0


class LectorThread(threading.Thread):
    @staticmethod
    def _to_bytes_safe(valor):
        """Convierte una cadena hex a bytes, limpiando separadores y errores."""
        if not valor:
            return b""
        valor = str(valor).strip().replace(" ", "").replace("-", "").replace(",", "")
        try:
            return bytes.fromhex(valor)
        except Exception as e:
            logger.error(f"⚠️ Error convirtiendo a bytes: {valor} -> {e}")
            return b""

    def __init__(self, nombre, ip, puerto, endpoint, rele_on, rele_off, backend_validate_url):
        super().__init__(daemon=True)
        self.nombre = nombre
        self.ip = ip
        self.puerto = puerto
        self.endpoint = endpoint
        self.rele_on = self._to_bytes_safe(rele_on)
        self.rele_off = self._to_bytes_safe(rele_off)
        self.backend_validate_url = backend_validate_url
        self.sock = None
        self.last_uid = None
        self.last_trigger = 0

    def conectar(self):
        """Intenta conectar al lector TCP y mantiene el ciclo de reconexión."""
        while True:
            try:
                logger.info(f"🔌 Conectando lector {self.nombre} ({self.ip}:{self.puerto})")
                self.sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
                self.sock.settimeout(3)
                self.sock.connect((self.ip, self.puerto))

                # ✅ Actualizar estado
                state_service.init_lector(self.endpoint)
                logger.success(f"[{self.nombre}] Conectado correctamente")
                broadcast_event({
                    "tipo": "estado_lector",
                    "endpoint": self.endpoint,
                    "conectado": True
                })

                # Iniciar lectura
                self.leer_loop()

            except Exception as e:
                mensaje = f"Error de conexión: {e}"
                logger.error(f"[{self.nombre}] {mensaje}")
                state_service.registrar_error(self.endpoint, mensaje)
                state_service.desconectar_lector(self.endpoint)

                broadcast_event({
                    "tipo": "estado_lector",
                    "endpoint": self.endpoint,
                    "conectado": False
                })
                time.sleep(5)

            finally:
                if self.sock:
                    self.sock.close()

    def leer_loop(self):
        """Loop principal de lectura RFID"""
        while True:
            try:
                self.sock.send(READ_CMD)
                data = self.sock.recv(128)
                if not data:
                    time.sleep(0.1)
                    continue

                uid = self._extraer_uid(data)
                if not uid:
                    continue

                ahora = time.time()
                if uid == self.last_uid and (ahora - self.last_trigger) < ANTI_REBOTE_S:
                    continue

                self.last_uid = uid
                self.last_trigger = ahora
                logger.info(f"[{self.nombre}] UID detectado: {uid}")

                # ✅ Validar tag con base de datos local
                autorizacion = validar_tag(uid, self.endpoint)
                autorizado = autorizacion.get("autorizado", False)

                # ✅ Registrar la lectura en el estado
                state_service.registrar_lectura(self.endpoint)

                if autorizado:
                    self._activar_rele()
                    broadcast_event({
                        "tipo": "nuevo_evento",
                        "lector": self.endpoint,
                        "uid": uid,
                        "estado": "permitido",
                        "nombre": autorizacion.get("nombre"),
                        "apellido": autorizacion.get("apellido"),
                        "dni": autorizacion.get("dni")
                    })
                else:
                    broadcast_event({
                        "tipo": "nuevo_evento",
                        "lector": self.endpoint,
                        "uid": uid,
                        "estado": "denegado",
                        "motivo": autorizacion.get("motivo")
                    })

                time.sleep(0.2)

            except Exception as e:
                mensaje = f"Error en loop de lectura: {e}"
                logger.error(f"[{self.nombre}] {mensaje}")
                state_service.registrar_error(self.endpoint, mensaje)
                break

    def _extraer_uid(self, data: bytes) -> str | None:
        """Extrae el UID decimal de la trama RFID recibida."""
        try:
            if 0xE2 in data:
                i = data.index(0xE2)
                uid_bytes = data[i + 9: i + 12]
                return str(int.from_bytes(uid_bytes, "big")).zfill(8)
        except Exception as e:
            logger.error(f"[{self.nombre}] Error extrayendo UID: {e}")
            return None

    def _activar_rele(self):
        """Activa y desactiva el relé del lector."""
        try:
            self.sock.send(self.rele_on)
            time.sleep(1)
            self.sock.send(self.rele_off)
            logger.info(f"[{self.nombre}] 🔓 Barrera abierta")
        except Exception as e:
            mensaje = f"Error activando relé: {e}"
            logger.error(f"[{self.nombre}] {mensaje}")
            state_service.registrar_error(self.endpoint, mensaje)
