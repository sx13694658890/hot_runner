from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.database import get_db
from app.deps import get_current_user, get_current_user_optional
from app.models.role import Role, RolePermission, UserRole
from app.models.user import User
from app.schemas.auth import LoginRequest, TokenResponse, UserBrief
from app.security import create_access_token, verify_password
from app.services.audit_service import log_action

router = APIRouter()


@router.post("/login", response_model=TokenResponse)
async def login(
    request: Request,
    body: LoginRequest,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> TokenResponse:
    result = await db.execute(select(User).where(User.username == body.username))
    user = result.scalar_one_or_none()
    client_host = request.client.host if request.client else None
    ua = request.headers.get("user-agent")

    if user is None or not verify_password(body.password, user.hashed_password):
        await log_action(
            db,
            user_id=None,
            action="auth.login_failed",
            resource_type="user",
            resource_id=body.username,
            ip=client_host,
            user_agent=ua,
            detail={"username": body.username},
        )
        await db.commit()
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="用户名或密码错误")

    if not user.is_active:
        await log_action(
            db,
            user_id=user.id,
            action="auth.login_denied_inactive",
            ip=client_host,
            user_agent=ua,
        )
        await db.commit()
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="账号已停用")

    await log_action(
        db,
        user_id=user.id,
        action="auth.login_success",
        ip=client_host,
        user_agent=ua,
    )
    await db.commit()

    token = create_access_token(str(user.id))
    return TokenResponse(access_token=token)


@router.get("/me", response_model=UserBrief)
async def me(user: Annotated[User, Depends(get_current_user)]) -> User:
    return user


@router.get("/me/permissions")
async def my_permissions(
    user: Annotated[User | None, Depends(get_current_user_optional)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> dict[str, list[str]]:
    if user is None:
        return {"codes": []}
    result = await db.execute(
        select(User)
        .where(User.id == user.id)
        .options(
            selectinload(User.role_links)
            .selectinload(UserRole.role)
            .selectinload(Role.permission_links)
            .selectinload(RolePermission.permission)
        )
    )
    u = result.scalar_one()
    if u.is_superuser:
        return {"codes": ["*"]}
    codes: set[str] = set()
    for link in u.role_links:
        for rp in link.role.permission_links:
            codes.add(rp.permission.code)
    return {"codes": sorted(codes)}
