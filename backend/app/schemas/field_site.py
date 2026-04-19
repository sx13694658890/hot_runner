"""P4 工艺与现场 DTO。"""

from __future__ import annotations

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field

from app.schemas.common import ORMModel

# ----- 工艺方案 -----


class ProcessPlanCreate(BaseModel):
    title: str = Field(..., max_length=300)
    summary: str | None = None
    status: str = Field(default="draft", max_length=32)
    project_id: UUID | None = None
    standard_part_id: UUID | None = None
    primary_file_asset_id: UUID | None = None


class ProcessPlanUpdate(BaseModel):
    title: str | None = Field(default=None, max_length=300)
    summary: str | None = None
    status: str | None = Field(default=None, max_length=32)
    project_id: UUID | None = None
    standard_part_id: UUID | None = None
    primary_file_asset_id: UUID | None = None


class ProcessPlanRead(ORMModel):
    id: UUID
    title: str
    summary: str | None
    status: str
    project_id: UUID | None
    standard_part_id: UUID | None
    primary_file_asset_id: UUID | None
    created_by_user_id: UUID | None
    created_at: datetime
    updated_at: datetime


# ----- 批注 -----


class ProcessAnnotationCreate(BaseModel):
    body: str
    project_id: UUID | None = None
    standard_part_id: UUID | None = None
    file_asset_id: UUID | None = None


class ProcessAnnotationRead(ORMModel):
    id: UUID
    body: str
    project_id: UUID | None
    standard_part_id: UUID | None
    file_asset_id: UUID | None
    created_by_user_id: UUID | None
    created_at: datetime


# ----- 试模 -----


class TrialRunCreate(BaseModel):
    title: str = Field(..., max_length=300)
    description: str | None = None
    status: str = Field(default="draft", max_length=32)
    project_id: UUID | None = None
    standard_part_id: UUID | None = None
    drawing_version_id: UUID | None = None
    assignee_user_id: UUID | None = None
    report_file_asset_id: UUID | None = None
    planned_at: datetime | None = None


class TrialRunUpdate(BaseModel):
    title: str | None = Field(default=None, max_length=300)
    description: str | None = None
    status: str | None = Field(default=None, max_length=32)
    project_id: UUID | None = None
    standard_part_id: UUID | None = None
    drawing_version_id: UUID | None = None
    assignee_user_id: UUID | None = None
    report_file_asset_id: UUID | None = None
    planned_at: datetime | None = None
    closed_at: datetime | None = None


class TrialRunRead(ORMModel):
    id: UUID
    title: str
    description: str | None
    status: str
    project_id: UUID | None
    standard_part_id: UUID | None
    drawing_version_id: UUID | None
    assignee_user_id: UUID | None
    report_file_asset_id: UUID | None
    planned_at: datetime | None
    closed_at: datetime | None
    created_by_user_id: UUID | None
    created_at: datetime
    updated_at: datetime


# ----- 售后 -----


class SupportTicketCreate(BaseModel):
    title: str = Field(..., max_length=300)
    description: str | None = None
    status: str = Field(default="open", max_length=32)
    project_id: UUID | None = None
    drawing_version_id: UUID | None = None
    selection_stub_id: UUID | None = None
    assignee_user_id: UUID | None = None
    resolution_note: str | None = None


class SupportTicketUpdate(BaseModel):
    title: str | None = Field(default=None, max_length=300)
    description: str | None = None
    status: str | None = Field(default=None, max_length=32)
    project_id: UUID | None = None
    drawing_version_id: UUID | None = None
    selection_stub_id: UUID | None = None
    assignee_user_id: UUID | None = None
    resolution_note: str | None = None


class SupportTicketRead(ORMModel):
    id: UUID
    title: str
    description: str | None
    status: str
    project_id: UUID | None
    drawing_version_id: UUID | None
    selection_stub_id: UUID | None
    assignee_user_id: UUID | None
    resolution_note: str | None
    created_by_user_id: UUID | None
    created_at: datetime
    updated_at: datetime


# ----- 知识库 -----


class KnowledgeDocCreate(BaseModel):
    title: str = Field(..., max_length=300)
    category: str | None = Field(default=None, max_length=120)
    symptom: str | None = None
    cause: str | None = None
    remedy: str | None = None
    status: str = Field(default="draft", max_length=32)
    file_asset_id: UUID | None = None
    related_standard_part_id: UUID | None = None


class KnowledgeDocUpdate(BaseModel):
    title: str | None = Field(default=None, max_length=300)
    category: str | None = Field(default=None, max_length=120)
    symptom: str | None = None
    cause: str | None = None
    remedy: str | None = None
    status: str | None = Field(default=None, max_length=32)
    file_asset_id: UUID | None = None
    related_standard_part_id: UUID | None = None


class KnowledgeDocRead(ORMModel):
    id: UUID
    title: str
    category: str | None
    symptom: str | None
    cause: str | None
    remedy: str | None
    status: str
    file_asset_id: UUID | None
    related_standard_part_id: UUID | None
    created_by_user_id: UUID | None
    created_at: datetime
    updated_at: datetime
