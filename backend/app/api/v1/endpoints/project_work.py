"""P1：项目下 WBS、里程碑、风险、设计任务、设计变更、选型存根 API。"""

from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.deps import require_permissions
from app.models.project import Project
from app.models.user import User
from app.models.work_plan import (
    DesignChangeRequest,
    DesignTask,
    ProjectMilestone,
    ProjectRisk,
    ProjectTask,
    SelectionStub,
)
from app.schemas.work_plan import (
    DesignChangeCreate,
    DesignChangeRead,
    DesignChangeUpdate,
    DesignTaskCreate,
    DesignTaskRead,
    DesignTaskUpdate,
    ProjectMilestoneCreate,
    ProjectMilestoneRead,
    ProjectMilestoneUpdate,
    ProjectRiskCreate,
    ProjectRiskRead,
    ProjectRiskUpdate,
    ProjectTaskCreate,
    ProjectTaskRead,
    ProjectTaskUpdate,
    SelectionStubCreate,
    SelectionStubRead,
    SelectionStubUpdate,
)
from app.services.audit_service import log_action

router = APIRouter()


async def _project_or_404(db: AsyncSession, project_id: UUID) -> Project:
    p = await db.get(Project, project_id)
    if p is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="项目不存在")
    return p


# ----- WBS 任务 -----
@router.get("/{project_id}/tasks", response_model=list[ProjectTaskRead])
async def list_tasks(
    project_id: UUID,
    db: Annotated[AsyncSession, Depends(get_db)],
    _: Annotated[User, Depends(require_permissions("wbs:read"))],
) -> list[ProjectTask]:
    await _project_or_404(db, project_id)
    r = await db.execute(
        select(ProjectTask)
        .where(ProjectTask.project_id == project_id)
        .order_by(ProjectTask.sort_order, ProjectTask.created_at)
    )
    return list(r.scalars().all())


@router.post(
    "/{project_id}/tasks",
    response_model=ProjectTaskRead,
    status_code=status.HTTP_201_CREATED,
)
async def create_task(
    request: Request,
    project_id: UUID,
    body: ProjectTaskCreate,
    db: Annotated[AsyncSession, Depends(get_db)],
    user: Annotated[User, Depends(require_permissions("wbs:write"))],
) -> ProjectTask:
    await _project_or_404(db, project_id)
    if body.parent_id is not None:
        parent = await db.get(ProjectTask, body.parent_id)
        if parent is None or parent.project_id != project_id:
            raise HTTPException(status_code=400, detail="父任务不存在或不属于该项目")
    row = ProjectTask(project_id=project_id, **body.model_dump())
    db.add(row)
    await db.flush()
    await log_action(
        db,
        user_id=user.id,
        action="wbs.task.create",
        resource_type="project_task",
        resource_id=str(row.id),
        ip=request.client.host if request.client else None,
        user_agent=request.headers.get("user-agent"),
        detail={"project_id": str(project_id)},
    )
    await db.commit()
    await db.refresh(row)
    return row


@router.get("/{project_id}/tasks/{task_id}", response_model=ProjectTaskRead)
async def get_task(
    project_id: UUID,
    task_id: UUID,
    db: Annotated[AsyncSession, Depends(get_db)],
    _: Annotated[User, Depends(require_permissions("wbs:read"))],
) -> ProjectTask:
    row = await db.get(ProjectTask, task_id)
    if row is None or row.project_id != project_id:
        raise HTTPException(status_code=404, detail="任务不存在")
    return row


