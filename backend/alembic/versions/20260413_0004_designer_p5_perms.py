"""为 designer 角色授予驾驶舱与集成只读权限（演示账号）

Revision ID: 20260413_0004
Revises: 20260413_0003
Create Date: 2026-04-13

"""

from collections.abc import Sequence
from typing import Union

import sqlalchemy as sa
from alembic import op

revision: str = "20260413_0004"
down_revision: Union[str, None] = "20260413_0003"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

_CODES = ("dashboard:read", "integration:read")


def upgrade() -> None:
    fc = ",".join(f"'{c}'" for c in _CODES)
    op.execute(
        sa.text(
            f"""
            INSERT INTO role_permissions (role_id, permission_id)
            SELECT r.id, p.id
            FROM roles r
            JOIN permissions p ON p.code IN ({fc})
            WHERE r.code = 'designer'
            AND NOT EXISTS (
                SELECT 1 FROM role_permissions rp
                WHERE rp.role_id = r.id AND rp.permission_id = p.id
            )
            """
        )
    )


def downgrade() -> None:
    fc = ",".join(f"'{c}'" for c in _CODES)
    op.execute(
        sa.text(
            f"""
            DELETE FROM role_permissions
            WHERE permission_id IN (SELECT id FROM permissions WHERE code IN ({fc}))
            AND role_id IN (SELECT id FROM roles WHERE code = 'designer')
            """
        )
    )
