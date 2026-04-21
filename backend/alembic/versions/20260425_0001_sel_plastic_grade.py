"""塑料牌号字典表 sel_plastic_grade（材料 1:N）及演示种子

Revision ID: 20260425_0001
Revises: 20260424_0001
Create Date: 2026-04-25

"""

from __future__ import annotations

import uuid
from collections.abc import Sequence
from typing import Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "20260425_0001"
down_revision: Union[str, None] = "20260424_0001"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "sel_plastic_grade",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("material_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("label", sa.String(length=200), nullable=False),
        sa.Column("sort_order", sa.Integer(), server_default="0", nullable=False),
        sa.Column("is_active", sa.Boolean(), server_default="true", nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(["material_id"], ["sel_material.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_sel_plastic_grade_material_id", "sel_plastic_grade", ["material_id"], unique=False)

    conn = op.get_bind()
    rows = conn.execute(
        sa.text("SELECT id, abbreviation FROM sel_material WHERE is_active ORDER BY abbreviation")
    ).fetchall()
    for mid, abbr in rows:
        for sort_i, suffix in enumerate(("通用级", "增强级")):
            conn.execute(
                sa.text(
                    "INSERT INTO sel_plastic_grade (id, material_id, label, sort_order, is_active) "
                    "VALUES (:id, :mid, :label, :so, true)"
                ),
                {"id": uuid.uuid4(), "mid": mid, "label": f"{abbr}-{suffix}", "so": sort_i},
            )


def downgrade() -> None:
    op.drop_index("ix_sel_plastic_grade_material_id", table_name="sel_plastic_grade")
    op.drop_table("sel_plastic_grade")