@router.patch("/{project_id}/tasks/{task_id}", response_model=ProjectTaskRead)
async def update_task(
    request: Request,
    project_id: UUID,
    task_id: UUID,
    body: ProjectTaskUpdate,
    db: Annotated[AsyncSession, Depends(get_db)],
    user: Annotated[User, Depends(require_permissions("wbs:write"))],
) -> ProjectTask:
    row = await db.get(ProjectTask, task_id)
    if row is None or row.project_id != project_id:
        raise HTTPException(status_code=404, detail="任务不存在")
    data = body.model_dump(exclude_unset=True)
    if "parent_id" in data and data["parent_id"] is not None:
        pid = data["parent_id"]
        if pid == task_id:
            raise HTTPException(status_code=400, detail="父任务不能为自身")
        parent = await db.get(ProjectTask, pid)
        if parent is None or parent.project_id != project_id:
            raise HTTPException(status_code=400, detail="父任务不存在或不属于该项目")
    for k, v in data.items():
        setattr(row, k, v)
    await log_action(
        db,
        user_id=user.id,
        action="wbs.task.update",
        resource_type="project_task",
        resource_id=str(task_id),
        ip=request.client.host if request.client else None,
        user_agent=request.headers.get("user-agent"),
    )
    await db.commit()
    await db.refresh(row)
    return row


@router.delete("/{project_id}/tasks/{task_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_task(
    request: Request,
    project_id: UUID,
    task_id: UUID,
    db: Annotated[AsyncSession, Depends(get_db)],
    user: Annotated[User, Depends(require_permissions("wbs:write"))],
) -> None:
    row = await db.get(ProjectTask, task_id)
    if row is None or row.project_id != project_id:
        raise HTTPException(status_code=404, detail="任务不存在")
    await db.delete(row)
    await log_action(
        db,
        user_id=user.id,
        action="wbs.task.delete",
        resource_type="project_task",
        resource_id=str(task_id),
        ip=request.client.host if request.client else None,
        user_agent=request.headers.get("user-agent"),
    )
    await db.commit()


# ----- 里程碑 -----
@router.get("/{project_id}/milestones", response_model=list[ProjectMilestoneRead])
async def list_milestones(
    project_id: UUID,
    db: Annotated[AsyncSession, Depends(get_db)],
    _: Annotated[User, Depends(require_permissions("milestone:read"))],
) -> list[ProjectMilestone]:
    await _project_or_404(db, project_id)
    r = await db.execute(
        select(ProjectMilestone)
        .where(ProjectMilestone.project_id == project_id)
        .order_by(ProjectMilestone.sort_order, ProjectMilestone.created_at)
    )
    return list(r.scalars().all())


@router.post(
    "/{project_id}/milestones",
    response_model=ProjectMilestoneRead,
    status_code=status.HTTP_201_CREATED,
)
async def create_milestone(
    request: Request,
    project_id: UUID,
    body: ProjectMilestoneCreate,
    db: Annotated[AsyncSession, Depends(get_db)],
    user: Annotated[User, Depends(require_permissions("milestone:write"))],
) -> ProjectMilestone:
    await _project_or_404(db, project_id)
    row = ProjectMilestone(project_id=project_id, **body.model_dump())
    db.add(row)
    await db.flush()
    await log_action(
        db,
        user_id=user.id,
        action="milestone.create",
        resource_type="project_milestone",
        resource_id=str(row.id),
        ip=request.client.host if request.client else None,
        user_agent=request.headers.get("user-agent"),
        detail={"project_id": str(project_id)},
    )
    await db.commit()
    await db.refresh(row)
    return row


@router.patch("/{project_id}/milestones/{mid}", response_model=ProjectMilestoneRead)
async def update_milestone(
    request: Request,
    project_id: UUID,
    mid: UUID,
    body: ProjectMilestoneUpdate,
    db: Annotated[AsyncSession, Depends(get_db)],
    user: Annotated[User, Depends(require_permissions("milestone:write"))],
) -> ProjectMilestone:
    row = await db.get(ProjectMilestone, mid)
    if row is None or row.project_id != project_id:
        raise HTTPException(status_code=404, detail="里程碑不存在")
    for k, v in body.model_dump(exclude_unset=True).items():
        setattr(row, k, v)
    await log_action(
        db,
        user_id=user.id,
        action="milestone.update",
        resource_type="project_milestone",
        resource_id=str(mid),
        ip=request.client.host if request.client else None,
        user_agent=request.headers.get("user-agent"),
    )
    await db.commit()
    await db.refresh(row)
    return row


