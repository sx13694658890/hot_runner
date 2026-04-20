"""选型字典 API 模型。"""

from __future__ import annotations

from datetime import datetime
from typing import Any
from uuid import UUID

from pydantic import BaseModel, Field

from app.schemas.common import ORMModel


class SelDictCategoryRead(ORMModel):
    id: UUID
    code: str
    label: str
    sort_order: int


class SelDictCategoryCreate(BaseModel):
    """新增字典分类；code 全局唯一，建议小写+下划线，与业务常量对齐。"""

    code: str = Field(..., min_length=1, max_length=80)
    label: str = Field(..., min_length=1, max_length=200)
    sort_order: int = 0


class SelDictCategoryPatch(BaseModel):
    code: str | None = Field(None, min_length=1, max_length=80)
    label: str | None = Field(None, min_length=1, max_length=200)
    sort_order: int | None = None


class SelDictItemRead(ORMModel):
    id: UUID
    category_id: UUID
    label: str
    sort_order: int
    is_active: bool
    created_at: datetime


class SelDictItemCreate(BaseModel):
    category_code: str = Field(..., min_length=1, max_length=80)
    label: str = Field(..., min_length=1, max_length=500)
    sort_order: int = 0


class SelDictItemPatch(BaseModel):
    label: str | None = Field(None, min_length=1, max_length=500)
    sort_order: int | None = None
    is_active: bool | None = None


class MoldDictBundleRead(BaseModel):
    """category_code → 选项列表（启用项）。"""

    categories: dict[str, list[dict[str, Any]]]
