"""P1：项目 WBS、里程碑、风险、设计任务、设计变更、选型存根。"""

from __future__ import annotations

import uuid
from datetime import date
from typing import TYPE_CHECKING, Any

import sqlalchemy as sa
from sqlalchemy import Date, ForeignKey, Integer, String, Text
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, CreatedAtMixin, UUIDPrimaryKeyMixin

if TYPE_CHECKING:
    from app.models.project import Project


class ProjectTask(UUIDPrimaryKeyMixin, CreatedAtMixin, Base):
    __tablename__ = "project_tasks"

    project_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("projects.id", ondelete="CASCADE"), index=True
    )
    parent_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("project_tasks.id", ondelete="SET NULL"), nullable=True
    )
    title: Mapped[str] = mapped_column(String(500), nullable=False)
    sort_order: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    assignee_user_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
    due_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    status: Mapped[str] = mapped_column(String(32), default="todo", nullable=False)
    remark: Mapped[str | None] = mapped_column(Text, nullable=True)

    project: Mapped[Project] = relationship("Project", back_populates="tasks")


class ProjectMilestone(UUIDPrimaryKeyMixin, CreatedAtMixin, Base):
    __tablename__ = "project_milestones"

    project_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("projects.id", ondelete="CASCADE"), index=True
    )
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    target_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    status: Mapped[str] = mapped_column(String(32), default="planned", nullable=False)
    sort_order: Mapped[int] = mapped_column(Integer, default=0, nullable=False)

    project: Mapped[Project] = relationship("Project", back_populates="milestones")


class ProjectRisk(UUIDPrimaryKeyMixin, CreatedAtMixin, Base):
    __tablename__ = "project_risks"

    project_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("projects.id", ondelete="CASCADE"), index=True
    )
    title: Mapped[str] = mapped_column(String(300), nullable=False)
    risk_level: Mapped[str] = mapped_column(String(16), default="medium", nullable=False)
    status: Mapped[str] = mapped_column(String(32), default="open", nullable=False)
    owner_user_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
    remark: Mapped[str | None] = mapped_column(Text, nullable=True)

    project: Mapped[Project] = relationship("Project", back_populates="risks")


class DesignTask(UUIDPrimaryKeyMixin, CreatedAtMixin, Base):
    __tablename__ = "design_tasks"

    project_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("projects.id", ondelete="CASCADE"), index=True
    )
    title: Mapped[str] = mapped_column(String(300), nullable=False)
    status: Mapped[str] = mapped_column(String(32), default="pending", nullable=False)
    assignee_user_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
    sort_order: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    remark: Mapped[str | None] = mapped_column(Text, nullable=True)

    project: Mapped[Project] = relationship("Project", back_populates="design_tasks")


class DesignChangeRequest(UUIDPrimaryKeyMixin, CreatedAtMixin, Base):
    __tablename__ = "design_change_requests"

    project_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("projects.id", ondelete="CASCADE"), index=True
    )
    title: Mapped[str] = mapped_column(String(300), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    status: Mapped[str] = mapped_column(String(32), default="draft", nullable=False)
    created_by_user_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )

    project: Mapped[Project] = relationship("Project", back_populates="design_changes")


class SelectionStub(UUIDPrimaryKeyMixin, CreatedAtMixin, Base):
    __tablename__ = "selection_stubs"

    project_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("projects.id", ondelete="CASCADE"), index=True
    )
    title: Mapped[str] = mapped_column(String(300), nullable=False)
    payload: Mapped[dict[str, Any]] = mapped_column(
        JSONB, nullable=False, server_default=sa.text("'{}'::jsonb")
    )
    remark: Mapped[str | None] = mapped_column(Text, nullable=True)

    project: Mapped[Project] = relationship("Project", back_populates="selection_stubs")
