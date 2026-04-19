"""P4 工艺与现场 REST。"""

from __future__ import annotations

from datetime import UTC, datetime
from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import Select, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.deps import require_permissions
from app.models.catalog import DrawingVersion, StandardPart
from app.models.field_site import (
    KnowledgeDoc,
    ProcessAnnotation,
    ProcessPlan,
    SupportTicket,
    TrialRun,
)
from app.models.project import Project
from app.models.user import User
from app.models.work_plan import SelectionStub
from app.schemas.field_site import (
    KnowledgeDocCreate,
    KnowledgeDocRead,
    KnowledgeDocUpdate,
    ProcessAnnotationCreate,
    ProcessAnnotationRead,
    ProcessPlanCreate,
    ProcessPlanRead,
    ProcessPlanUpdate,
    SupportTicketCreate,
    SupportTicketRead,
    SupportTicketUpdate,
    TrialRunCreate,
    TrialRunRead,
    TrialRunUpdate,
)

router = APIRouter()

TRIAL_STATUSES = frozenset({"draft", "scheduled", "in_progress", "reported", "closed", "cancelled"})
TRIAL_TRANSITIONS: dict[str, frozenset[str]] = {
    "draft": frozenset({"scheduled", "cancelled"}),
    "scheduled": frozenset({"in_progress", "cancelled"}),
    "in_progress": frozenset({"reported", "cancelled"}),
    "reported": frozenset({"closed"}),
    "closed": frozenset(),
    "cancelled": frozenset(),
}

SUPPORT_STATUSES = frozenset({"open", "investigating", "resolved", "closed"})
SUPPORT_TRANSITIONS: dict[str, frozenset[str]] = {
    "open": frozenset({"investigating", "resolved", "closed"}),
    "investigating": frozenset({"resolved", "closed"}),
    "resolved": frozenset({"closed"}),
    "closed": frozenset(),
}

PLAN_STATUSES = frozenset({"draft", "active", "archived"})
KD_STATUSES = frozenset({"draft", "published", "archived"})


async def _require_project(db: AsyncSession, pid: UUID | None) -> None:
    if pid is None:
        return
    if await db.get(Project, pid) is None:
        raise HTTPException(status_code=400, detail="关联项目不存在")


async def _require_standard_part(db: AsyncSession, sid: UUID | None) -> None:
    if sid is None:
        return
    if await db.get(StandardPart, sid) is None:
        raise HTTPException(status_code=400, detail="关联标准件不存在")


async def _require_drawing_version(db: AsyncSession, vid: UUID | None) -> None:
    if vid is None:
        return
    if await db.get(DrawingVersion, vid) is None:
        raise HTTPException(status_code=400, detail="关联图纸版本不存在")


async def _require_selection_stub(db: AsyncSession, sid: UUID | None) -> None:
    if sid is None:
        return
    if await db.get(SelectionStub, sid) is None:
        raise HTTPException(status_code=400, detail="关联选型存根不存在")


def _validate_binding(project_id: UUID | None, standard_part_id: UUID | None) -> None:
    if project_id is None and standard_part_id is None:
        raise HTTPException(status_code=400, detail="请至少关联项目或标准件之一")


# ----- 工艺方案 -----


@router.get("/process-plans", response_model=list[ProcessPlanRead])
async def list_process_plans(
    db: Annotated[AsyncSession, Depends(get_db)],
    _: Annotated[User, Depends(require_permissions("field:read"))],
    project_id: UUID | None = None,
    standard_part_id: UUID | None = None,
    status_filter: str | None = Query(None, alias="status"),
    skip: int = 0,
    limit: int = 100,
) -> list[ProcessPlan]:
    stmt: Select[tuple[ProcessPlan]] = select(ProcessPlan).order_by(ProcessPlan.updated_at.desc())
    if project_id:
        stmt = stmt.where(ProcessPlan.project_id == project_id)
    if standard_part_id:
        stmt = stmt.where(ProcessPlan.standard_part_id == standard_part_id)
    if status_filter:
        stmt = stmt.where(ProcessPlan.status == status_filter)
    stmt = stmt.offset(max(skip, 0)).limit(min(max(limit, 1), 500))
    result = await db.execute(stmt)
    return list(result.scalars().all())


