from typing import Annotated

from fastapi import APIRouter, Depends, Request, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.deps import require_permissions
from app.models.position import Position
from app.models.user import User
from app.schemas.position import PositionCreate, PositionRead
from app.services.audit_service import log_action

router = APIRouter()


@router.get("", response_model=list[PositionRead])
async def list_positions(
    db: Annotated[AsyncSession, Depends(get_db)],
    _: Annotated[User, Depends(require_permissions("position:read"))],
) -> list[Position]:
    result = await db.execute(select(Position).order_by(Position.name))
    return list(result.scalars().all())


@router.post("", response_model=PositionRead, status_code=status.HTTP_201_CREATED)
async def create_position(
    request: Request,
    body: PositionCreate,
    db: Annotated[AsyncSession, Depends(get_db)],
    user: Annotated[User, Depends(require_permissions("position:write"))],
) -> Position:
    pos = Position(**body.model_dump())
    db.add(pos)
    await db.flush()
    await log_action(
        db,
        user_id=user.id,
        action="position.create",
        resource_type="position",
        resource_id=str(pos.id),
        ip=request.client.host if request.client else None,
        user_agent=request.headers.get("user-agent"),
    )
    await db.commit()
    await db.refresh(pos)
    return pos
