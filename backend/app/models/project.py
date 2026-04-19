from __future__ import annotations

import uuid
from typing import TYPE_CHECKING

from sqlalchemy import ForeignKey, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, CreatedAtMixin, UUIDPrimaryKeyMixin

if TYPE_CHECKING:
    from app.models.user import User
    from app.models.work_plan import (
        DesignChangeRequest,
        DesignTask,
        ProjectMilestone,
        ProjectRisk,
        ProjectTask,
        SelectionStub,
    )


class Project(UUIDPrimaryKeyMixin, CreatedAtMixin, Base):
    __tablename__ = "projects"

    name: Mapped[str] = mapped_column(String(200), nullable=False)
    code: Mapped[str] = mapped_column(String(64), unique=True, nullable=False, index=True)
    status: Mapped[str] = mapped_column(String(32), default="active", nullable=False)
    remark: Mapped[str | None] = mapped_column(Text, nullable=True)

    members: Mapped[list[ProjectMember]] = relationship(
        "ProjectMember", back_populates="project", cascade="all, delete-orphan"
    )
    tasks: Mapped[list[ProjectTask]] = relationship(
        "ProjectTask", back_populates="project", cascade="all, delete-orphan"
    )
    milestones: Mapped[list[ProjectMilestone]] = relationship(
        "ProjectMilestone", back_populates="project", cascade="all, delete-orphan"
    )
    risks: Mapped[list[ProjectRisk]] = relationship(
        "ProjectRisk", back_populates="project", cascade="all, delete-orphan"
    )
    design_tasks: Mapped[list[DesignTask]] = relationship(
        "DesignTask", back_populates="project", cascade="all, delete-orphan"
    )
    design_changes: Mapped[list[DesignChangeRequest]] = relationship(
        "DesignChangeRequest", back_populates="project", cascade="all, delete-orphan"
    )
    selection_stubs: Mapped[list[SelectionStub]] = relationship(
        "SelectionStub", back_populates="project", cascade="all, delete-orphan"
    )


class ProjectMember(Base):
    """M0：项目成员数据范围预留。"""

    __tablename__ = "project_members"

    project_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("projects.id", ondelete="CASCADE"), primary_key=True
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), primary_key=True
    )
    role_in_project: Mapped[str] = mapped_column(
        String(32), default="member", nullable=False
    )  # owner | member

    project: Mapped[Project] = relationship("Project", back_populates="members")
    user: Mapped[User] = relationship("User")
