from collections.abc import Callable
from typing import Annotated
from uuid import UUID

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.database import get_db
from app.models.role import Role, RolePermission, UserRole
from app.models.user import User
from app.security import decode_token

security_scheme = HTTPBearer(auto_error=False)


async def get_current_user_optional(
    db: Annotated[AsyncSession, Depends(get_db)],
    cred: Annotated[HTTPAuthorizationCredentials | None, Depends(security_scheme)],
) -> User | None:
    if cred is None or cred.scheme.lower() != "bearer":
        return None
    payload = decode_token(cred.credentials)
    if payload is None:
        return None
    try:
        uid = UUID(payload.sub)
    except ValueError:
        return None
    result = await db.execute(
        select(User)
        .where(User.id == uid, User.is_active.is_(True))
        .options(
            selectinload(User.role_links)
            .selectinload(UserRole.role)
            .selectinload(Role.permission_links)
            .selectinload(RolePermission.permission)
        )
    )
    return result.scalar_one_or_none()


async def get_current_user(
    user: Annotated[User | None, Depends(get_current_user_optional)],
) -> User:
    if user is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="未登录或令牌无效")
    return user


def collect_permission_codes(user: User) -> set[str]:
    if user.is_superuser:
        return {"*"}
    codes: set[str] = set()
    for link in user.role_links:
        for rp in link.role.permission_links:
            codes.add(rp.permission.code)
    return codes


def require_permissions(*codes: str) -> Callable[..., User]:
    async def checker(user: Annotated[User, Depends(get_current_user)]) -> User:
        owned = collect_permission_codes(user)
        if "*" in owned:
            return user
        missing = [c for c in codes if c not in owned]
        if missing:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail={"message": "权限不足", "missing": missing},
            )
        return user

    return checker


def require_superuser() -> Callable[..., User]:
    async def checker(user: Annotated[User, Depends(get_current_user)]) -> User:
        if not user.is_superuser:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="需要超级管理员")
        return user

    return checker


async def require_superuser_or_role_assign(
    user: Annotated[User, Depends(get_current_user)],
) -> User:
    if user.is_superuser or "role:assign" in collect_permission_codes(user):
        return user
    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail="需要超级管理员或 role:assign 权限",
    )
