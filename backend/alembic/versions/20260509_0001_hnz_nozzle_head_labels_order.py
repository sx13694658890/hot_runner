"""热咀大类：咀头分组标签与 sort_order（胶口套/隔热帽/隔热顺序等）

Revision ID: 20260509_0001
Revises: 20260508_0001
Create Date: 2026-05-09
"""

from __future__ import annotations

from collections.abc import Sequence
from typing import Union

import sqlalchemy as sa
from alembic import op

from app.constants.sel_hot_nozzle_detail_dict import SEL_HOT_NOZZLE_DICT_SEED

revision: str = "20260509_0001"
down_revision: Union[str, None] = "20260508_0001"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    conn = op.get_bind()
    for code, cat_label, sort_ord, _ in SEL_HOT_NOZZLE_DICT_SEED:
        conn.execute(
            sa.text("UPDATE sel_dict_category SET label = :lbl, sort_order = :so WHERE code = :c"),
            {"lbl": cat_label, "so": sort_ord, "c": code},
        )


def downgrade() -> None:
    raise NotImplementedError("热咀咀头标签与顺序调整迁移不支持自动降级")
