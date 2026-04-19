from __future__ import annotations

import uuid
from typing import TYPE_CHECKING

from sqlalchemy import ForeignKey, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, CreatedAtMixin, UUIDPrimaryKeyMixin

if TYPE_CHECKING:
    from app.models.department import Department
    from app.models.user import User


class Position(UUIDPrimaryKeyMixin, CreatedAtMixin, Base):
    __tablename__ = "positions"

    name: Mapped[str] = mapped_column(String(120), nullable=False)
    code: Mapped[str | None] = mapped_column(String(64), unique=True, nullable=True)
    department_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("departments.id", ondelete="SET NULL"), nullable=True
    )
    remark: Mapped[str | None] = mapped_column(Text, nullable=True)

    department: Mapped[Department | None] = relationship("Department", back_populates="positions")
    users: Mapped[list[User]] = relationship("User", back_populates="position")
