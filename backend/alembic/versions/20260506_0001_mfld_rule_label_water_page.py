"""分流板大类：新增线架-规格标牌、线架-水路版分类（暂无字典项）

Revision ID: 20260506_0001
Revises: 20260505_0001
Create Date: 2026-05-06
"""

from __future__ import annotations

import uuid
from collections.abc import Sequence
from typing import Union

import sqlalchemy as sa
from alembic import op

revision: str = "20260506_0001"
down_revision: Union[str, None] = "20260505_0001"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    conn = op.get_bind()
    for code, label, so in (
        ("hrspec_mfld_rule_label", "线架-规格标牌", 8071),
        ("hrspec_mfld_water_page", "线架-水路版", 8072),
    ):
        row = conn.execute(sa.text("SELECT id FROM sel_dict_category WHERE code = :c"), {"c": code}).fetchone()
        if row is None:
            conn.execute(
                sa.text(
                    "INSERT INTO sel_dict_category (id, code, label, sort_order) "
                    "VALUES (:id, :code, :lbl, :so)"
                ),
                {"id": uuid.uuid4(), "code": code, "lbl": label, "so": so},
            )
        else:
            conn.execute(
                sa.text("UPDATE sel_dict_category SET label = :l, sort_order = :so WHERE code = :c"),
                {"l": label, "so": so, "c": code},
            )


def downgrade() -> None:
    raise NotImplementedError("分流板线架分类新增迁移不支持自动降级")
