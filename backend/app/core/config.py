from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")

    # Supabase
    supabase_url: str
    supabase_service_key: str

    # Anthropic
    anthropic_api_key: str

    # App
    app_env: str = "development"
    app_secret_key: str  # required — no default, must be set in env
    cors_origins: list[str] = ["http://localhost:3000"]

    # SendGrid
    sendgrid_api_key: str = ""
    sendgrid_from_email: str = "sollicitaties@opstap.nl"
    sendgrid_from_name: str = "Opstap"

    # CV storage
    cv_max_size_mb: int = 10
    cv_default_retention_days: int = 30

    @property
    def is_production(self) -> bool:
        return self.app_env == "production"


settings = Settings()
