from typing import Literal
from uuid import UUID

from pydantic import BaseModel, Field

from app.schemas.common import ORMModel


class ProjectCreate(BaseModel):
    name: str = Field(..., max_length=200)
    code: str = Field(..., max_length=64)
    remark: str | None = None


class ProjectUpdate(BaseModel):
    name: str | None = Field(default=None, max_length=200)
    status: str | None = Field(default=None, max_length=32)
    remark: str | None = None


class ProjectRead(ORMModel):
    id: UUID
    name: str
    code: str
    status: str
    remark: str | None


class ProjectMemberCreate(BaseModel):
    user_id: UUID
    role_in_project: Literal["owner", "member"] = "member"
