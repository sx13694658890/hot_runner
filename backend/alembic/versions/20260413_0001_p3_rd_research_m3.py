"""P3 研发与成果：研发项目/任务、版本迭代、成果附件、成果入库申请（M3 标准库审批闭环）

Revision ID: 20260413_0001
Revises: 20260412_0003
Create Date: 2026-04-13

"""

from collections.abc import Sequence
from typing import Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "20260413_0001"
down_revision: Union[str, None] = "20260412_0003"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

_RD_PERMS = [
    ("rd:read", "研发域查看", "rd"),
    ("rd:write", "研发域维护", "rd"),
    ("rd:intake_approve", "研发成果入库审批", "rd"),
]


def upgrade() -> None:
    op.create_table(
        "rd_research_projects",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("name", sa.String(length=200), nullable=False),
        sa.Column("code", sa.String(length=64), nullable=True),
        sa.Column("parent_project_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("status", sa.String(length=32), server_default="active", nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("owner_user_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(["parent_project_id"], ["projects.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["owner_user_id"], ["users.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("code", name="uq_rd_research_projects_code"),
    )
    op.create_index("ix_rd_research_projects_parent", "rd_research_projects", ["parent_project_id"])
    op.create_index("ix_rd_research_projects_status", "rd_research_projects", ["status"])

    op.create_table(
        "rd_research_tasks",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("research_project_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("title", sa.String(length=500), nullable=False),
        sa.Column("status", sa.String(length=32), server_default="todo", nullable=False),
        sa.Column("assignee_user_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("due_date", sa.Date(), nullable=True),
        sa.Column("sort_order", sa.Integer(), server_default="0", nullable=False),
        sa.Column("remark", sa.Text(), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(["research_project_id"], ["rd_research_projects.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["assignee_user_id"], ["users.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        "ix_rd_research_tasks_project_id",
        "rd_research_tasks",
        ["research_project_id"],
        unique=False,
    )

    op.create_table(
        "rd_release_iterations",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("research_project_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("version_label", sa.String(length=64), nullable=False),
        sa.Column("release_notes", sa.Text(), nullable=True),
        sa.Column("status", sa.String(length=32), server_default="draft", nullable=False),
        sa.Column("submitted_by_user_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("submitted_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("reviewed_by_user_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("reviewed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("review_comment", sa.Text(), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(["research_project_id"], ["rd_research_projects.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["submitted_by_user_id"], ["users.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["reviewed_by_user_id"], ["users.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint(
            "research_project_id",
            "version_label",
            name="uq_rd_release_iterations_project_version",
        ),
    )
    op.create_index(
        "ix_rd_release_iterations_project_id",
        "rd_release_iterations",
        ["research_project_id"],
        unique=False,
    )

    op.create_table(
        "rd_deliverables",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("research_project_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("title", sa.String(length=300), nullable=False),
        sa.Column("category", sa.String(length=32), server_default="other", nullable=False),
        sa.Column(
            "tags",
            postgresql.JSONB(astext_type=sa.Text()),
            server_default=sa.text("'[]'::jsonb"),
            nullable=False,
        ),
        sa.Column("file_asset_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("remark", sa.Text(), nullable=True),
        sa.Column("created_by_user_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(["research_project_id"], ["rd_research_projects.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["file_asset_id"], ["file_assets.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["created_by_user_id"], ["users.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        "ix_rd_deliverables_project_id",
        "rd_deliverables",
        ["research_project_id"],
        unique=False,
    )
    op.create_index("ix_rd_deliverables_category", "rd_deliverables", ["category"], unique=False)

    op.create_table(
        "rd_library_intakes",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("research_project_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("title", sa.String(length=300), nullable=False),
        sa.Column("proposed_code", sa.String(length=64), nullable=False),
        sa.Column("proposed_name", sa.String(length=300), nullable=False),
        sa.Column("category", sa.String(length=120), nullable=True),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("file_asset_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("status", sa.String(length=32), server_default="draft", nullable=False),
        sa.Column("result_standard_part_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("created_by_user_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("submitted_by_user_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("submitted_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("reviewed_by_user_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("reviewed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("review_comment", sa.Text(), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(["research_project_id"], ["rd_research_projects.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["file_asset_id"], ["file_assets.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["result_standard_part_id"], ["standard_parts.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["created_by_user_id"], ["users.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["submitted_by_user_id"], ["users.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["reviewed_by_user_id"], ["users.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        "ix_rd_library_intakes_project_id",
        "rd_library_intakes",
        ["research_project_id"],
        unique=False,
    )
    op.create_index(
        "ix_rd_library_intakes_status",
        "rd_library_intakes",
        ["status"],
        unique=False,
    )

    conn = op.get_bind()
    ins_perm = sa.text("""
        INSERT INTO permissions (id, code, name, module, remark, created_at)
        SELECT gen_random_uuid(), :code_a, :name, :module, NULL, now()
        WHERE NOT EXISTS (SELECT 1 FROM permissions p WHERE p.code = :code_b)
    """)
    for code, name, module in _RD_PERMS:
        conn.execute(ins_perm, {"code_a": code, "code_b": code, "name": name, "module": module})

    rd_codes = ",".join(f"'{c[0]}'" for c in _RD_PERMS)
    op.execute(
        sa.text(
            f"""
            INSERT INTO role_permissions (role_id, permission_id)
            SELECT r.id, p.id
            FROM roles r
            JOIN permissions p ON p.code IN ({rd_codes})
            WHERE r.code = 'admin'
            AND NOT EXISTS (
                SELECT 1 FROM role_permissions rp
                WHERE rp.role_id = r.id AND rp.permission_id = p.id
            )
            """
        )
    )


def downgrade() -> None:
    rd_codes = ",".join(f"'{c[0]}'" for c in _RD_PERMS)
    op.execute(
        sa.text(
            f"""
            DELETE FROM role_permissions
            WHERE permission_id IN (SELECT id FROM permissions WHERE code IN ({rd_codes}))
            """
        )
    )
    op.execute(sa.text(f"DELETE FROM permissions WHERE code IN ({rd_codes})"))

    op.drop_index("ix_rd_library_intakes_status", table_name="rd_library_intakes")
    op.drop_index("ix_rd_library_intakes_project_id", table_name="rd_library_intakes")
    op.drop_table("rd_library_intakes")

    op.drop_index("ix_rd_deliverables_category", table_name="rd_deliverables")
    op.drop_index("ix_rd_deliverables_project_id", table_name="rd_deliverables")
    op.drop_table("rd_deliverables")

    op.drop_index("ix_rd_release_iterations_project_id", table_name="rd_release_iterations")
    op.drop_table("rd_release_iterations")

    op.drop_index("ix_rd_research_tasks_project_id", table_name="rd_research_tasks")
    op.drop_table("rd_research_tasks")

    op.drop_index("ix_rd_research_projects_status", table_name="rd_research_projects")
    op.drop_index("ix_rd_research_projects_parent", table_name="rd_research_projects")
    op.drop_table("rd_research_projects")
