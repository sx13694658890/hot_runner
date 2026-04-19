from typing import Any
from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from app.models.audit_log import AuditLog


async def log_action(
    db: AsyncSession,
    *,
    user_id: UUID | None,
    action: str,
    resource_type: str | None = None,
    resource_id: str | None = None,
    ip: str | None = None,
    user_agent: str | None = None,
    detail: dict[str, Any] | None = None,
) -> None:
    db.add(
        AuditLog(
            user_id=user_id,
            action=action,
            resource_type=resource_type,
            resource_id=resource_id,
            ip=ip,
            user_agent=user_agent,
            detail=detail,
        )
    )
