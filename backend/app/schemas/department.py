from uuid import UUID

from pydantic import BaseModel, Field

from app.schemas.common import ORMModel


class DepartmentBase(BaseModel):
    name: str = Field(..., max_length=200)
    code: str | None = Field(None, max_length=64)
    parent_id: UUID | None = None
    sort_order: int = 0
    remark: str | None = None


class DepartmentCreate(DepartmentBase):
    pass


class DepartmentUpdate(BaseModel):
    name: str | None = Field(None, max_length=200)
    code: str | None = Field(None, max_length=64)
    parent_id: UUID | None = None
    sort_order: int | None = None
    remark: str | None = None


class DepartmentRead(ORMModel):
    id: UUID
    name: str
    code: str | None
    parent_id: UUID | None
    sort_order: int
    remark: str | None
