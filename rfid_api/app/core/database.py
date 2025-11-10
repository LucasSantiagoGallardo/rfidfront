import mysql.connector
from mysql.connector import Error
from app.core.config import settings

def get_connection():
    try:
        conn = mysql.connector.connect(
            host=settings.DB_HOST,
            user=settings.DB_USER,
            password=settings.DB_PASSWORD,
            database=settings.DB_NAME,
            port=settings.DB_PORT
        )
        return conn
    except Error as e:
        print(f"❌ Error conectando a MySQL: {e}")
        raise
