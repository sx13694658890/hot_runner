"""P5 驾驶舱与集成作业 schema。"""

from __future__ import annotations

from datetime import datetime
from typing import Any
from uuid import UUID

from pydantic import Field

from app.schemas.common import ORMModel


class DashboardSummaryRead(ORMModel):
    """模块 KPI 聚合（只读统计）。"""

    projects_total: int = 0
    projects_active: int = 0
    standard_parts_total: int = 0
    design_tasks_open: int = 0
    field_support_open: int = 0
    trial_runs_active: int = 0
    rd_intakes_pending: int = 0
    integration_jobs_recent_success: int = 0
    integration_jobs_recent_failed: int = 0


class IntegrationSyncJobCreate(ORMModel):
    job_type: str = Field(
        ...,
        max_length=64,
        description="erp_material_pull | bom_push | bom_pull | mes_handshake",
    )
    detail: dict[str, Any] | None = None


class IntegrationSyncJobRead(ORMModel):
    id: UUID
    job_type: str
    direction: str | None
    status: str
    detail: dict[str, Any] | None
    message: str | None
    started_at: datetime | None
    finished_at: datetime | None
    triggered_by_user_id: UUID | None
    created_at: datetime
