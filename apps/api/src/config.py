from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import Literal

class Settings(BaseSettings):
    env: str = "development"
    debug: bool = True
    api_version: str = "v1"
    cors_origins: list[str] = ["http://localhost:3000"]
    
    max_upload_size_mb: int = 50
    max_training_epochs: int = 200
    
    # "demo" = Simulated mock training, "production" = Real TensorFlow training
    ml_execution_mode: Literal["demo", "production"] = "production"

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")

settings = Settings()
