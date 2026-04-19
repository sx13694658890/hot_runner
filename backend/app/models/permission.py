from sqlalchemy import String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base, CreatedAtMixin, UUIDPrimaryKeyMixin


class Permission(UUIDPrimaryKeyMixin, CreatedAtMixin, Base):
    __tablename__ = "permissions"

    code: Mapped[str] = mapped_column(String(128), unique=True, nullable=False, index=True)
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    module: Mapped[str] = mapped_column(String(64), nullable=False, index=True)
    remark: Mapped[str | None] = mapped_column(Text, nullable=True)