@router.delete("/{project_id}/milestones/{mid}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_milestone(
    project_id: UUID,
    mid: UUID,
    db: Annotated[AsyncSession, Depends(get_db)],
    user: Annotated[User, Depends(require_permissions("milestone:write"))],
) -> None:
    row = await db.get(ProjectMilestone, mid)
    if row is None or row.project_id != project_id:
        raise HTTPException(status_code=404, detail="里程碑不存在")
    await db.delete(row)
    await db.commit()


# ----- 风险 -----
@router.get("/{project_id}/risks", response_model=list[ProjectRiskRead])
async def list_risks(
    project_id: UUID,
    db: Annotated[AsyncSession, Depends(get_db)],
    _: Annotated[User, Depends(require_permissions("risk:read"))],
) -> list[ProjectRisk]:
    await _project_or_404(db, project_id)
    r = await db.execute(
        select(ProjectRisk)
        .where(ProjectRisk.project_id == project_id)
        .order_by(ProjectRisk.created_at.desc())
    )
    return list(r.scalars().all())


@router.post(
    "/{project_id}/risks",
    response_model=ProjectRiskRead,
    status_code=status.HTTP_201_CREATED,
)
async def create_risk(
    request: Request,
    project_id: UUID,
    body: ProjectRiskCreate,
    db: Annotated[AsyncSession, Depends(get_db)],
    user: Annotated[User, Depends(require_permissions("risk:write"))],
) -> ProjectRisk:
    await _project_or_404(db, project_id)
    row = ProjectRisk(project_id=project_id, **body.model_dump())
    db.add(row)
    await db.flush()
    await log_action(
        db,
        user_id=user.id,
        action="risk.create",
        resource_type="project_risk",
        resource_id=str(row.id),
        ip=request.client.host if request.client else None,
        user_agent=request.headers.get("user-agent"),
        detail={"project_id": str(project_id)},
    )
    await db.commit()
    await db.refresh(row)
    return row


@router.patch("/{project_id}/risks/{rid}", response_model=ProjectRiskRead)
async def update_risk(
    request: Request,
    project_id: UUID,
    rid: UUID,
    body: ProjectRiskUpdate,
    db: Annotated[AsyncSession, Depends(get_db)],
    user: Annotated[User, Depends(require_permissions("risk:write"))],
) -> ProjectRisk:
    row = await db.get(ProjectRisk, rid)
    if row is None or row.project_id != project_id:
        raise HTTPException(status_code=404, detail="风险不存在")
    for k, v in body.model_dump(exclude_unset=True).items():
        setattr(row, k, v)
    await log_action(
        db,
        user_id=user.id,
        action="risk.update",
        resource_type="project_risk",
        resource_id=str(rid),
        ip=request.client.host if request.client else None,
        user_agent=request.headers.get("user-agent"),
    )
    await db.commit()
    await db.refresh(row)
    return row


@router.delete("/{project_id}/risks/{rid}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_risk(
    project_id: UUID,
    rid: UUID,
    db: Annotated[AsyncSession, Depends(get_db)],
    _: Annotated[User, Depends(require_permissions("risk:write"))],
) -> None:
    row = await db.get(ProjectRisk, rid)
    if row is None or row.project_id != project_id:
        raise HTTPException(status_code=404, detail="风险不存在")
    await db.delete(row)
    await db.commit()


# ----- 设计任务 -----
@router.get("/{project_id}/design-tasks", response_model=list[DesignTaskRead])
async def list_design_tasks(
    project_id: UUID,
    db: Annotated[AsyncSession, Depends(get_db)],
    _: Annotated[User, Depends(require_permissions("design_task:read"))],
) -> list[DesignTask]:
    await _project_or_404(db, project_id)
    r = await db.execute(
        select(DesignTask)
        .where(DesignTask.project_id == project_id)
        .order_by(DesignTask.sort_order, DesignTask.created_at)
    )
    return list(r.scalars().all())


