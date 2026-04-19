from datetime import datetime
from typing import Literal
from uuid import UUID

from pydantic import BaseModel, Field

from app.schemas.common import ORMModel


class StandardPartCreate(BaseModel):
    code: str = Field(..., max_length=64)
    name: str = Field(..., max_length=300)
    category: str | None = Field(default=None, max_length=120)
    status: Literal["draft", "published", "retired"] = "draft"
    remark: str | None = None


class StandardPartUpdate(BaseModel):
    name: str | None = Field(default=None, max_length=300)
    category: str | None = Field(default=None, max_length=120)
    status: str | None = Field(default=None, max_length=32)
    remark: str | None = None


class StandardPartRead(ORMModel):
    id: UUID
    code: str
    name: str
    category: str | None
    status: str
    remark: str | None
    created_at: datetime


class DrawingVersionCreate(BaseModel):
    version_label: str = Field(..., max_length=64)
    status: Literal["draft", "published", "obsolete"] = "draft"
    file_asset_id: UUID | None = None
    remark: str | None = None


class DrawingVersionUpdate(BaseModel):
    version_label: str | None = Field(default=None, max_length=64)
    status: str | None = Field(default=None, max_length=32)
    file_asset_id: UUID | None = None
    remark: str | None = None


class DrawingVersionRead(ORMModel):
    id: UUID
    standard_part_id: UUID
    version_label: str
    status: str
    file_asset_id: UUID | None
    remark: str | None
    created_at: datetime
