"""P3 研发域 REST：研发项目、任务、版本迭代、成果附件、成果入库（M3）。"""

from __future__ import annotations

from datetime import UTC, datetime
from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import Select, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.deps import require_permissions
from app.models.project import Project
from app.models.rd_research import (
    RdDeliverable,
    RdLibraryIntake,
    RdReleaseIteration,
    RdResearchProject,
    RdResearchTask,
)
from app.models.user import User
from app.schemas.rd_research import (
    RdDeliverableCreate,
    RdDeliverableRead,
    RdDeliverableUpdate,
    RdLibraryIntakeCreate,
    RdLibraryIntakeRead,
    RdLibraryIntakeReviewBody,
    RdLibraryIntakeUpdate,
    RdReleaseIterationCreate,
    RdReleaseIterationRead,
    RdReleaseIterationUpdate,
    RdReleaseReviewBody,
    RdResearchProjectCreate,
    RdResearchProjectRead,
    RdResearchProjectUpdate,
    RdResearchTaskCreate,
    RdResearchTaskRead,
    RdResearchTaskUpdate,
)
from app.services.rd_library_intake_service import approve_library_intake, reject_library_intake

router = APIRouter()


async def _get_rd_project(db: AsyncSession, pid: UUID) -> RdResearchProject:
    p = await db.get(RdResearchProject, pid)
    if p is None:
        raise HTTPException(status_code=404, detail="研发项目不存在")
    return p


async def _validate_parent_project(db: AsyncSession, parent_id: UUID | None) -> None:
    if parent_id is None:
        return
    mp = await db.get(Project, parent_id)
    if mp is None:
        raise HTTPException(status_code=400, detail="关联 PMO 项目不存在")


# ----- 研发项目 -----


@router.get("/projects", response_model=list[RdResearchProjectRead])
async def list_rd_projects(
    db: Annotated[AsyncSession, Depends(get_db)],
    _: Annotated[User, Depends(require_permissions("rd:read"))],
    parent_project_id: UUID | None = None,
    skip: int = 0,
    limit: int = 100,
) -> list[RdResearchProject]:
    stmt: Select[tuple[RdResearchProject]] = select(RdResearchProject).order_by(
        RdResearchProject.created_at.desc()
    )
    if parent_project_id is not None:
        stmt = stmt.where(RdResearchProject.parent_project_id == parent_project_id)
    stmt = stmt.offset(max(skip, 0)).limit(min(max(limit, 1), 500))
    result = await db.execute(stmt)
    return list(result.scalars().all())


@router.post("/projects", response_model=RdResearchProjectRead, status_code=status.HTTP_201_CREATED)
async def create_rd_project(
    body: RdResearchProjectCreate,
    db: Annotated[AsyncSession, Depends(get_db)],
    _: Annotated[User, Depends(require_permissions("rd:write"))],
) -> RdResearchProject:
    await _validate_parent_project(db, body.parent_project_id)
    if body.code:
        dup = await db.execute(
            select(RdResearchProject.id).where(RdResearchProject.code == body.code)
        )
        if dup.scalar_one_or_none():
            raise HTTPException(status_code=400, detail="研发项目编码已存在")
    p = RdResearchProject(**body.model_dump())
    db.add(p)
    await db.commit()
    await db.refresh(p)
    return p


@router.get("/projects/{project_id}", response_model=RdResearchProjectRead)
async def get_rd_project(
    project_id: UUID,
    db: Annotated[AsyncSession, Depends(get_db)],
    _: Annotated[User, Depends(require_permissions("rd:read"))],
) -> RdResearchProject:
    return await _get_rd_project(db, project_id)


@router.patch("/projects/{project_id}", response_model=RdResearchProjectRead)
async def patch_rd_project(
    project_id: UUID,
    body: RdResearchProjectUpdate,
    db: Annotated[AsyncSession, Depends(get_db)],
    _: Annotated[User, Depends(require_permissions("rd:write"))],
) -> RdResearchProject:
    p = await _get_rd_project(db, project_id)
    data = body.model_dump(exclude_unset=True)
    if "parent_project_id" in data:
        await _validate_parent_project(db, data["parent_project_id"])
    if data.get("code"):
        dup = await db.execute(
            select(RdResearchProject.id).where(
                RdResearchProject.code == data["code"],
                RdResearchProject.id != project_id,
            )
        )
        if dup.scalar_one_or_none():
            raise HTTPException(status_code=400, detail="研发项目编码已存在")
    for k, v in data.items():
        setattr(p, k, v)
    await db.commit()
    await db.refresh(p)
    return p


