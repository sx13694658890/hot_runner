"""P5：驾驶舱 KPI 聚合 + ERP/BOM/MES 集成作业桩（记录同步尝试）。"""

from __future__ import annotations

from datetime import UTC, datetime, timedelta
from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import Select, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.deps import require_permissions
from app.models.catalog import StandardPart
from app.models.field_site import SupportTicket, TrialRun
from app.models.integration import IntegrationSyncJob
from app.models.project import Project
from app.models.rd_research import RdLibraryIntake
from app.models.user import User
from app.models.work_plan import DesignTask
from app.schemas.integration import (
    DashboardSummaryRead,
    IntegrationSyncJobCreate,
    IntegrationSyncJobRead,
)

dashboard_router = APIRouter()
integration_router = APIRouter()

JOB_TYPES = frozenset({"erp_material_pull", "bom_push", "bom_pull", "mes_handshake"})


def _direction_for(job_type: str) -> str | None:
    if job_type in ("bom_push",):
        return "outbound"
    if job_type in ("erp_material_pull", "bom_pull", "mes_handshake"):
        return "inbound"
    return None


@dashboard_router.get("/summary", response_model=DashboardSummaryRead)
async def get_dashboard_summary(
    db: Annotated[AsyncSession, Depends(get_db)],
    _: Annotated[User, Depends(require_permissions("dashboard:read"))],
) -> DashboardSummaryRead:
    projects_total = int(
        await db.scalar(select(func.count()).select_from(Project)) or 0
    )
    projects_active = int(
        await db.scalar(
            select(func.count()).select_from(Project).where(Project.status == "active")
        )
        or 0
    )
    standard_parts_total = int(
        await db.scalar(select(func.count()).select_from(StandardPart)) or 0
    )
    design_tasks_open = int(
        await db.scalar(
            select(func.count())
            .select_from(DesignTask)
            .where(DesignTask.status.notin_(("done", "cancelled")))
        )
        or 0
    )
    field_support_open = int(
        await db.scalar(
            select(func.count()).select_from(SupportTicket).where(SupportTicket.status != "closed")
        )
        or 0
    )
    trial_runs_active = int(
        await db.scalar(
            select(func.count())
            .select_from(TrialRun)
            .where(TrialRun.status.in_(("scheduled", "in_progress", "reported")))
        )
        or 0
    )
    rd_intakes_pending = int(
        await db.scalar(
            select(func.count())
            .select_from(RdLibraryIntake)
            .where(RdLibraryIntake.status == "submitted")
        )
        or 0
    )

    cutoff = datetime.now(UTC) - timedelta(days=7)
    integration_jobs_recent_success = int(
        await db.scalar(
            select(func.count())
            .select_from(IntegrationSyncJob)
            .where(
                IntegrationSyncJob.created_at >= cutoff,
                IntegrationSyncJob.status == "success",
            )
        )
        or 0
    )
    integration_jobs_recent_failed = int(
        await db.scalar(
            select(func.count())
            .select_from(IntegrationSyncJob)
            .where(
                IntegrationSyncJob.created_at >= cutoff,
                IntegrationSyncJob.status == "failed",
            )
        )
        or 0
    )

    return DashboardSummaryRead(
        projects_total=projects_total,
        projects_active=projects_active,
        standard_parts_total=standard_parts_total,
        design_tasks_open=design_tasks_open,
        field_support_open=field_support_open,
        trial_runs_active=trial_runs_active,
        rd_intakes_pending=rd_intakes_pending,
        integration_jobs_recent_success=integration_jobs_recent_success,
        integration_jobs_recent_failed=integration_jobs_recent_failed,
    )


@integration_router.get("/jobs", response_model=list[IntegrationSyncJobRead])
async def list_integration_jobs(
    db: Annotated[AsyncSession, Depends(get_db)],
    _: Annotated[User, Depends(require_permissions("integration:read"))],
    skip: int = 0,
    limit: int = 50,
    job_type: str | None = None,
    status_filter: str | None = Query(None, alias="status"),
) -> list[IntegrationSyncJob]:
    stmt: Select[tuple[IntegrationSyncJob]] = select(IntegrationSyncJob).order_by(
        IntegrationSyncJob.created_at.desc()
    )
    if job_type:
        stmt = stmt.where(IntegrationSyncJob.job_type == job_type)
    if status_filter:
        stmt = stmt.where(IntegrationSyncJob.status == status_filter)
    stmt = stmt.offset(max(skip, 0)).limit(min(max(limit, 1), 200))
    result = await db.execute(stmt)
    return list(result.scalars().all())


@integration_router.post(
    "/jobs",
    response_model=IntegrationSyncJobRead,
    status_code=status.HTTP_201_CREATED,
)
async def create_integration_job(
    body: IntegrationSyncJobCreate,
    db: Annotated[AsyncSession, Depends(get_db)],
    user: Annotated[User, Depends(require_permissions("integration:write"))],
) -> IntegrationSyncJob:
    if body.job_type not in JOB_TYPES:
        allowed = ", ".join(sorted(JOB_TYPES))
        raise HTTPException(status_code=400, detail=f"job_type 无效，允许：{allowed}")

    now = datetime.now(UTC)
    row = IntegrationSyncJob(
        job_type=body.job_type,
        direction=_direction_for(body.job_type),
        status="running",
        detail=body.detail,
        message=None,
        started_at=now,
        finished_at=None,
        triggered_by_user_id=user.id,
    )
    db.add(row)
    await db.commit()
    await db.refresh(row)

    # 桩：无外部 ERP/MES 配置时仍落 success，便于演示作业台账
    row.status = "success"
    row.message = "桩作业已完成：当前环境未接通外部 ERP/MES，未产生实际同步。"
    row.finished_at = datetime.now(UTC)
    await db.commit()
    await db.refresh(row)
    return row


@integration_router.get("/jobs/{job_id}", response_model=IntegrationSyncJobRead)
async def get_integration_job(
    job_id: UUID,
    db: Annotated[AsyncSession, Depends(get_db)],
    _: Annotated[User, Depends(require_permissions("integration:read"))],
) -> IntegrationSyncJob:
    row = await db.get(IntegrationSyncJob, job_id)
    if row is None:
        raise HTTPException(status_code=404, detail="集成作业不存在")
    return row
