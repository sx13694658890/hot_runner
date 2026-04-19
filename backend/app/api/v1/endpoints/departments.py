from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.deps import require_permissions
from app.models.department import Department
from app.models.user import User
from app.schemas.department import DepartmentCreate, DepartmentRead, DepartmentUpdate
from app.services.audit_service import log_action

router = APIRouter()


@router.get("", response_model=list[DepartmentRead])
async def list_departments(
    db: Annotated[AsyncSession, Depends(get_db)],
    _: Annotated[User, Depends(require_permissions("department:read"))],
) -> list[Department]:
    result = await db.execute(select(Department).order_by(Department.sort_order, Department.name))
    return list(result.scalars().all())


@router.post("", response_model=DepartmentRead, status_code=status.HTTP_201_CREATED)
async def create_department(
    request: Request,
    body: DepartmentCreate,
    db: Annotated[AsyncSession, Depends(get_db)],
    user: Annotated[User, Depends(require_permissions("department:write"))],
) -> Department:
    if body.parent_id:
        parent = await db.get(Department, body.parent_id)
        if parent is None:
            raise HTTPException(status_code=400, detail="parent_id 不存在")
    dept = Department(**body.model_dump())
    db.add(dept)
    await db.flush()
    await log_action(
        db,
        user_id=user.id,
        action="department.create",
        resource_type="department",
        resource_id=str(dept.id),
        ip=request.client.host if request.client else None,
        user_agent=request.headers.get("user-agent"),
        detail={"name": dept.name},
    )
    await db.commit()
    await db.refresh(dept)
    return dept


@router.patch("/{dept_id}", response_model=DepartmentRead)
async def update_department(
    request: Request,
    dept_id: UUID,
    body: DepartmentUpdate,
    db: Annotated[AsyncSession, Depends(get_db)],
    user: Annotated[User, Depends(require_permissions("department:write"))],
) -> Department:
    dept = await db.get(Department, dept_id)
    if dept is None:
        raise HTTPException(status_code=404, detail="部门不存在")
    data = body.model_dump(exclude_unset=True)
    if "parent_id" in data and data["parent_id"] == dept_id:
        raise HTTPException(status_code=400, detail="不能将自身设为上级")
    for k, v in data.items():
        setattr(dept, k, v)
    await log_action(
        db,
        user_id=user.id,
        action="department.update",
        resource_type="department",
        resource_id=str(dept_id),
        ip=request.client.host if request.client else None,
        user_agent=request.headers.get("user-agent"),
    )
    await db.commit()
    await db.refresh(dept)
    return dept


@router.delete("/{dept_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_department(
    request: Request,
    dept_id: UUID,
    db: Annotated[AsyncSession, Depends(get_db)],
    user: Annotated[User, Depends(require_permissions("department:write"))],
) -> None:
    dept = await db.get(Department, dept_id)
    if dept is None:
        raise HTTPException(status_code=404, detail="部门不存在")
    await db.delete(dept)
    await log_action(
        db,
        user_id=user.id,
        action="department.delete",
        resource_type="department",
        resource_id=str(dept_id),
        ip=request.client.host if request.client else None,
        user_agent=request.headers.get("user-agent"),
    )
    await db.commit()
