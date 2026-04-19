"""P5 集成作业表 + dashboard/integration 权限

Revision ID: 20260413_0003
Revises: 20260413_0002
Create Date: 2026-04-13

"""

from collections.abc import Sequence
from typing import Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "20260413_0003"
down_revision: Union[str, None] = "20260413_0002"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

_P5_PERMS = [
    ("dashboard:read", "驾驶舱与KPI查看", "cockpit"),
    ("integration:read", "集成作业查看", "integration"),
    ("integration:write", "集成作业触发", "integration"),
]


def upgrade() -> None:
    op.create_table(
        "integration_sync_jobs",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("job_type", sa.String(length=64), nullable=False),
        sa.Column("direction", sa.String(length=16), nullable=True),
        sa.Column("status", sa.String(length=32), nullable=False),
        sa.Column("detail", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column("message", sa.Text(), nullable=True),
        sa.Column("started_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("finished_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("triggered_by_user_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(["triggered_by_user_id"], ["users.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_integration_sync_jobs_job_type", "integration_sync_jobs", ["job_type"])
    op.create_index("ix_integration_sync_jobs_status", "integration_sync_jobs", ["status"])
    op.create_index("ix_integration_sync_jobs_created_at", "integration_sync_jobs", ["created_at"])

    conn = op.get_bind()
    ins_perm = sa.text("""
        INSERT INTO permissions (id, code, name, module, remark, created_at)
        SELECT gen_random_uuid(), :code_a, :name, :module, NULL, now()
        WHERE NOT EXISTS (SELECT 1 FROM permissions p WHERE p.code = :code_b)
    """)
    for code, name, module in _P5_PERMS:
        conn.execute(ins_perm, {"code_a": code, "code_b": code, "name": name, "module": module})

    fc = ",".join(f"'{c[0]}'" for c in _P5_PERMS)
    op.execute(
        sa.text(
            f"""
            INSERT INTO role_permissions (role_id, permission_id)
            SELECT r.id, p.id
            FROM roles r
            JOIN permissions p ON p.code IN ({fc})
            WHERE r.code = 'admin'
            AND NOT EXISTS (
                SELECT 1 FROM role_permissions rp
                WHERE rp.role_id = r.id AND rp.permission_id = p.id
            )
            """
        )
    )


def downgrade() -> None:
    fc = ",".join(f"'{c[0]}'" for c in _P5_PERMS)
    op.execute(
        sa.text(
            f"""
            DELETE FROM role_permissions
            WHERE permission_id IN (SELECT id FROM permissions WHERE code IN ({fc}))
            """
        )
    )
    op.execute(sa.text(f"DELETE FROM permissions WHERE code IN ({fc})"))

    op.drop_index("ix_integration_sync_jobs_created_at", table_name="integration_sync_jobs")
    op.drop_index("ix_integration_sync_jobs_status", table_name="integration_sync_jobs")
    op.drop_index("ix_integration_sync_jobs_job_type", table_name="integration_sync_jobs")
    op.drop_table("integration_sync_jobs")
