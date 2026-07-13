from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import Literal, Union

class Settings(BaseSettings):
    env: str = "development"
    debug: bool = True
    api_version: str = "v1"
    cors_origins: Union[str, list[str]] = "*"
    
    max_upload_size_mb: int = 50
    max_training_epochs: int = 200
    
    # "demo" = Simulated mock training, "production" = Real TensorFlow training
    ml_execution_mode: Literal["demo", "production"] = "production"

    def get_cors_origins_list(self) -> list[str]:
        if isinstance(self.cors_origins, list):
            return self.cors_origins
        if isinstance(self.cors_origins, str):
            v_clean = self.cors_origins.strip()
            if v_clean == "*":
                return ["*"]
            if v_clean.startswith("[") and v_clean.endswith("]"):
                import json
                try:
                    return json.loads(v_clean)
                except Exception:
                    pass
            return [origin.strip() for origin in v_clean.split(",") if origin.strip()]
        return ["*"]

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

settings = Settings()
