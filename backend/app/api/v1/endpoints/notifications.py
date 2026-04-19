from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.deps import get_current_user, require_permissions
from app.models.notification import Notification
from app.models.user import User
from app.schemas.notification import NotificationCreate, NotificationRead
from app.services.audit_service import log_action

router = APIRouter()


@router.get("/mine", response_model=list[NotificationRead])
async def list_my_notifications(
    db: Annotated[AsyncSession, Depends(get_db)],
    user: Annotated[User, Depends(get_current_user)],
) -> list[Notification]:
    result = await db.execute(
        select(Notification)
        .where(Notification.user_id == user.id)
        .order_by(Notification.created_at.desc())
        .limit(100)
    )
    return list(result.scalars().all())


@router.post("", response_model=NotificationRead, status_code=status.HTTP_201_CREATED)
async def create_notification(
    request: Request,
    body: NotificationCreate,
    db: Annotated[AsyncSession, Depends(get_db)],
    actor: Annotated[User, Depends(require_permissions("notification:write"))],
) -> Notification:
    target = await db.get(User, body.user_id)
    if target is None:
        raise HTTPException(status_code=400, detail="目标用户不存在")
    n = Notification(
        user_id=body.user_id,
        title=body.title,
        body=body.body,
        channel=body.channel,
    )
    db.add(n)
    await db.flush()
    await log_action(
        db,
        user_id=actor.id,
        action="notification.create",
        resource_type="notification",
        resource_id=str(n.id),
        ip=request.client.host if request.client else None,
        user_agent=request.headers.get("user-agent"),
        detail={"to_user": str(body.user_id)},
    )
    await db.commit()
    await db.refresh(n)
    return n


@router.post("/{notif_id}/read", response_model=NotificationRead)
async def mark_read(
    request: Request,
    notif_id: UUID,
    db: Annotated[AsyncSession, Depends(get_db)],
    user: Annotated[User, Depends(get_current_user)],
) -> Notification:
    n = await db.get(Notification, notif_id)
    if n is None or n.user_id != user.id:
        raise HTTPException(status_code=404, detail="通知不存在")
    n.read = True
    await log_action(
        db,
        user_id=user.id,
        action="notification.read",
        resource_type="notification",
        resource_id=str(notif_id),
        ip=request.client.host if request.client else None,
        user_agent=request.headers.get("user-agent"),
    )
    await db.commit()
    await db.refresh(n)
    return n
