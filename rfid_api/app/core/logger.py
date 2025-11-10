from loguru import logger
import os

LOG_DIR = "logs"
os.makedirs(LOG_DIR, exist_ok=True)
logger.add(f"{LOG_DIR}/rfid_api.log", rotation="10 MB", retention="10 days", level="DEBUG")
