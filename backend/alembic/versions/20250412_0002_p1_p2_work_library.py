"""P1 project/design work + P2 standard parts & drawing versions

Revision ID: 20250412_0002
Revises: 20250412_0001
Create Date: 2026-04-12

"""

from collections.abc import Sequence

import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

from alembic import op

revision: str = "20250412_0002"
down_revision: str | None = "20250412_0001"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None

_NEW_PERM_CODES = (
    "wbs:read",
    "wbs:write",
    "milestone:read",
    "milestone:write",
    "risk:read",
    "risk:write",
    "design_task:read",
    "design_task:write",
    "design_change:read",
    "design_change:write",
    "selection:read",
    "selection:write",
    "standard_part:read",
    "standard_part:write",
    "drawing_version:read",
    "drawing_version:write",
)

_DESIGNER_PERM_CODES = (
    "wbs:read",
    "wbs:write",
    "milestone:read",
    "risk:read",
    "design_task:read",
    "design_task:write",
    "design_change:read",
    "design_change:write",
    "selection:read",
    "selection:write",
    "standard_part:read",
    "drawing_version:read",
)


def upgrade() -> None:
    op.create_table(
        "project_tasks",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("project_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("parent_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("title", sa.String(length=500), nullable=False),
        sa.Column("sort_order", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("assignee_user_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("due_date", sa.Date(), nullable=True),
        sa.Column("status", sa.String(length=32), nullable=False, server_default="todo"),
        sa.Column("remark", sa.Text(), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(["assignee_user_id"], ["users.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["parent_id"], ["project_tasks.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["project_id"], ["projects.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_project_tasks_project_id", "project_tasks", ["project_id"], unique=False)

    op.create_table(
        "project_milestones",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("project_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("name", sa.String(length=200), nullable=False),
        sa.Column("target_date", sa.Date(), nullable=True),
        sa.Column("status", sa.String(length=32), nullable=False, server_default="planned"),
        sa.Column("sort_order", sa.Integer(), nullable=False, server_default="0"),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(["project_id"], ["projects.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        "ix_project_milestones_project_id", "project_milestones", ["project_id"], unique=False
    )

    op.create_table(
        "project_risks",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("project_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("title", sa.String(length=300), nullable=False),
        sa.Column("risk_level", sa.String(length=16), nullable=False, server_default="medium"),
        sa.Column("status", sa.String(length=32), nullable=False, server_default="open"),
        sa.Column("owner_user_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("remark", sa.Text(), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(["owner_user_id"], ["users.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["project_id"], ["projects.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_project_risks_project_id", "project_risks", ["project_id"], unique=False)

    op.create_table(
        "design_tasks",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("project_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("title", sa.String(length=300), nullable=False),
        sa.Column("status", sa.String(length=32), nullable=False, server_default="pending"),
        sa.Column("assignee_user_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("sort_order", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("remark", sa.Text(), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(["assignee_user_id"], ["users.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["project_id"], ["projects.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_design_tasks_project_id", "design_tasks", ["project_id"], unique=False)

    op.create_table(
        "design_change_requests",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("project_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("title", sa.String(length=300), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("status", sa.String(length=32), nullable=False, server_default="draft"),
        sa.Column("created_by_user_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(["created_by_user_id"], ["users.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["project_id"], ["projects.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        "ix_design_change_requests_project_id",
        "design_change_requests",
        ["project_id"],
        unique=False,
    )

    op.create_table(
        "selection_stubs",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("project_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("title", sa.String(length=300), nullable=False),
        sa.Column(
            "payload",
            postgresql.JSONB(astext_type=sa.Text()),
            nullable=False,
            server_default=sa.text("'{}'::jsonb"),
        ),
        sa.Column("remark", sa.Text(), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(["project_id"], ["projects.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        "ix_selection_stubs_project_id",
        "selection_stubs",
        ["project_id"],
        unique=False,
    )

    op.create_table(
        "standard_parts",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("code", sa.String(length=64), nullable=False),
        sa.Column("name", sa.String(length=300), nullable=False),
        sa.Column("category", sa.String(length=120), nullable=True),
        sa.Column("status", sa.String(length=32), nullable=False, server_default="draft"),
        sa.Column("remark", sa.Text(), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("code"),
    )
    op.create_index("ix_standard_parts_status", "standard_parts", ["status"], unique=False)

    op.create_table(
        "drawing_versions",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("standard_part_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("version_label", sa.String(length=64), nullable=False),
        sa.Column("status", sa.String(length=32), nullable=False, server_default="draft"),
        sa.Column("file_asset_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("remark", sa.Text(), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(["file_asset_id"], ["file_assets.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["standard_part_id"], ["standard_parts.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint(
            "standard_part_id", "version_label", name="uq_drawing_version_part_label"
        ),
    )
    op.create_index(
        "ix_drawing_versions_standard_part_id",
        "drawing_versions",
        ["standard_part_id"],
        unique=False,
    )

    perm_rows = [
        ("wbs:read", "WBS任务查看", "pmo"),
        ("wbs:write", "WBS任务维护", "pmo"),
        ("milestone:read", "里程碑查看", "pmo"),
        ("milestone:write", "里程碑维护", "pmo"),
        ("risk:read", "风险登记查看", "pmo"),
        ("risk:write", "风险登记维护", "pmo"),
        ("design_task:read", "设计任务查看", "pmo"),
        ("design_task:write", "设计任务维护", "pmo"),
        ("design_change:read", "设计变更查看", "pmo"),
        ("design_change:write", "设计变更维护", "pmo"),
        ("selection:read", "选型存根查看", "pmo"),
        ("selection:write", "选型存根维护", "pmo"),
        ("standard_part:read", "标准件查看", "library"),
        ("standard_part:write", "标准件维护", "library"),
        ("drawing_version:read", "图纸版本查看", "library"),
        ("drawing_version:write", "图纸版本维护", "library"),
    ]
    conn = op.get_bind()
    # 同一占位符在 SELECT / WHERE 各出现一次时，asyncpg 会推断出冲突类型；拆成 code_a / code_b。
    ins_perm = sa.text("""
        INSERT INTO permissions (id, code, name, module, remark, created_at)
        SELECT gen_random_uuid(), :code_a, :name, :module, NULL, now()
        WHERE NOT EXISTS (SELECT 1 FROM permissions p WHERE p.code = :code_b)
    """)
    for code, name, module in perm_rows:
        conn.execute(ins_perm, {"code_a": code, "code_b": code, "name": name, "module": module})

    designer_codes = ",".join(f"'{c}'" for c in _DESIGNER_PERM_CODES)
    op.execute(
        sa.text(
            f"""
            INSERT INTO role_permissions (role_id, permission_id)
            SELECT r.id, p.id
            FROM roles r
            JOIN permissions p ON p.code IN ({designer_codes})
            WHERE r.code = 'designer'
            AND NOT EXISTS (
                SELECT 1 FROM role_permissions rp
                WHERE rp.role_id = r.id AND rp.permission_id = p.id
            )
            """
        )
    )
    admin_codes = ",".join(f"'{c}'" for c in _NEW_PERM_CODES)
    op.execute(
        sa.text(
            f"""
            INSERT INTO role_permissions (role_id, permission_id)
            SELECT r.id, p.id
            FROM roles r
            JOIN permissions p ON p.code IN ({admin_codes})
            WHERE r.code = 'admin'
            AND NOT EXISTS (
                SELECT 1 FROM role_permissions rp
                WHERE rp.role_id = r.id AND rp.permission_id = p.id
            )
            """
        )
    )


def downgrade() -> None:
    codes_list = ",".join(f"'{c}'" for c in _NEW_PERM_CODES)
    op.execute(
        sa.text(
            f"""
            DELETE FROM role_permissions
            WHERE permission_id IN (SELECT id FROM permissions WHERE code IN ({codes_list}))
            """
        )
    )
    op.execute(sa.text(f"DELETE FROM permissions WHERE code IN ({codes_list})"))

    op.drop_index("ix_drawing_versions_standard_part_id", table_name="drawing_versions")
    op.drop_table("drawing_versions")
    op.drop_index("ix_standard_parts_status", table_name="standard_parts")
    op.drop_table("standard_parts")
    op.drop_index("ix_selection_stubs_project_id", table_name="selection_stubs")
    op.drop_table("selection_stubs")
    op.drop_index("ix_design_change_requests_project_id", table_name="design_change_requests")
    op.drop_table("design_change_requests")
    op.drop_index("ix_design_tasks_project_id", table_name="design_tasks")
    op.drop_table("design_tasks")
    op.drop_index("ix_project_risks_project_id", table_name="project_risks")
    op.drop_table("project_risks")
    op.drop_index("ix_project_milestones_project_id", table_name="project_milestones")
    op.drop_table("project_milestones")
    op.drop_index("ix_project_tasks_project_id", table_name="project_tasks")
    op.drop_table("project_tasks")