@router.delete("/projects/{project_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_rd_project(
    project_id: UUID,
    db: Annotated[AsyncSession, Depends(get_db)],
    _: Annotated[User, Depends(require_permissions("rd:write"))],
) -> None:
    p = await _get_rd_project(db, project_id)
    await db.delete(p)
    await db.commit()


# ----- 研发任务 -----


@router.get("/projects/{project_id}/tasks", response_model=list[RdResearchTaskRead])
async def list_rd_tasks(
    project_id: UUID,
    db: Annotated[AsyncSession, Depends(get_db)],
    _: Annotated[User, Depends(require_permissions("rd:read"))],
) -> list[RdResearchTask]:
    await _get_rd_project(db, project_id)
    result = await db.execute(
        select(RdResearchTask)
        .where(RdResearchTask.research_project_id == project_id)
        .order_by(RdResearchTask.sort_order, RdResearchTask.created_at)
    )
    return list(result.scalars().all())


@router.post(
    "/projects/{project_id}/tasks",
    response_model=RdResearchTaskRead,
    status_code=status.HTTP_201_CREATED,
)
async def create_rd_task(
    project_id: UUID,
    body: RdResearchTaskCreate,
    db: Annotated[AsyncSession, Depends(get_db)],
    _: Annotated[User, Depends(require_permissions("rd:write"))],
) -> RdResearchTask:
    await _get_rd_project(db, project_id)
    t = RdResearchTask(research_project_id=project_id, **body.model_dump())
    db.add(t)
    await db.commit()
    await db.refresh(t)
    return t


@router.patch("/projects/{project_id}/tasks/{task_id}", response_model=RdResearchTaskRead)
async def patch_rd_task(
    project_id: UUID,
    task_id: UUID,
    body: RdResearchTaskUpdate,
    db: Annotated[AsyncSession, Depends(get_db)],
    _: Annotated[User, Depends(require_permissions("rd:write"))],
) -> RdResearchTask:
    await _get_rd_project(db, project_id)
    t = await db.get(RdResearchTask, task_id)
    if t is None or t.research_project_id != project_id:
        raise HTTPException(status_code=404, detail="任务不存在")
    for k, v in body.model_dump(exclude_unset=True).items():
        setattr(t, k, v)
    await db.commit()
    await db.refresh(t)
    return t


@router.delete("/projects/{project_id}/tasks/{task_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_rd_task(
    project_id: UUID,
    task_id: UUID,
    db: Annotated[AsyncSession, Depends(get_db)],
    _: Annotated[User, Depends(require_permissions("rd:write"))],
) -> None:
    await _get_rd_project(db, project_id)
    t = await db.get(RdResearchTask, task_id)
    if t is None or t.research_project_id != project_id:
        raise HTTPException(status_code=404, detail="任务不存在")
    await db.delete(t)
    await db.commit()


# ----- 版本迭代 -----


@router.get(
    "/projects/{project_id}/release-iterations",
    response_model=list[RdReleaseIterationRead],
)
async def list_release_iterations(
    project_id: UUID,
    db: Annotated[AsyncSession, Depends(get_db)],
    _: Annotated[User, Depends(require_permissions("rd:read"))],
) -> list[RdReleaseIteration]:
    await _get_rd_project(db, project_id)
    result = await db.execute(
        select(RdReleaseIteration)
        .where(RdReleaseIteration.research_project_id == project_id)
        .order_by(RdReleaseIteration.created_at.desc())
    )
    return list(result.scalars().all())


