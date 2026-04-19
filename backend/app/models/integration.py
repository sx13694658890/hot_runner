"""P5：外部集成作业记录（ERP/BOM/MES 桩）与驾驶舱 KPI 数据源。"""

from __future__ import annotations

import uuid
from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, String, Text
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base, CreatedAtMixin, UUIDPrimaryKeyMixin


class IntegrationSyncJob(UUIDPrimaryKeyMixin, CreatedAtMixin, Base):
    """集成同步作业：记录每次拉取/推送尝试（真实 ERP 未接通时仍为桩结果）。"""

    __tablename__ = "integration_sync_jobs"

    job_type: Mapped[str] = mapped_column(String(64), nullable=False, index=True)
    direction: Mapped[str | None] = mapped_column(String(16), nullable=True)
    status: Mapped[str] = mapped_column(String(32), nullable=False, index=True)
    detail: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    message: Mapped[str | None] = mapped_column(Text, nullable=True)
    started_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    finished_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    triggered_by_user_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
