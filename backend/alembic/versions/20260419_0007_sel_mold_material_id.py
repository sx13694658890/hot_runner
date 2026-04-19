"""sel_mold_info 关联材料 material_id

Revision ID: 20260419_0007
Revises: 20260419_0006
Create Date: 2026-04-19

"""

from __future__ import annotations

from collections.abc import Sequence
from typing import Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "20260419_0007"
down_revision: Union[str, None] = "20260419_0006"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "sel_mold_info",
        sa.Column(
            "material_id",
            postgresql.UUID(as_uuid=True),
            nullable=True,
        ),
    )
    op.create_foreign_key(
        "fk_sel_mold_info_material_id",
        "sel_mold_info",
        "sel_material",
        ["material_id"],
        ["id"],
        ondelete="SET NULL",
    )


def downgrade() -> None:
    op.drop_constraint("fk_sel_mold_info_material_id", "sel_mold_info", type_="foreignkey")
    op.drop_column("sel_mold_info", "material_id")
