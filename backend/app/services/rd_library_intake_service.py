"""成果入库审批：通过后生成标准件草案（status=draft）。"""

from __future__ import annotations

from datetime import UTC, datetime
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.catalog import StandardPart
from app.models.rd_research import RdLibraryIntake


async def approve_library_intake(
    db: AsyncSession,
    intake_id: UUID,
    reviewer_user_id: UUID,
    comment: str | None,
) -> RdLibraryIntake:
    intake = await db.get(RdLibraryIntake, intake_id)
    if intake is None:
        raise ValueError("not_found")
    if intake.status != "submitted":
        raise ValueError("invalid_status")
    dup = await db.execute(select(StandardPart.id).where(StandardPart.code == intake.proposed_code))
    if dup.scalar_one_or_none():
        raise ValueError("code_exists")

    part = StandardPart(
        code=intake.proposed_code,
        name=intake.proposed_name,
        category=intake.category,
        status="draft",
        remark=intake.description,
    )
    db.add(part)
    await db.flush()

    now = datetime.now(UTC)
    intake.result_standard_part_id = part.id
    intake.status = "approved"
    intake.reviewed_by_user_id = reviewer_user_id
    intake.reviewed_at = now
    intake.review_comment = comment
    await db.commit()
    await db.refresh(intake)
    return intake


async def reject_library_intake(
    db: AsyncSession,
    intake_id: UUID,
    reviewer_user_id: UUID,
    comment: str | None,
) -> RdLibraryIntake:
    intake = await db.get(RdLibraryIntake, intake_id)
    if intake is None:
        raise ValueError("not_found")
    if intake.status != "submitted":
        raise ValueError("invalid_status")
    now = datetime.now(UTC)
    intake.status = "rejected"
    intake.reviewed_by_user_id = reviewer_user_id
    intake.reviewed_at = now
    intake.review_comment = comment
    await db.commit()
    await db.refresh(intake)
    return intake
