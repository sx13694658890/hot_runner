"""若曾插入误用 code hrspec_mnz_other_accessories，删除该分类（与 hrspec_mnz_other 重复）

Revision ID: 20260504_0001
Revises: 20260503_0001
Create Date: 2026-05-04
"""

from __future__ import annotations

from collections.abc import Sequence
from typing import Union

import sqlalchemy as sa
from alembic import op

revision: str = "20260504_0001"
down_revision: Union[str, None] = "20260503_0001"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

WRONG_CODE = "hrspec_mnz_other_accessories"


def upgrade() -> None:
    conn = op.get_bind()
    conn.execute(
        sa.text("DELETE FROM sel_dict_category WHERE code = :c"),
        {"c": WRONG_CODE},
    )


def downgrade() -> None:
    raise NotImplementedError("清理误用主射咀分类迁移不支持自动降级")
