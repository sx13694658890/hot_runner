from datetime import datetime
from typing import Literal
from uuid import UUID

from pydantic import BaseModel, Field

from app.schemas.common import ORMModel


class NotificationCreate(BaseModel):
    user_id: UUID
    title: str = Field(..., max_length=255)
    body: str | None = None
    channel: Literal["in_app", "email", "wecom"] = "in_app"


class NotificationRead(ORMModel):
    id: UUID
    user_id: UUID
    title: str
    body: str | None
    read: bool
    channel: str
    created_at: datetime