@router.post("/process-plans", response_model=ProcessPlanRead, status_code=status.HTTP_201_CREATED)
async def create_process_plan(
    body: ProcessPlanCreate,
    db: Annotated[AsyncSession, Depends(get_db)],
    user: Annotated[User, Depends(require_permissions("field:write"))],
) -> ProcessPlan:
    _validate_binding(body.project_id, body.standard_part_id)
    if body.status not in PLAN_STATUSES:
        allowed = ", ".join(sorted(PLAN_STATUSES))
        raise HTTPException(status_code=400, detail=f"工艺方案状态无效，允许：{allowed}")
    await _require_project(db, body.project_id)
    await _require_standard_part(db, body.standard_part_id)
    row = ProcessPlan(
        title=body.title,
        summary=body.summary,
        status=body.status,
        project_id=body.project_id,
        standard_part_id=body.standard_part_id,
        primary_file_asset_id=body.primary_file_asset_id,
        created_by_user_id=user.id,
    )
    db.add(row)
    await db.commit()
    await db.refresh(row)
    return row


@router.get("/process-plans/{plan_id}", response_model=ProcessPlanRead)
async def get_process_plan(
    plan_id: UUID,
    db: Annotated[AsyncSession, Depends(get_db)],
    _: Annotated[User, Depends(require_permissions("field:read"))],
) -> ProcessPlan:
    row = await db.get(ProcessPlan, plan_id)
    if row is None:
        raise HTTPException(status_code=404, detail="工艺方案不存在")
    return row


@router.patch("/process-plans/{plan_id}", response_model=ProcessPlanRead)
async def patch_process_plan(
    plan_id: UUID,
    body: ProcessPlanUpdate,
    db: Annotated[AsyncSession, Depends(get_db)],
    _: Annotated[User, Depends(require_permissions("field:write"))],
) -> ProcessPlan:
    row = await db.get(ProcessPlan, plan_id)
    if row is None:
        raise HTTPException(status_code=404, detail="工艺方案不存在")
    data = body.model_dump(exclude_unset=True)
    if "status" in data and data["status"] not in PLAN_STATUSES:
        raise HTTPException(status_code=400, detail="工艺方案状态无效")
    if "project_id" in data or "standard_part_id" in data:
        np = data.get("project_id", row.project_id)
        ns = data.get("standard_part_id", row.standard_part_id)
        _validate_binding(np, ns)
    if "project_id" in data:
        await _require_project(db, data["project_id"])
    if "standard_part_id" in data:
        await _require_standard_part(db, data["standard_part_id"])
    for k, v in data.items():
        setattr(row, k, v)
    await db.commit()
    await db.refresh(row)
    return row


@router.delete("/process-plans/{plan_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_process_plan(
    plan_id: UUID,
    db: Annotated[AsyncSession, Depends(get_db)],
    _: Annotated[User, Depends(require_permissions("field:write"))],
) -> None:
    row = await db.get(ProcessPlan, plan_id)
    if row is None:
        raise HTTPException(status_code=404, detail="工艺方案不存在")
    await db.delete(row)
    await db.commit()


# ----- 批注 -----


@router.get("/annotations", response_model=list[ProcessAnnotationRead])
async def list_annotations(
    db: Annotated[AsyncSession, Depends(get_db)],
    _: Annotated[User, Depends(require_permissions("field:read"))],
    project_id: UUID | None = None,
    standard_part_id: UUID | None = None,
    skip: int = 0,
    limit: int = 100,
) -> list[ProcessAnnotation]:
    stmt: Select[tuple[ProcessAnnotation]] = select(ProcessAnnotation).order_by(
        ProcessAnnotation.created_at.desc()
    )
    if project_id:
        stmt = stmt.where(ProcessAnnotation.project_id == project_id)
    if standard_part_id:
        stmt = stmt.where(ProcessAnnotation.standard_part_id == standard_part_id)
    stmt = stmt.offset(max(skip, 0)).limit(min(max(limit, 1), 500))
    result = await db.execute(stmt)
    return list(result.scalars().all())


