from uuid import UUID

from pydantic import BaseModel, Field

from app.schemas.common import ORMModel


class PositionCreate(BaseModel):
    name: str = Field(..., max_length=120)
    code: str | None = Field(None, max_length=64)
    department_id: UUID | None = None
    remark: str | None = None


class PositionRead(ORMModel):
    id: UUID
    name: str
    code: str | None
    department_id: UUID | None
    remark: str | None
