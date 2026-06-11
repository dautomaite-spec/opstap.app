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
    admin_api_key: str = ""  # set in production to protect admin endpoints
    cors_origins: list[str] = ["http://localhost:3000"]
    cors_origin_regex: str | None = None

    # SendGrid
    sendgrid_api_key: str = ""
    sendgrid_from_email: str = "sollicitaties@opstap.nl"
    sendgrid_from_name: str = "Opstap"

    # Adzuna job search API
    adzuna_app_id: str = ""
    adzuna_app_key: str = ""

    # CV storage
    cv_max_size_mb: int = 10
    cv_default_retention_days: int = 30

    # Mollie payments
    mollie_api_key: str = ""
    mollie_webhook_secret: str = ""  # optional HMAC secret for webhook signature validation
    app_base_url: str = "https://opstapapp.nl"
    api_base_url: str = "https://api.opstapapp.nl"

    @property
    def is_production(self) -> bool:
        return self.app_env == "production"


settings = Settings()