@router.post(
    "/annotations",
    response_model=ProcessAnnotationRead,
    status_code=status.HTTP_201_CREATED,
)
async def create_annotation(
    body: ProcessAnnotationCreate,
    db: Annotated[AsyncSession, Depends(get_db)],
    user: Annotated[User, Depends(require_permissions("field:write"))],
) -> ProcessAnnotation:
    _validate_binding(body.project_id, body.standard_part_id)
    await _require_project(db, body.project_id)
    await _require_standard_part(db, body.standard_part_id)
    row = ProcessAnnotation(
        body=body.body,
        project_id=body.project_id,
        standard_part_id=body.standard_part_id,
        file_asset_id=body.file_asset_id,
        created_by_user_id=user.id,
    )
    db.add(row)
    await db.commit()
    await db.refresh(row)
    return row


@router.delete("/annotations/{annotation_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_annotation(
    annotation_id: UUID,
    db: Annotated[AsyncSession, Depends(get_db)],
    _: Annotated[User, Depends(require_permissions("field:write"))],
) -> None:
    row = await db.get(ProcessAnnotation, annotation_id)
    if row is None:
        raise HTTPException(status_code=404, detail="批注不存在")
    await db.delete(row)
    await db.commit()


# ----- 试模 -----


def _trial_transition_ok(old: str, new: str) -> bool:
    if old == new:
        return True
    allowed = TRIAL_TRANSITIONS.get(old, frozenset())
    return new in allowed


@router.get("/trial-runs", response_model=list[TrialRunRead])
async def list_trial_runs(
    db: Annotated[AsyncSession, Depends(get_db)],
    _: Annotated[User, Depends(require_permissions("field:read"))],
    project_id: UUID | None = None,
    status_filter: str | None = Query(None, alias="status"),
    skip: int = 0,
    limit: int = 100,
) -> list[TrialRun]:
    stmt: Select[tuple[TrialRun]] = select(TrialRun).order_by(TrialRun.updated_at.desc())
    if project_id:
        stmt = stmt.where(TrialRun.project_id == project_id)
    if status_filter:
        stmt = stmt.where(TrialRun.status == status_filter)
    stmt = stmt.offset(max(skip, 0)).limit(min(max(limit, 1), 500))
    result = await db.execute(stmt)
    return list(result.scalars().all())


@router.post("/trial-runs", response_model=TrialRunRead, status_code=status.HTTP_201_CREATED)
async def create_trial_run(
    body: TrialRunCreate,
    db: Annotated[AsyncSession, Depends(get_db)],
    user: Annotated[User, Depends(require_permissions("field:write"))],
) -> TrialRun:
    if body.status not in TRIAL_STATUSES:
        raise HTTPException(status_code=400, detail="试模工单状态无效")
    await _require_project(db, body.project_id)
    await _require_standard_part(db, body.standard_part_id)
    await _require_drawing_version(db, body.drawing_version_id)
    row = TrialRun(
        title=body.title,
        description=body.description,
        status=body.status,
        project_id=body.project_id,
        standard_part_id=body.standard_part_id,
        drawing_version_id=body.drawing_version_id,
        assignee_user_id=body.assignee_user_id,
        report_file_asset_id=body.report_file_asset_id,
        planned_at=body.planned_at,
        created_by_user_id=user.id,
    )
    db.add(row)
    await db.commit()
    await db.refresh(row)
    return row


