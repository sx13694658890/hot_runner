from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.deps import require_permissions
from app.models.audit_log import AuditLog
from app.models.user import User
from app.schemas.audit import AuditLogQuery, AuditLogRead

router = APIRouter()


@router.get("", response_model=list[AuditLogRead])
async def list_audit_logs(
    q: Annotated[AuditLogQuery, Depends()],
    db: Annotated[AsyncSession, Depends(get_db)],
    _: Annotated[User, Depends(require_permissions("audit:read"))],
) -> list[AuditLog]:
    stmt = select(AuditLog).order_by(AuditLog.created_at.desc()).offset(q.skip).limit(q.limit)
    if q.action:
        stmt = stmt.where(AuditLog.action == q.action)
    result = await db.execute(stmt)
    return list(result.scalars().all())
