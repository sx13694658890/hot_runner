from __future__ import annotations

import uuid
from typing import TYPE_CHECKING

from sqlalchemy import ForeignKey, Integer, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, CreatedAtMixin, UUIDPrimaryKeyMixin

if TYPE_CHECKING:
    from app.models.position import Position
    from app.models.user import User


class Department(UUIDPrimaryKeyMixin, CreatedAtMixin, Base):
    __tablename__ = "departments"

    name: Mapped[str] = mapped_column(String(200), nullable=False)
    code: Mapped[str | None] = mapped_column(String(64), unique=True, nullable=True)
    parent_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("departments.id", ondelete="SET NULL"), nullable=True
    )
    sort_order: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    remark: Mapped[str | None] = mapped_column(Text, nullable=True)

    parent: Mapped[Department | None] = relationship(
        "Department",
        remote_side="Department.id",
        foreign_keys=[parent_id],
        back_populates="children",
    )
    children: Mapped[list[Department]] = relationship(
        "Department",
        back_populates="parent",
        foreign_keys="Department.parent_id",
    )
    users: Mapped[list[User]] = relationship("User", back_populates="department")
    positions: Mapped[list[Position]] = relationship("Position", back_populates="department")
