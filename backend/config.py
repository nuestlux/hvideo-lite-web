from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    DATABASE_URL: str = "sqlite+aiosqlite:///./hvideolite.db"
    JWT_SECRET: str = "change-this-to-a-random-secret-in-production"
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRE_MINUTES: int = 480
    BCRYPT_ROUNDS: int = 12
    OTP_EXPIRE_MINUTES: int = 10
    OTP_MAX_ATTEMPTS: int = 5
    OTP_RESEND_LIMIT: int = 3
    OTP_RESEND_WINDOW_MINUTES: int = 60
    SMTP_HOST: str = ""
    SMTP_PORT: int = 587
    SMTP_USER: str = ""
    SMTP_PASSWORD: str = ""
    SMTP_FROM: str = "noreply@hvideolite.local"
    SMTP_USE_TLS: bool = True
    RATE_LIMIT_LOGIN_ATTEMPTS: int = 10
    RATE_LIMIT_LOGIN_WINDOW_MINUTES: int = 5
    RATE_LIMIT_LOCK_MINUTES: int = 30
    SESSION_INACTIVE_MINUTES: int = 30


settings = Settings()
