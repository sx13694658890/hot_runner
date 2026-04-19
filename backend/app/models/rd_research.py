"""P3：研发项目、研发任务、版本迭代、成果附件、成果入库申请（M3）。"""

from __future__ import annotations

import uuid
from datetime import date, datetime
from typing import Any

from sqlalchemy import Date, DateTime, ForeignKey, Integer, String, Text, UniqueConstraint, func
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, CreatedAtMixin, UUIDPrimaryKeyMixin
from app.models.catalog import StandardPart
from app.models.file_asset import FileAsset
from app.models.project import Project
from app.models.user import User


class RdResearchProject(UUIDPrimaryKeyMixin, CreatedAtMixin, Base):
    """研发项目；可选关联 PMO 主线项目。"""

    __tablename__ = "rd_research_projects"

    name: Mapped[str] = mapped_column(String(200), nullable=False)
    code: Mapped[str | None] = mapped_column(String(64), unique=True, nullable=True, index=True)
    parent_project_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("projects.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    status: Mapped[str] = mapped_column(String(32), default="active", nullable=False, index=True)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    owner_user_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )

    parent_project: Mapped[Project | None] = relationship("Project")
    owner: Mapped[User | None] = relationship("User", foreign_keys=[owner_user_id])
    tasks: Mapped[list[RdResearchTask]] = relationship(
        back_populates="research_project", cascade="all, delete-orphan"
    )
    release_iterations: Mapped[list[RdReleaseIteration]] = relationship(
        back_populates="research_project", cascade="all, delete-orphan"
    )
    deliverables: Mapped[list[RdDeliverable]] = relationship(
        back_populates="research_project", cascade="all, delete-orphan"
    )


class RdResearchTask(UUIDPrimaryKeyMixin, CreatedAtMixin, Base):
    __tablename__ = "rd_research_tasks"

    research_project_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("rd_research_projects.id", ondelete="CASCADE"), index=True
    )
    title: Mapped[str] = mapped_column(String(500), nullable=False)
    status: Mapped[str] = mapped_column(String(32), default="todo", nullable=False)
    assignee_user_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
    due_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    sort_order: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    remark: Mapped[str | None] = mapped_column(Text, nullable=True)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )

    research_project: Mapped[RdResearchProject] = relationship(back_populates="tasks")


class RdReleaseIteration(UUIDPrimaryKeyMixin, CreatedAtMixin, Base):
    """版本迭代说明 + 简易审批状态（对接后续工作流引擎时可迁移）。"""

    __tablename__ = "rd_release_iterations"
    __table_args__ = (
        UniqueConstraint(
            "research_project_id",
            "version_label",
            name="uq_rd_release_iterations_project_version",
        ),
    )

    research_project_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("rd_research_projects.id", ondelete="CASCADE"), index=True
    )
    version_label: Mapped[str] = mapped_column(String(64), nullable=False)
    release_notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    status: Mapped[str] = mapped_column(String(32), default="draft", nullable=False)
    submitted_by_user_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
    submitted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    reviewed_by_user_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
    reviewed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    review_comment: Mapped[str | None] = mapped_column(Text, nullable=True)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )

    research_project: Mapped[RdResearchProject] = relationship(back_populates="release_iterations")


class RdDeliverable(UUIDPrimaryKeyMixin, CreatedAtMixin, Base):
    """仿真 / 图纸 / 报告等成果附件索引。"""

    __tablename__ = "rd_deliverables"

    research_project_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("rd_research_projects.id", ondelete="CASCADE"), index=True
    )
    title: Mapped[str] = mapped_column(String(300), nullable=False)
    category: Mapped[str] = mapped_column(String(32), default="other", nullable=False, index=True)
    tags: Mapped[list[Any]] = mapped_column(JSONB, nullable=False, server_default="[]")
    file_asset_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("file_assets.id", ondelete="SET NULL"), nullable=True
    )
    remark: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_by_user_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )

    research_project: Mapped[RdResearchProject] = relationship(back_populates="deliverables")
    file_asset: Mapped[FileAsset | None] = relationship("FileAsset")


class RdLibraryIntake(UUIDPrimaryKeyMixin, CreatedAtMixin, Base):
    """成果入库申请：审批通过后生成标准件草案（对接标准库）。"""

    __tablename__ = "rd_library_intakes"

    research_project_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("rd_research_projects.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    title: Mapped[str] = mapped_column(String(300), nullable=False)
    proposed_code: Mapped[str] = mapped_column(String(64), nullable=False)
    proposed_name: Mapped[str] = mapped_column(String(300), nullable=False)
    category: Mapped[str | None] = mapped_column(String(120), nullable=True)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    file_asset_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("file_assets.id", ondelete="SET NULL"), nullable=True
    )
    status: Mapped[str] = mapped_column(String(32), default="draft", nullable=False, index=True)
    result_standard_part_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("standard_parts.id", ondelete="SET NULL"), nullable=True
    )
    created_by_user_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
    submitted_by_user_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
    submitted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    reviewed_by_user_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
    reviewed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    review_comment: Mapped[str | None] = mapped_column(Text, nullable=True)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )

    research_project: Mapped[RdResearchProject | None] = relationship()
    result_standard_part: Mapped[StandardPart | None] = relationship("StandardPart")