@router.post(
    "/projects/{project_id}/release-iterations",
    response_model=RdReleaseIterationRead,
    status_code=status.HTTP_201_CREATED,
)
async def create_release_iteration(
    project_id: UUID,
    body: RdReleaseIterationCreate,
    db: Annotated[AsyncSession, Depends(get_db)],
    _: Annotated[User, Depends(require_permissions("rd:write"))],
) -> RdReleaseIteration:
    await _get_rd_project(db, project_id)
    dup = await db.execute(
        select(RdReleaseIteration.id).where(
            RdReleaseIteration.research_project_id == project_id,
            RdReleaseIteration.version_label == body.version_label,
        )
    )
    if dup.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="该版本号已存在")
    row = RdReleaseIteration(
        research_project_id=project_id,
        version_label=body.version_label,
        release_notes=body.release_notes,
        status="draft",
    )
    db.add(row)
    await db.commit()
    await db.refresh(row)
    return row


@router.patch(
    "/projects/{project_id}/release-iterations/{iteration_id}",
    response_model=RdReleaseIterationRead,
)
async def patch_release_iteration(
    project_id: UUID,
    iteration_id: UUID,
    body: RdReleaseIterationUpdate,
    db: Annotated[AsyncSession, Depends(get_db)],
    _: Annotated[User, Depends(require_permissions("rd:write"))],
) -> RdReleaseIteration:
    await _get_rd_project(db, project_id)
    row = await db.get(RdReleaseIteration, iteration_id)
    if row is None or row.research_project_id != project_id:
        raise HTTPException(status_code=404, detail="版本迭代不存在")
    for k, v in body.model_dump(exclude_unset=True).items():
        setattr(row, k, v)
    await db.commit()
    await db.refresh(row)
    return row


@router.post(
    "/projects/{project_id}/release-iterations/{iteration_id}/submit",
    response_model=RdReleaseIterationRead,
)
async def submit_release_iteration(
    project_id: UUID,
    iteration_id: UUID,
    db: Annotated[AsyncSession, Depends(get_db)],
    user: Annotated[User, Depends(require_permissions("rd:write"))],
) -> RdReleaseIteration:
    await _get_rd_project(db, project_id)
    row = await db.get(RdReleaseIteration, iteration_id)
    if row is None or row.research_project_id != project_id:
        raise HTTPException(status_code=404, detail="版本迭代不存在")
    if row.status not in ("draft", "rejected"):
        raise HTTPException(status_code=400, detail="当前状态不可提交")
    now = datetime.now(UTC)
    row.status = "submitted"
    row.submitted_by_user_id = user.id
    row.submitted_at = now
    await db.commit()
    await db.refresh(row)
    return row


@router.post(
    "/projects/{project_id}/release-iterations/{iteration_id}/review",
    response_model=RdReleaseIterationRead,
)
async def review_release_iteration(
    project_id: UUID,
    iteration_id: UUID,
    body: RdReleaseReviewBody,
    db: Annotated[AsyncSession, Depends(get_db)],
    user: Annotated[User, Depends(require_permissions("rd:write"))],
    decision: str = Query(..., pattern="^(approve|reject)$"),
) -> RdReleaseIteration:
    """研发侧审批版本说明（approve|reject）；完整工作流引擎接入前先用 rd:write。"""
    await _get_rd_project(db, project_id)
    row = await db.get(RdReleaseIteration, iteration_id)
    if row is None or row.research_project_id != project_id:
        raise HTTPException(status_code=404, detail="版本迭代不存在")
    if row.status != "submitted":
        raise HTTPException(status_code=400, detail="仅待审批记录可审")
    now = datetime.now(UTC)
    row.reviewed_by_user_id = user.id
    row.reviewed_at = now
    row.review_comment = body.comment
    row.status = "approved" if decision == "approve" else "rejected"
    await db.commit()
    await db.refresh(row)
    return row


# ----- 成果附件 -----


@router.get("/projects/{project_id}/deliverables", response_model=list[RdDeliverableRead])
async def list_deliverables(
    project_id: UUID,
    db: Annotated[AsyncSession, Depends(get_db)],
    _: Annotated[User, Depends(require_permissions("rd:read"))],
    category: str | None = None,
    title_q: str | None = Query(None, description="标题模糊匹配"),
    tag: str | None = Query(None, description="标签包含（任一匹配）"),
) -> list[RdDeliverable]:
    await _get_rd_project(db, project_id)
    stmt = select(RdDeliverable).where(RdDeliverable.research_project_id == project_id)
    if category:
        stmt = stmt.where(RdDeliverable.category == category)
    if title_q:
        stmt = stmt.where(RdDeliverable.title.ilike(f"%{title_q}%"))
    stmt = stmt.order_by(RdDeliverable.created_at.desc())
    result = await db.execute(stmt)
    rows = list(result.scalars().all())
    if tag:
        rows = [r for r in rows if isinstance(r.tags, list) and tag in r.tags]
    return rows


