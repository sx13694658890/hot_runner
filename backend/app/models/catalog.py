"""P2：标准件主数据与图纸版本（挂标准件）。"""

from __future__ import annotations

import uuid
from typing import TYPE_CHECKING

from sqlalchemy import ForeignKey, String, Text, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, CreatedAtMixin, UUIDPrimaryKeyMixin

if TYPE_CHECKING:
    from app.models.file_asset import FileAsset


class StandardPart(UUIDPrimaryKeyMixin, CreatedAtMixin, Base):
    __tablename__ = "standard_parts"

    code: Mapped[str] = mapped_column(String(64), unique=True, nullable=False, index=True)
    name: Mapped[str] = mapped_column(String(300), nullable=False)
    category: Mapped[str | None] = mapped_column(String(120), nullable=True)
    status: Mapped[str] = mapped_column(String(32), default="draft", nullable=False, index=True)
    remark: Mapped[str | None] = mapped_column(Text, nullable=True)

    drawing_versions: Mapped[list[DrawingVersion]] = relationship(
        "DrawingVersion", back_populates="standard_part", cascade="all, delete-orphan"
    )


class DrawingVersion(UUIDPrimaryKeyMixin, CreatedAtMixin, Base):
    __tablename__ = "drawing_versions"
    __table_args__ = (
        UniqueConstraint("standard_part_id", "version_label", name="uq_drawing_version_part_label"),
    )

    standard_part_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("standard_parts.id", ondelete="CASCADE"), index=True
    )
    version_label: Mapped[str] = mapped_column(String(64), nullable=False)
    status: Mapped[str] = mapped_column(String(32), default="draft", nullable=False)
    file_asset_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("file_assets.id", ondelete="SET NULL"), nullable=True
    )
    remark: Mapped[str | None] = mapped_column(Text, nullable=True)

    standard_part: Mapped[StandardPart] = relationship(
        "StandardPart", back_populates="drawing_versions"
    )
    file_asset: Mapped[FileAsset | None] = relationship("FileAsset")
