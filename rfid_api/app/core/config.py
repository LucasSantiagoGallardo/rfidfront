from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    APP_NAME: str = "RFID Access API"
    APP_VERSION: str = "2.0.0"
    DB_HOST: str = "localhost"
    DB_USER: str = "root"
    DB_PASSWORD: str = ""
    DB_NAME: str = "adeco2"
    DB_PORT: int = 3306

    class Config:
        env_file = ".env"

settings = Settings()