@router.patch("/trial-runs/{trial_id}", response_model=TrialRunRead)
async def patch_trial_run(
    trial_id: UUID,
    body: TrialRunUpdate,
    db: Annotated[AsyncSession, Depends(get_db)],
    _: Annotated[User, Depends(require_permissions("field:write"))],
) -> TrialRun:
    row = await db.get(TrialRun, trial_id)
    if row is None:
        raise HTTPException(status_code=404, detail="试模工单不存在")
    data = body.model_dump(exclude_unset=True)
    if "status" in data:
        ns = data["status"]
        if ns not in TRIAL_STATUSES:
            raise HTTPException(status_code=400, detail="试模工单状态无效")
        if not _trial_transition_ok(row.status, ns):
            raise HTTPException(
                status_code=400,
                detail=f"不允许从「{row.status}」变更为「{ns}」",
            )
        if ns == "closed" and "closed_at" not in data:
            data["closed_at"] = datetime.now(UTC)
    if "project_id" in data:
        await _require_project(db, data["project_id"])
    if "standard_part_id" in data:
        await _require_standard_part(db, data["standard_part_id"])
    if "drawing_version_id" in data:
        await _require_drawing_version(db, data["drawing_version_id"])
    for k, v in data.items():
        setattr(row, k, v)
    await db.commit()
    await db.refresh(row)
    return row


@router.delete("/trial-runs/{trial_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_trial_run(
    trial_id: UUID,
    db: Annotated[AsyncSession, Depends(get_db)],
    _: Annotated[User, Depends(require_permissions("field:write"))],
) -> None:
    row = await db.get(TrialRun, trial_id)
    if row is None:
        raise HTTPException(status_code=404, detail="试模工单不存在")
    await db.delete(row)
    await db.commit()


# ----- 售后 -----


def _support_transition_ok(old: str, new: str) -> bool:
    if old == new:
        return True
    return new in SUPPORT_TRANSITIONS.get(old, frozenset())


@router.get("/support-tickets", response_model=list[SupportTicketRead])
async def list_support_tickets(
    db: Annotated[AsyncSession, Depends(get_db)],
    _: Annotated[User, Depends(require_permissions("field:read"))],
    project_id: UUID | None = None,
    status_filter: str | None = Query(None, alias="status"),
    skip: int = 0,
    limit: int = 100,
) -> list[SupportTicket]:
    stmt: Select[tuple[SupportTicket]] = select(SupportTicket).order_by(
        SupportTicket.updated_at.desc()
    )
    if project_id:
        stmt = stmt.where(SupportTicket.project_id == project_id)
    if status_filter:
        stmt = stmt.where(SupportTicket.status == status_filter)
    stmt = stmt.offset(max(skip, 0)).limit(min(max(limit, 1), 500))
    result = await db.execute(stmt)
    return list(result.scalars().all())


@router.post(
    "/support-tickets",
    response_model=SupportTicketRead,
    status_code=status.HTTP_201_CREATED,
)
async def create_support_ticket(
    body: SupportTicketCreate,
    db: Annotated[AsyncSession, Depends(get_db)],
    user: Annotated[User, Depends(require_permissions("field:write"))],
) -> SupportTicket:
    if body.status not in SUPPORT_STATUSES:
        raise HTTPException(status_code=400, detail="售后工单状态无效")
    await _require_project(db, body.project_id)
    await _require_drawing_version(db, body.drawing_version_id)
    await _require_selection_stub(db, body.selection_stub_id)
    row = SupportTicket(
        title=body.title,
        description=body.description,
        status=body.status,
        project_id=body.project_id,
        drawing_version_id=body.drawing_version_id,
        selection_stub_id=body.selection_stub_id,
        assignee_user_id=body.assignee_user_id,
        resolution_note=body.resolution_note,
        created_by_user_id=user.id,
    )
    db.add(row)
    await db.commit()
    await db.refresh(row)
    return row


@router.patch("/support-tickets/{ticket_id}", response_model=SupportTicketRead)
async def patch_support_ticket(
    ticket_id: UUID,
    body: SupportTicketUpdate,
    db: Annotated[AsyncSession, Depends(get_db)],
    _: Annotated[User, Depends(require_permissions("field:write"))],
) -> SupportTicket:
    row = await db.get(SupportTicket, ticket_id)
    if row is None:
        raise HTTPException(status_code=404, detail="售后工单不存在")
    data = body.model_dump(exclude_unset=True)
    if "status" in data:
        ns = data["status"]
        if ns not in SUPPORT_STATUSES:
            raise HTTPException(status_code=400, detail="售后工单状态无效")
        if not _support_transition_ok(row.status, ns):
            raise HTTPException(
                status_code=400,
                detail=f"不允许从「{row.status}」变更为「{ns}」",
            )
    if "project_id" in data:
        await _require_project(db, data["project_id"])
    if "drawing_version_id" in data:
        await _require_drawing_version(db, data["drawing_version_id"])
    if "selection_stub_id" in data:
        await _require_selection_stub(db, data["selection_stub_id"])
    for k, v in data.items():
        setattr(row, k, v)
    await db.commit()
    await db.refresh(row)
    return row


