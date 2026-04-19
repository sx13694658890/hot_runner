from uuid import UUID

from pydantic import BaseModel, EmailStr, Field

from app.schemas.common import ORMModel


class UserCreate(BaseModel):
    username: str = Field(..., min_length=2, max_length=64)
    email: EmailStr
    password: str = Field(..., min_length=6, max_length=128)
    full_name: str = Field(..., max_length=120)
    department_id: UUID | None = None
    position_id: UUID | None = None
    is_active: bool = True
    role_ids: list[UUID] = Field(default_factory=list)


class UserUpdate(BaseModel):
    email: EmailStr | None = None
    full_name: str | None = Field(None, max_length=120)
    department_id: UUID | None = None
    position_id: UUID | None = None
    is_active: bool | None = None
    password: str | None = Field(None, min_length=6, max_length=128)


class UserRead(ORMModel):
    id: UUID
    username: str
    email: EmailStr
    full_name: str
    is_active: bool
    is_superuser: bool
    department_id: UUID | None
    position_id: UUID | None


class AssignRolesBody(BaseModel):
    role_ids: list[UUID]
