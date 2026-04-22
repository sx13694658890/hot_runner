"""分流板大类：分类名优化 + 新增 hrspec_mfld_bridge_material（属性类-分流板材质）

Revision ID: 20260505_0001
Revises: 20260504_0001
Create Date: 2026-05-05
"""

from __future__ import annotations

import uuid
from collections.abc import Sequence
from typing import Union

import sqlalchemy as sa
from alembic import op

revision: str = "20260505_0001"
down_revision: Union[str, None] = "20260504_0001"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    conn = op.get_bind()
    conn.execute(
        sa.text("UPDATE sel_dict_category SET label = :l WHERE code = 'hrspec_mfld_process'"),
        {"l": "属性类-工艺"},
    )
    conn.execute(
        sa.text(
            "UPDATE sel_dict_category SET label = :l WHERE code = 'hrspec_mfld_bridge_channel_diameter'"
        ),
        {"l": "桥板-桥流道直径"},
    )
    row = conn.execute(
        sa.text("SELECT id FROM sel_dict_category WHERE code = :c"),
        {"c": "hrspec_mfld_bridge_material"},
    ).fetchone()
    if row is None:
        conn.execute(
            sa.text(
                "UPDATE sel_dict_category SET sort_order = sort_order + 1 "
                "WHERE code LIKE 'hrspec_mfld_%' AND sort_order >= 8051"
            )
        )
        conn.execute(
            sa.text(
                "INSERT INTO sel_dict_category (id, code, label, sort_order) "
                "VALUES (:id, 'hrspec_mfld_bridge_material', '属性类-分流板材质', 8051)"
            ),
            {"id": uuid.uuid4()},
        )
    else:
        conn.execute(
            sa.text(
                "UPDATE sel_dict_category SET label = :l WHERE code = 'hrspec_mfld_bridge_material'"
            ),
            {"l": "属性类-分流板材质"},
        )


def downgrade() -> None:
    raise NotImplementedError("分流板大类标签与分类调整迁移不支持自动降级")