@router.delete("/support-tickets/{ticket_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_support_ticket(
    ticket_id: UUID,
    db: Annotated[AsyncSession, Depends(get_db)],
    _: Annotated[User, Depends(require_permissions("field:write"))],
) -> None:
    row = await db.get(SupportTicket, ticket_id)
    if row is None:
        raise HTTPException(status_code=404, detail="售后工单不存在")
    await db.delete(row)
    await db.commit()


# ----- 知识库 -----


@router.get("/knowledge-docs", response_model=list[KnowledgeDocRead])
async def list_knowledge_docs(
    db: Annotated[AsyncSession, Depends(get_db)],
    _: Annotated[User, Depends(require_permissions("field:read"))],
    category: str | None = None,
    status_filter: str | None = Query(None, alias="status"),
    skip: int = 0,
    limit: int = 100,
) -> list[KnowledgeDoc]:
    stmt: Select[tuple[KnowledgeDoc]] = select(KnowledgeDoc).order_by(
        KnowledgeDoc.updated_at.desc()
    )
    if category:
        stmt = stmt.where(KnowledgeDoc.category == category)
    if status_filter:
        stmt = stmt.where(KnowledgeDoc.status == status_filter)
    stmt = stmt.offset(max(skip, 0)).limit(min(max(limit, 1), 500))
    result = await db.execute(stmt)
    return list(result.scalars().all())


@router.post(
    "/knowledge-docs",
    response_model=KnowledgeDocRead,
    status_code=status.HTTP_201_CREATED,
)
async def create_knowledge_doc(
    body: KnowledgeDocCreate,
    db: Annotated[AsyncSession, Depends(get_db)],
    user: Annotated[User, Depends(require_permissions("field:write"))],
) -> KnowledgeDoc:
    if body.status not in KD_STATUSES:
        raise HTTPException(status_code=400, detail="知识库文档状态无效")
    await _require_standard_part(db, body.related_standard_part_id)
    row = KnowledgeDoc(
        title=body.title,
        category=body.category,
        symptom=body.symptom,
        cause=body.cause,
        remedy=body.remedy,
        status=body.status,
        file_asset_id=body.file_asset_id,
        related_standard_part_id=body.related_standard_part_id,
        created_by_user_id=user.id,
    )
    db.add(row)
    await db.commit()
    await db.refresh(row)
    return row


@router.patch("/knowledge-docs/{doc_id}", response_model=KnowledgeDocRead)
async def patch_knowledge_doc(
    doc_id: UUID,
    body: KnowledgeDocUpdate,
    db: Annotated[AsyncSession, Depends(get_db)],
    _: Annotated[User, Depends(require_permissions("field:write"))],
) -> KnowledgeDoc:
    row = await db.get(KnowledgeDoc, doc_id)
    if row is None:
        raise HTTPException(status_code=404, detail="知识库条目不存在")
    data = body.model_dump(exclude_unset=True)
    if "status" in data and data["status"] not in KD_STATUSES:
        raise HTTPException(status_code=400, detail="知识库文档状态无效")
    if "related_standard_part_id" in data:
        await _require_standard_part(db, data["related_standard_part_id"])
    for k, v in data.items():
        setattr(row, k, v)
    await db.commit()
    await db.refresh(row)
    return row


@router.delete("/knowledge-docs/{doc_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_knowledge_doc(
    doc_id: UUID,
    db: Annotated[AsyncSession, Depends(get_db)],
    _: Annotated[User, Depends(require_permissions("field:write"))],
) -> None:
    row = await db.get(KnowledgeDoc, doc_id)
    if row is None:
        raise HTTPException(status_code=404, detail="知识库条目不存在")
    await db.delete(row)
    await db.commit()
