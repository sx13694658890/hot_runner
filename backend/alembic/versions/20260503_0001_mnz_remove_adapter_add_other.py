"""主射咀大类：移除转接环（搭桥/叠模）分类，新增「其他配件」分类 hrspec_mnz_other

Revision ID: 20260503_0001
Revises: 20260502_0001
Create Date: 2026-05-03
"""

from __future__ import annotations

import uuid
from collections.abc import Sequence
from typing import Union

import sqlalchemy as sa
from alembic import op

revision: str = "20260503_0001"
down_revision: Union[str, None] = "20260502_0001"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

REMOVE_CODES = ("hrspec_mnz_adapter_ring_bridge", "hrspec_mnz_adapter_ring_stack")
NEW_CODE = "hrspec_mnz_other"
NEW_LABEL = "其他配件"
NEW_SORT = 8102


def upgrade() -> None:
    conn = op.get_bind()
    for code in REMOVE_CODES:
        conn.execute(sa.text("DELETE FROM sel_dict_category WHERE code = :c"), {"c": code})

    row = conn.execute(
        sa.text("SELECT id FROM sel_dict_category WHERE code = :c"),
        {"c": NEW_CODE},
    ).fetchone()
    if row is None:
        cid = uuid.uuid4()
        conn.execute(
            sa.text(
                "INSERT INTO sel_dict_category (id, code, label, sort_order) "
                "VALUES (:id, :code, :lbl, :so)"
            ),
            {"id": cid, "code": NEW_CODE, "lbl": NEW_LABEL, "so": NEW_SORT},
        )


def downgrade() -> None:
    raise NotImplementedError("主射咀大类调整迁移不支持自动降级")
