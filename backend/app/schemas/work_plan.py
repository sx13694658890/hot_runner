from datetime import date, datetime
from typing import Any, Literal
from uuid import UUID

from pydantic import BaseModel, Field

from app.schemas.common import ORMModel


# --- WBS 任务 ---
class ProjectTaskCreate(BaseModel):
    title: str = Field(..., max_length=500)
    parent_id: UUID | None = None
    sort_order: int = 0
    assignee_user_id: UUID | None = None
    due_date: date | None = None
    status: Literal["todo", "in_progress", "done", "cancelled"] = "todo"
    remark: str | None = None


class ProjectTaskUpdate(BaseModel):
    title: str | None = Field(default=None, max_length=500)
    parent_id: UUID | None = None
    sort_order: int | None = None
    assignee_user_id: UUID | None = None
    due_date: date | None = None
    status: str | None = Field(default=None, max_length=32)
    remark: str | None = None


class ProjectTaskRead(ORMModel):
    id: UUID
    project_id: UUID
    parent_id: UUID | None
    title: str
    sort_order: int
    assignee_user_id: UUID | None
    due_date: date | None
    status: str
    remark: str | None
    created_at: datetime


# --- 里程碑 ---
class ProjectMilestoneCreate(BaseModel):
    name: str = Field(..., max_length=200)
    target_date: date | None = None
    status: Literal["planned", "done", "missed"] = "planned"
    sort_order: int = 0


class ProjectMilestoneUpdate(BaseModel):
    name: str | None = Field(default=None, max_length=200)
    target_date: date | None = None
    status: str | None = Field(default=None, max_length=32)
    sort_order: int | None = None


class ProjectMilestoneRead(ORMModel):
    id: UUID
    project_id: UUID
    name: str
    target_date: date | None
    status: str
    sort_order: int
    created_at: datetime


# --- 风险 ---
class ProjectRiskCreate(BaseModel):
    title: str = Field(..., max_length=300)
    risk_level: Literal["low", "medium", "high"] = "medium"
    status: Literal["open", "mitigated", "closed"] = "open"
    owner_user_id: UUID | None = None
    remark: str | None = None


class ProjectRiskUpdate(BaseModel):
    title: str | None = Field(default=None, max_length=300)
    risk_level: str | None = Field(default=None, max_length=16)
    status: str | None = Field(default=None, max_length=32)
    owner_user_id: UUID | None = None
    remark: str | None = None


class ProjectRiskRead(ORMModel):
    id: UUID
    project_id: UUID
    title: str
    risk_level: str
    status: str
    owner_user_id: UUID | None
    remark: str | None
    created_at: datetime


# --- 设计任务 ---
class DesignTaskCreate(BaseModel):
    title: str = Field(..., max_length=300)
    status: Literal["pending", "in_progress", "done"] = "pending"
    assignee_user_id: UUID | None = None
    sort_order: int = 0
    remark: str | None = None


class DesignTaskUpdate(BaseModel):
    title: str | None = Field(default=None, max_length=300)
    status: str | None = Field(default=None, max_length=32)
    assignee_user_id: UUID | None = None
    sort_order: int | None = None
    remark: str | None = None


class DesignTaskRead(ORMModel):
    id: UUID
    project_id: UUID
    title: str
    status: str
    assignee_user_id: UUID | None
    sort_order: int
    remark: str | None
    created_at: datetime


# --- 设计变更 ---
class DesignChangeCreate(BaseModel):
    title: str = Field(..., max_length=300)
    description: str | None = None
    status: Literal["draft", "submitted", "approved", "rejected", "implemented", "closed"] = "draft"


class DesignChangeUpdate(BaseModel):
    title: str | None = Field(default=None, max_length=300)
    description: str | None = None
    status: str | None = Field(default=None, max_length=32)


class DesignChangeRead(ORMModel):
    id: UUID
    project_id: UUID
    title: str
    description: str | None
    status: str
    created_by_user_id: UUID | None
    created_at: datetime


# --- 选型存根 ---
class SelectionStubCreate(BaseModel):
    title: str = Field(..., max_length=300)
    payload: dict[str, Any] = Field(default_factory=dict)
    remark: str | None = None


class SelectionStubUpdate(BaseModel):
    title: str | None = Field(default=None, max_length=300)
    payload: dict[str, Any] | None = None
    remark: str | None = None


class SelectionStubRead(ORMModel):
    id: UUID
    project_id: UUID
    title: str
    payload: dict[str, Any]
    remark: str | None
    created_at: datetime
