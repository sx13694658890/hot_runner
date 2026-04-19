from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.deps import require_permissions
from app.models.permission import Permission
from app.models.role import Role
from app.models.user import User
from app.schemas.role import PermissionRead, RoleRead

router = APIRouter()


@router.get("", response_model=list[RoleRead])
async def list_roles(
    db: Annotated[AsyncSession, Depends(get_db)],
    _: Annotated[User, Depends(require_permissions("role:read"))],
) -> list[Role]:
    result = await db.execute(select(Role).order_by(Role.code))
    return list(result.scalars().all())


@router.get("/permissions", response_model=list[PermissionRead])
async def list_permissions(
    db: Annotated[AsyncSession, Depends(get_db)],
    _: Annotated[User, Depends(require_permissions("role:read"))],
) -> list[Permission]:
    result = await db.execute(select(Permission).order_by(Permission.module, Permission.code))
    return list(result.scalars().all())