@router.post(
    "/{project_id}/design-tasks",
    response_model=DesignTaskRead,
    status_code=status.HTTP_201_CREATED,
)
async def create_design_task(
    request: Request,
    project_id: UUID,
    body: DesignTaskCreate,
    db: Annotated[AsyncSession, Depends(get_db)],
    user: Annotated[User, Depends(require_permissions("design_task:write"))],
) -> DesignTask:
    await _project_or_404(db, project_id)
    row = DesignTask(project_id=project_id, **body.model_dump())
    db.add(row)
    await db.flush()
    await log_action(
        db,
        user_id=user.id,
        action="design_task.create",
        resource_type="design_task",
        resource_id=str(row.id),
        ip=request.client.host if request.client else None,
        user_agent=request.headers.get("user-agent"),
        detail={"project_id": str(project_id)},
    )
    await db.commit()
    await db.refresh(row)
    return row


@router.patch("/{project_id}/design-tasks/{tid}", response_model=DesignTaskRead)
async def update_design_task(
    request: Request,
    project_id: UUID,
    tid: UUID,
    body: DesignTaskUpdate,
    db: Annotated[AsyncSession, Depends(get_db)],
    user: Annotated[User, Depends(require_permissions("design_task:write"))],
) -> DesignTask:
    row = await db.get(DesignTask, tid)
    if row is None or row.project_id != project_id:
        raise HTTPException(status_code=404, detail="设计任务不存在")
    for k, v in body.model_dump(exclude_unset=True).items():
        setattr(row, k, v)
    await log_action(
        db,
        user_id=user.id,
        action="design_task.update",
        resource_type="design_task",
        resource_id=str(tid),
        ip=request.client.host if request.client else None,
        user_agent=request.headers.get("user-agent"),
    )
    await db.commit()
    await db.refresh(row)
    return row


@router.delete("/{project_id}/design-tasks/{tid}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_design_task(
    project_id: UUID,
    tid: UUID,
    db: Annotated[AsyncSession, Depends(get_db)],
    _: Annotated[User, Depends(require_permissions("design_task:write"))],
) -> None:
    row = await db.get(DesignTask, tid)
    if row is None or row.project_id != project_id:
        raise HTTPException(status_code=404, detail="设计任务不存在")
    await db.delete(row)
    await db.commit()


# ----- 设计变更 -----
@router.get("/{project_id}/design-changes", response_model=list[DesignChangeRead])
async def list_design_changes(
    project_id: UUID,
    db: Annotated[AsyncSession, Depends(get_db)],
    _: Annotated[User, Depends(require_permissions("design_change:read"))],
) -> list[DesignChangeRequest]:
    await _project_or_404(db, project_id)
    r = await db.execute(
        select(DesignChangeRequest)
        .where(DesignChangeRequest.project_id == project_id)
        .order_by(DesignChangeRequest.created_at.desc())
    )
    return list(r.scalars().all())


@router.post(
    "/{project_id}/design-changes",
    response_model=DesignChangeRead,
    status_code=status.HTTP_201_CREATED,
)
async def create_design_change(
    request: Request,
    project_id: UUID,
    body: DesignChangeCreate,
    db: Annotated[AsyncSession, Depends(get_db)],
    user: Annotated[User, Depends(require_permissions("design_change:write"))],
) -> DesignChangeRequest:
    await _project_or_404(db, project_id)
    row = DesignChangeRequest(
        project_id=project_id,
        title=body.title,
        description=body.description,
        status=body.status,
        created_by_user_id=user.id,
    )
    db.add(row)
    await db.flush()
    await log_action(
        db,
        user_id=user.id,
        action="design_change.create",
        resource_type="design_change_request",
        resource_id=str(row.id),
        ip=request.client.host if request.client else None,
        user_agent=request.headers.get("user-agent"),
        detail={"project_id": str(project_id)},
    )
    await db.commit()
    await db.refresh(row)
    return row


@router.patch("/{project_id}/design-changes/{cid}", response_model=DesignChangeRead)
async def update_design_change(
    request: Request,
    project_id: UUID,
    cid: UUID,
    body: DesignChangeUpdate,
    db: Annotated[AsyncSession, Depends(get_db)],
    user: Annotated[User, Depends(require_permissions("design_change:write"))],
) -> DesignChangeRequest:
    row = await db.get(DesignChangeRequest, cid)
    if row is None or row.project_id != project_id:
        raise HTTPException(status_code=404, detail="设计变更不存在")
    for k, v in body.model_dump(exclude_unset=True).items():
        setattr(row, k, v)
    await log_action(
        db,
        user_id=user.id,
        action="design_change.update",
        resource_type="design_change_request",
        resource_id=str(cid),
        ip=request.client.host if request.client else None,
        user_agent=request.headers.get("user-agent"),
    )
    await db.commit()
    await db.refresh(row)
    return row


@router.delete("/{project_id}/design-changes/{cid}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_design_change(
    project_id: UUID,
    cid: UUID,
    db: Annotated[AsyncSession, Depends(get_db)],
    _: Annotated[User, Depends(require_permissions("design_change:write"))],
) -> None:
    row = await db.get(DesignChangeRequest, cid)
    if row is None or row.project_id != project_id:
        raise HTTPException(status_code=404, detail="设计变更不存在")
    await db.delete(row)
    await db.commit()


# ----- 选型存根 -----
@router.get("/{project_id}/selection-stubs", response_model=list[SelectionStubRead])
async def list_selection_stubs(
    project_id: UUID,
    db: Annotated[AsyncSession, Depends(get_db)],
    _: Annotated[User, Depends(require_permissions("selection:read"))],
) -> list[SelectionStub]:
    await _project_or_404(db, project_id)
    r = await db.execute(
        select(SelectionStub)
        .where(SelectionStub.project_id == project_id)
        .order_by(SelectionStub.created_at.desc())
    )
    return list(r.scalars().all())


@router.post(
    "/{project_id}/selection-stubs",
    response_model=SelectionStubRead,
    status_code=status.HTTP_201_CREATED,
)
async def create_selection_stub(
    request: Request,
    project_id: UUID,
    body: SelectionStubCreate,
    db: Annotated[AsyncSession, Depends(get_db)],
    user: Annotated[User, Depends(require_permissions("selection:write"))],
) -> SelectionStub:
    await _project_or_404(db, project_id)
    row = SelectionStub(
        project_id=project_id,
        title=body.title,
        payload=body.payload or {},
        remark=body.remark,
    )
    db.add(row)
    await db.flush()
    await log_action(
        db,
        user_id=user.id,
        action="selection_stub.create",
        resource_type="selection_stub",
        resource_id=str(row.id),
        ip=request.client.host if request.client else None,
        user_agent=request.headers.get("user-agent"),
        detail={"project_id": str(project_id)},
    )
    await db.commit()
    await db.refresh(row)
    return row


@router.patch("/{project_id}/selection-stubs/{sid}", response_model=SelectionStubRead)
async def update_selection_stub(
    request: Request,
    project_id: UUID,
    sid: UUID,
    body: SelectionStubUpdate,
    db: Annotated[AsyncSession, Depends(get_db)],
    user: Annotated[User, Depends(require_permissions("selection:write"))],
) -> SelectionStub:
    row = await db.get(SelectionStub, sid)
    if row is None or row.project_id != project_id:
        raise HTTPException(status_code=404, detail="选型存根不存在")
    data = body.model_dump(exclude_unset=True)
    if "payload" in data and data["payload"] is not None:
        row.payload = data.pop("payload")
    for k, v in data.items():
        setattr(row, k, v)
    await log_action(
        db,
        user_id=user.id,
        action="selection_stub.update",
        resource_type="selection_stub",
        resource_id=str(sid),
        ip=request.client.host if request.client else None,
        user_agent=request.headers.get("user-agent"),
    )
    await db.commit()
    await db.refresh(row)
    return row


@router.delete("/{project_id}/selection-stubs/{sid}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_selection_stub(
    project_id: UUID,
    sid: UUID,
    db: Annotated[AsyncSession, Depends(get_db)],
    _: Annotated[User, Depends(require_permissions("selection:write"))],
) -> None:
    row = await db.get(SelectionStub, sid)
    if row is None or row.project_id != project_id:
        raise HTTPException(status_code=404, detail="选型存根不存在")
    await db.delete(row)
    await db.commit()
