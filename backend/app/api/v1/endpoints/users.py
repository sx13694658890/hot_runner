from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.deps import require_permissions, require_superuser_or_role_assign
from app.models.role import UserRole
from app.models.user import User
from app.schemas.user_mgmt import AssignRolesBody, UserCreate, UserRead, UserUpdate
from app.security import hash_password
from app.services.audit_service import log_action

router = APIRouter()


@router.get("", response_model=list[UserRead])
async def list_users(
    db: Annotated[AsyncSession, Depends(get_db)],
    _: Annotated[User, Depends(require_permissions("user:read"))],
) -> list[User]:
    result = await db.execute(select(User).order_by(User.username))
    return list(result.scalars().all())


@router.post("", response_model=UserRead, status_code=status.HTTP_201_CREATED)
async def create_user(
    request: Request,
    body: UserCreate,
    db: Annotated[AsyncSession, Depends(get_db)],
    actor: Annotated[User, Depends(require_permissions("user:write"))],
) -> User:
    exists = await db.execute(select(User.id).where(User.username == body.username))
    if exists.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="用户名已存在")
    exists_e = await db.execute(select(User.id).where(User.email == body.email))
    if exists_e.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="邮箱已存在")

    user = User(
        username=body.username,
        email=body.email,
        hashed_password=hash_password(body.password),
        full_name=body.full_name,
        department_id=body.department_id,
        position_id=body.position_id,
        is_active=body.is_active,
        is_superuser=False,
    )
    db.add(user)
    await db.flush()
    for rid in body.role_ids:
        db.add(UserRole(user_id=user.id, role_id=rid))
    await log_action(
        db,
        user_id=actor.id,
        action="user.create",
        resource_type="user",
        resource_id=str(user.id),
        ip=request.client.host if request.client else None,
        user_agent=request.headers.get("user-agent"),
        detail={"username": user.username},
    )
    await db.commit()
    await db.refresh(user)
    return user


@router.patch("/{user_id}", response_model=UserRead)
async def update_user(
    request: Request,
    user_id: UUID,
    body: UserUpdate,
    db: Annotated[AsyncSession, Depends(get_db)],
    actor: Annotated[User, Depends(require_permissions("user:write"))],
) -> User:
    user = await db.get(User, user_id)
    if user is None:
        raise HTTPException(status_code=404, detail="用户不存在")
    data = body.model_dump(exclude_unset=True)
    if "password" in data:
        user.hashed_password = hash_password(data.pop("password"))
    for k, v in data.items():
        setattr(user, k, v)
    await log_action(
        db,
        user_id=actor.id,
        action="user.update",
        resource_type="user",
        resource_id=str(user_id),
        ip=request.client.host if request.client else None,
        user_agent=request.headers.get("user-agent"),
    )
    await db.commit()
    await db.refresh(user)
    return user


@router.post("/{user_id}/roles", response_model=UserRead)
async def assign_roles(
    request: Request,
    user_id: UUID,
    body: AssignRolesBody,
    db: Annotated[AsyncSession, Depends(get_db)],
    actor: Annotated[User, Depends(require_superuser_or_role_assign)],
) -> User:
    user = await db.get(User, user_id)
    if user is None:
        raise HTTPException(status_code=404, detail="用户不存在")
    await db.execute(delete(UserRole).where(UserRole.user_id == user_id))
    for rid in body.role_ids:
        db.add(UserRole(user_id=user_id, role_id=rid))
    await log_action(
        db,
        user_id=actor.id,
        action="user.roles_assign",
        resource_type="user",
        resource_id=str(user_id),
        ip=request.client.host if request.client else None,
        user_agent=request.headers.get("user-agent"),
        detail={"role_ids": [str(x) for x in body.role_ids]},
    )
    await db.commit()
    result = await db.execute(select(User).where(User.id == user_id))
    return result.scalar_one()


@router.get("/{user_id}", response_model=UserRead)
async def get_user(
    user_id: UUID,
    db: Annotated[AsyncSession, Depends(get_db)],
    _: Annotated[User, Depends(require_permissions("user:read"))],
) -> User:
    user = await db.get(User, user_id)
    if user is None:
        raise HTTPException(status_code=404, detail="用户不存在")
    return user
