from uuid import UUID

from pydantic import BaseModel, EmailStr, Field

from app.schemas.common import ORMModel


class LoginRequest(BaseModel):
    username: str = Field(..., min_length=2, max_length=64)
    password: str = Field(..., min_length=1, max_length=128)


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class UserBrief(ORMModel):
    id: UUID
    username: str
    email: EmailStr
    full_name: str
    is_active: bool
    is_superuser: bool
    department_id: UUID | None
    position_id: UUID | None
