"""P3 研发域 API Schema。"""

from __future__ import annotations

from datetime import date, datetime
from typing import Any
from uuid import UUID

from pydantic import BaseModel, Field

from app.schemas.common import ORMModel

# ----- 研发项目 -----


class RdResearchProjectCreate(BaseModel):
    name: str = Field(..., max_length=200)
    code: str | None = Field(default=None, max_length=64)
    parent_project_id: UUID | None = None
    status: str = Field(default="active", max_length=32)
    description: str | None = None
    owner_user_id: UUID | None = None


class RdResearchProjectUpdate(BaseModel):
    name: str | None = Field(default=None, max_length=200)
    code: str | None = Field(default=None, max_length=64)
    parent_project_id: UUID | None = None
    status: str | None = Field(default=None, max_length=32)
    description: str | None = None
    owner_user_id: UUID | None = None


class RdResearchProjectRead(ORMModel):
    id: UUID
    name: str
    code: str | None
    parent_project_id: UUID | None
    status: str
    description: str | None
    owner_user_id: UUID | None
    created_at: datetime
    updated_at: datetime


# ----- 研发任务 -----


class RdResearchTaskCreate(BaseModel):
    title: str = Field(..., max_length=500)
    status: str = Field(default="todo", max_length=32)
    assignee_user_id: UUID | None = None
    due_date: date | None = None
    sort_order: int = 0
    remark: str | None = None


class RdResearchTaskUpdate(BaseModel):
    title: str | None = Field(default=None, max_length=500)
    status: str | None = Field(default=None, max_length=32)
    assignee_user_id: UUID | None = None
    due_date: date | None = None
    sort_order: int | None = None
    remark: str | None = None


class RdResearchTaskRead(ORMModel):
    id: UUID
    research_project_id: UUID
    title: str
    status: str
    assignee_user_id: UUID | None
    due_date: date | None
    sort_order: int
    remark: str | None
    created_at: datetime
    updated_at: datetime


# ----- 版本迭代 -----


class RdReleaseIterationCreate(BaseModel):
    version_label: str = Field(..., max_length=64)
    release_notes: str | None = None


class RdReleaseIterationUpdate(BaseModel):
    release_notes: str | None = None
    status: str | None = Field(default=None, max_length=32)


class RdReleaseIterationRead(ORMModel):
    id: UUID
    research_project_id: UUID
    version_label: str
    release_notes: str | None
    status: str
    submitted_by_user_id: UUID | None
    submitted_at: datetime | None
    reviewed_by_user_id: UUID | None
    reviewed_at: datetime | None
    review_comment: str | None
    created_at: datetime
    updated_at: datetime


class RdReleaseReviewBody(BaseModel):
    comment: str | None = None


# ----- 成果附件 -----


class RdDeliverableCreate(BaseModel):
    title: str = Field(..., max_length=300)
    category: str = Field(default="other", max_length=32)
    tags: list[str] = Field(default_factory=list)
    file_asset_id: UUID | None = None
    remark: str | None = None


class RdDeliverableUpdate(BaseModel):
    title: str | None = Field(default=None, max_length=300)
    category: str | None = Field(default=None, max_length=32)
    tags: list[str] | None = None
    file_asset_id: UUID | None = None
    remark: str | None = None


class RdDeliverableRead(ORMModel):
    id: UUID
    research_project_id: UUID
    title: str
    category: str
    tags: list[Any]
    file_asset_id: UUID | None
    remark: str | None
    created_by_user_id: UUID | None
    created_at: datetime


# ----- 成果入库申请 -----


class RdLibraryIntakeCreate(BaseModel):
    research_project_id: UUID | None = None
    title: str = Field(..., max_length=300)
    proposed_code: str = Field(..., max_length=64)
    proposed_name: str = Field(..., max_length=300)
    category: str | None = Field(default=None, max_length=120)
    description: str | None = None
    file_asset_id: UUID | None = None


class RdLibraryIntakeUpdate(BaseModel):
    title: str | None = Field(default=None, max_length=300)
    proposed_code: str | None = Field(default=None, max_length=64)
    proposed_name: str | None = Field(default=None, max_length=300)
    category: str | None = Field(default=None, max_length=120)
    description: str | None = None
    file_asset_id: UUID | None = None


class RdLibraryIntakeRead(ORMModel):
    id: UUID
    research_project_id: UUID | None
    title: str
    proposed_code: str
    proposed_name: str
    category: str | None
    description: str | None
    file_asset_id: UUID | None
    status: str
    result_standard_part_id: UUID | None
    created_by_user_id: UUID | None
    submitted_by_user_id: UUID | None
    submitted_at: datetime | None
    reviewed_by_user_id: UUID | None
    reviewed_at: datetime | None
    review_comment: str | None
    created_at: datetime
    updated_at: datetime


class RdLibraryIntakeReviewBody(BaseModel):
    comment: str | None = None
