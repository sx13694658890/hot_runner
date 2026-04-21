"""误 autogenerate 占位 revision（勿再向 IAM 表加约束）

Revision ID: b1f0e993645a
Revises: 20260428_0001
Create Date: 2026-04-22 00:51:29.285899

此前 `alembic revision --autogenerate` 误将已存在的
`uq_role_permission` / `uq_user_role` 当作新增，导致 upgrade 失败。
本 revision 保持链不断裂，upgrade/downgrade 均为空操作。
"""

from __future__ import annotations

from collections.abc import Sequence
from typing import Union

from alembic import op

revision: str = "b1f0e993645a"
down_revision: Union[str, None] = "20260428_0001"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass
