from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.deps import require_permissions
from app.models.project import Project, ProjectMember
from app.models.user import User
from app.schemas.project import ProjectCreate, ProjectMemberCreate, ProjectRead, ProjectUpdate
from app.services.audit_service import log_action

router = APIRouter()


@router.get("", response_model=list[ProjectRead])
async def list_projects(
    db: Annotated[AsyncSession, Depends(get_db)],
    _: Annotated[User, Depends(require_permissions("project:read"))],
) -> list[Project]:
    result = await db.execute(select(Project).order_by(Project.code))
    return list(result.scalars().all())


@router.post("", response_model=ProjectRead, status_code=status.HTTP_201_CREATED)
async def create_project(
    request: Request,
    body: ProjectCreate,
    db: Annotated[AsyncSession, Depends(get_db)],
    user: Annotated[User, Depends(require_permissions("project:write"))],
) -> Project:
    exists = await db.execute(select(Project.id).where(Project.code == body.code))
    if exists.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="项目编码已存在")
    p = Project(**body.model_dump())
    db.add(p)
    await db.flush()
    await log_action(
        db,
        user_id=user.id,
        action="project.create",
        resource_type="project",
        resource_id=str(p.id),
        ip=request.client.host if request.client else None,
        user_agent=request.headers.get("user-agent"),
    )
    await db.commit()
    await db.refresh(p)
    return p


@router.get("/{project_id}", response_model=ProjectRead)
async def get_project(
    project_id: UUID,
    db: Annotated[AsyncSession, Depends(get_db)],
    _: Annotated[User, Depends(require_permissions("project:read"))],
) -> Project:
    p = await db.get(Project, project_id)
    if p is None:
        raise HTTPException(status_code=404, detail="项目不存在")
    return p


@router.patch("/{project_id}", response_model=ProjectRead)
async def update_project(
    request: Request,
    project_id: UUID,
    body: ProjectUpdate,
    db: Annotated[AsyncSession, Depends(get_db)],
    user: Annotated[User, Depends(require_permissions("project:write"))],
) -> Project:
    p = await db.get(Project, project_id)
    if p is None:
        raise HTTPException(status_code=404, detail="项目不存在")
    for k, v in body.model_dump(exclude_unset=True).items():
        setattr(p, k, v)
    await log_action(
        db,
        user_id=user.id,
        action="project.update",
        resource_type="project",
        resource_id=str(project_id),
        ip=request.client.host if request.client else None,
        user_agent=request.headers.get("user-agent"),
    )
    await db.commit()
    await db.refresh(p)
    return p


@router.post("/{project_id}/members", status_code=status.HTTP_204_NO_CONTENT)
async def add_project_member(
    request: Request,
    project_id: UUID,
    body: ProjectMemberCreate,
    db: Annotated[AsyncSession, Depends(get_db)],
    user: Annotated[User, Depends(require_permissions("project:member:manage"))],
) -> None:
    proj = await db.get(Project, project_id)
    if proj is None:
        raise HTTPException(status_code=404, detail="项目不存在")
    u = await db.get(User, body.user_id)
    if u is None:
        raise HTTPException(status_code=400, detail="用户不存在")
    dup = await db.execute(
        select(ProjectMember).where(
            ProjectMember.project_id == project_id,
            ProjectMember.user_id == body.user_id,
        )
    )
    if dup.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="该用户已在项目中")
    db.add(
        ProjectMember(
            project_id=project_id,
            user_id=body.user_id,
            role_in_project=body.role_in_project,
        )
    )
    await log_action(
        db,
        user_id=user.id,
        action="project.member_add",
        resource_type="project",
        resource_id=str(project_id),
        ip=request.client.host if request.client else None,
        user_agent=request.headers.get("user-agent"),
        detail={"member_user_id": str(body.user_id), "role": body.role_in_project},
    )
    await db.commit()
