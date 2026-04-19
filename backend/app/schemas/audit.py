from datetime import datetime
from typing import Any
from uuid import UUID

from pydantic import BaseModel, Field

from app.schemas.common import ORMModel


class AuditLogRead(ORMModel):
    id: UUID
    user_id: UUID | None
    action: str
    resource_type: str | None
    resource_id: str | None
    ip: str | None
    user_agent: str | None
    detail: dict[str, Any] | None
    created_at: datetime


class AuditLogQuery(BaseModel):
    skip: int = Field(0, ge=0)
    limit: int = Field(50, ge=1, le=200)
    action: str | None = None