@router.post(
    "/projects/{project_id}/deliverables",
    response_model=RdDeliverableRead,
    status_code=status.HTTP_201_CREATED,
)
async def create_deliverable(
    project_id: UUID,
    body: RdDeliverableCreate,
    db: Annotated[AsyncSession, Depends(get_db)],
    user: Annotated[User, Depends(require_permissions("rd:write"))],
) -> RdDeliverable:
    await _get_rd_project(db, project_id)
    d = RdDeliverable(
        research_project_id=project_id,
        title=body.title,
        category=body.category,
        tags=body.tags,
        file_asset_id=body.file_asset_id,
        remark=body.remark,
        created_by_user_id=user.id,
    )
    db.add(d)
    await db.commit()
    await db.refresh(d)
    return d


@router.patch(
    "/projects/{project_id}/deliverables/{deliverable_id}",
    response_model=RdDeliverableRead,
)
async def patch_deliverable(
    project_id: UUID,
    deliverable_id: UUID,
    body: RdDeliverableUpdate,
    db: Annotated[AsyncSession, Depends(get_db)],
    _: Annotated[User, Depends(require_permissions("rd:write"))],
) -> RdDeliverable:
    await _get_rd_project(db, project_id)
    d = await db.get(RdDeliverable, deliverable_id)
    if d is None or d.research_project_id != project_id:
        raise HTTPException(status_code=404, detail="成果附件不存在")
    for k, v in body.model_dump(exclude_unset=True).items():
        setattr(d, k, v)
    await db.commit()
    await db.refresh(d)
    return d


