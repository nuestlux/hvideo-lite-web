from pydantic import BaseModel, EmailStr


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class VerifyOtpRequest(BaseModel):
    email: EmailStr
    otp: str
    purpose: str = "setup_password"


class SetPasswordRequest(BaseModel):
    setup_token: str
    password: str


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str