@router.delete(
    "/projects/{project_id}/deliverables/{deliverable_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
async def delete_deliverable(
    project_id: UUID,
    deliverable_id: UUID,
    db: Annotated[AsyncSession, Depends(get_db)],
    _: Annotated[User, Depends(require_permissions("rd:write"))],
) -> None:
    await _get_rd_project(db, project_id)
    d = await db.get(RdDeliverable, deliverable_id)
    if d is None or d.research_project_id != project_id:
        raise HTTPException(status_code=404, detail="成果附件不存在")
    await db.delete(d)
    await db.commit()


# ----- 成果入库申请 -----


@router.get("/library-intakes", response_model=list[RdLibraryIntakeRead])
async def list_library_intakes(
    db: Annotated[AsyncSession, Depends(get_db)],
    _: Annotated[User, Depends(require_permissions("rd:read"))],
    status_filter: str | None = Query(None, alias="status"),
    research_project_id: UUID | None = None,
    skip: int = 0,
    limit: int = 100,
) -> list[RdLibraryIntake]:
    stmt = select(RdLibraryIntake).order_by(RdLibraryIntake.created_at.desc())
    if status_filter:
        stmt = stmt.where(RdLibraryIntake.status == status_filter)
    if research_project_id:
        stmt = stmt.where(RdLibraryIntake.research_project_id == research_project_id)
    stmt = stmt.offset(max(skip, 0)).limit(min(max(limit, 1), 500))
    result = await db.execute(stmt)
    return list(result.scalars().all())


@router.post(
    "/library-intakes",
    response_model=RdLibraryIntakeRead,
    status_code=status.HTTP_201_CREATED,
)
async def create_library_intake(
    body: RdLibraryIntakeCreate,
    db: Annotated[AsyncSession, Depends(get_db)],
    user: Annotated[User, Depends(require_permissions("rd:write"))],
) -> RdLibraryIntake:
    if body.research_project_id:
        await _get_rd_project(db, body.research_project_id)
    row = RdLibraryIntake(**body.model_dump(), created_by_user_id=user.id)
    db.add(row)
    await db.commit()
    await db.refresh(row)
    return row


@router.get("/library-intakes/{intake_id}", response_model=RdLibraryIntakeRead)
async def get_library_intake(
    intake_id: UUID,
    db: Annotated[AsyncSession, Depends(get_db)],
    _: Annotated[User, Depends(require_permissions("rd:read"))],
) -> RdLibraryIntake:
    row = await db.get(RdLibraryIntake, intake_id)
    if row is None:
        raise HTTPException(status_code=404, detail="入库申请不存在")
    return row


@router.patch("/library-intakes/{intake_id}", response_model=RdLibraryIntakeRead)
async def patch_library_intake(
    intake_id: UUID,
    body: RdLibraryIntakeUpdate,
    db: Annotated[AsyncSession, Depends(get_db)],
    _: Annotated[User, Depends(require_permissions("rd:write"))],
) -> RdLibraryIntake:
    row = await db.get(RdLibraryIntake, intake_id)
    if row is None:
        raise HTTPException(status_code=404, detail="入库申请不存在")
    if row.status not in ("draft", "rejected"):
        raise HTTPException(status_code=400, detail="当前状态不可编辑")
    data = body.model_dump(exclude_unset=True)
    if data.get("research_project_id"):
        await _get_rd_project(db, data["research_project_id"])
    for k, v in data.items():
        setattr(row, k, v)
    await db.commit()
    await db.refresh(row)
    return row


@router.post("/library-intakes/{intake_id}/submit", response_model=RdLibraryIntakeRead)
async def submit_library_intake(
    intake_id: UUID,
    db: Annotated[AsyncSession, Depends(get_db)],
    user: Annotated[User, Depends(require_permissions("rd:write"))],
) -> RdLibraryIntake:
    row = await db.get(RdLibraryIntake, intake_id)
    if row is None:
        raise HTTPException(status_code=404, detail="入库申请不存在")
    if row.status not in ("draft", "rejected"):
        raise HTTPException(status_code=400, detail="当前状态不可提交审批")
    now = datetime.now(UTC)
    row.status = "submitted"
    row.submitted_by_user_id = user.id
    row.submitted_at = now
    await db.commit()
    await db.refresh(row)
    return row


@router.post("/library-intakes/{intake_id}/withdraw", response_model=RdLibraryIntakeRead)
async def withdraw_library_intake(
    intake_id: UUID,
    db: Annotated[AsyncSession, Depends(get_db)],
    _: Annotated[User, Depends(require_permissions("rd:write"))],
) -> RdLibraryIntake:
    row = await db.get(RdLibraryIntake, intake_id)
    if row is None:
        raise HTTPException(status_code=404, detail="入库申请不存在")
    if row.status != "submitted":
        raise HTTPException(status_code=400, detail="仅已提交可申请撤回")
    row.status = "withdrawn"
    await db.commit()
    await db.refresh(row)
    return row


@router.post("/library-intakes/{intake_id}/approve", response_model=RdLibraryIntakeRead)
async def approve_intake_endpoint(
    intake_id: UUID,
    body: RdLibraryIntakeReviewBody,
    db: Annotated[AsyncSession, Depends(get_db)],
    user: Annotated[User, Depends(require_permissions("rd:intake_approve"))],
) -> RdLibraryIntake:
    try:
        return await approve_library_intake(db, intake_id, user.id, body.comment)
    except ValueError as e:
        msg = str(e)
        if msg == "not_found":
            raise HTTPException(status_code=404, detail="入库申请不存在") from e
        if msg == "invalid_status":
            raise HTTPException(status_code=400, detail="仅待审批可申请可通过") from e
        if msg == "code_exists":
            raise HTTPException(status_code=400, detail="拟用标准件编码已在库中存在") from e
        raise


@router.post("/library-intakes/{intake_id}/reject", response_model=RdLibraryIntakeRead)
async def reject_intake_endpoint(
    intake_id: UUID,
    body: RdLibraryIntakeReviewBody,
    db: Annotated[AsyncSession, Depends(get_db)],
    user: Annotated[User, Depends(require_permissions("rd:intake_approve"))],
) -> RdLibraryIntake:
    try:
        return await reject_library_intake(db, intake_id, user.id, body.comment)
    except ValueError as e:
        msg = str(e)
        if msg == "not_found":
            raise HTTPException(status_code=404, detail="入库申请不存在") from e
        if msg == "invalid_status":
            raise HTTPException(status_code=400, detail="仅待审批可驳回") from e
        raise
