"""P4 工艺与现场：工艺方案、批注、试模工单、售后工单、知识库

Revision ID: 20260413_0002
Revises: 20260413_0001
Create Date: 2026-04-13

"""

from collections.abc import Sequence
from typing import Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "20260413_0002"
down_revision: Union[str, None] = "20260413_0001"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

_FIELD_PERMS = [
    ("field:read", "工艺与现场查看", "field"),
    ("field:write", "工艺与现场维护", "field"),
]


def upgrade() -> None:
    op.create_table(
        "field_process_plans",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("title", sa.String(length=300), nullable=False),
        sa.Column("summary", sa.Text(), nullable=True),
        sa.Column("status", sa.String(length=32), server_default="draft", nullable=False),
        sa.Column("project_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("standard_part_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("primary_file_asset_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("created_by_user_id", postgresql.UUID(as_uuid=True), nullable=True),
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
        sa.ForeignKeyConstraint(["project_id"], ["projects.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["standard_part_id"], ["standard_parts.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["primary_file_asset_id"], ["file_assets.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["created_by_user_id"], ["users.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_field_process_plans_status", "field_process_plans", ["status"])
    op.create_index("ix_field_process_plans_project_id", "field_process_plans", ["project_id"])
    op.create_index("ix_field_process_plans_standard_part_id", "field_process_plans", ["standard_part_id"])

    op.create_table(
        "field_process_annotations",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("body", sa.Text(), nullable=False),
        sa.Column("project_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("standard_part_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("file_asset_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("created_by_user_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(["project_id"], ["projects.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["standard_part_id"], ["standard_parts.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["file_asset_id"], ["file_assets.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["created_by_user_id"], ["users.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_field_process_annotations_project_id", "field_process_annotations", ["project_id"])
    op.create_index(
        "ix_field_process_annotations_standard_part_id",
        "field_process_annotations",
        ["standard_part_id"],
    )

    op.create_table(
        "field_trial_runs",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("title", sa.String(length=300), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("status", sa.String(length=32), server_default="draft", nullable=False),
        sa.Column("project_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("standard_part_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("drawing_version_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("assignee_user_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("report_file_asset_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("planned_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("closed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_by_user_id", postgresql.UUID(as_uuid=True), nullable=True),
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
        sa.ForeignKeyConstraint(["project_id"], ["projects.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["standard_part_id"], ["standard_parts.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["drawing_version_id"], ["drawing_versions.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["assignee_user_id"], ["users.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["report_file_asset_id"], ["file_assets.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["created_by_user_id"], ["users.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_field_trial_runs_status", "field_trial_runs", ["status"])
    op.create_index("ix_field_trial_runs_project_id", "field_trial_runs", ["project_id"])

    op.create_table(
        "field_support_tickets",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("title", sa.String(length=300), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("status", sa.String(length=32), server_default="open", nullable=False),
        sa.Column("project_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("drawing_version_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("selection_stub_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("assignee_user_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("resolution_note", sa.Text(), nullable=True),
        sa.Column("created_by_user_id", postgresql.UUID(as_uuid=True), nullable=True),
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
        sa.ForeignKeyConstraint(["project_id"], ["projects.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["drawing_version_id"], ["drawing_versions.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["selection_stub_id"], ["selection_stubs.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["assignee_user_id"], ["users.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["created_by_user_id"], ["users.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_field_support_tickets_status", "field_support_tickets", ["status"])
    op.create_index("ix_field_support_tickets_project_id", "field_support_tickets", ["project_id"])

    op.create_table(
        "field_knowledge_docs",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("title", sa.String(length=300), nullable=False),
        sa.Column("category", sa.String(length=120), nullable=True),
        sa.Column("symptom", sa.Text(), nullable=True),
        sa.Column("cause", sa.Text(), nullable=True),
        sa.Column("remedy", sa.Text(), nullable=True),
        sa.Column("status", sa.String(length=32), server_default="draft", nullable=False),
        sa.Column("file_asset_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("related_standard_part_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("created_by_user_id", postgresql.UUID(as_uuid=True), nullable=True),
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
        sa.ForeignKeyConstraint(["file_asset_id"], ["file_assets.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["related_standard_part_id"], ["standard_parts.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["created_by_user_id"], ["users.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_field_knowledge_docs_status", "field_knowledge_docs", ["status"])
    op.create_index("ix_field_knowledge_docs_category", "field_knowledge_docs", ["category"])

    conn = op.get_bind()
    ins_perm = sa.text("""
        INSERT INTO permissions (id, code, name, module, remark, created_at)
        SELECT gen_random_uuid(), :code_a, :name, :module, NULL, now()
        WHERE NOT EXISTS (SELECT 1 FROM permissions p WHERE p.code = :code_b)
    """)
    for code, name, module in _FIELD_PERMS:
        conn.execute(ins_perm, {"code_a": code, "code_b": code, "name": name, "module": module})

    fc = ",".join(f"'{c[0]}'" for c in _FIELD_PERMS)
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
    fc = ",".join(f"'{c[0]}'" for c in _FIELD_PERMS)
    op.execute(
        sa.text(
            f"""
            DELETE FROM role_permissions
            WHERE permission_id IN (SELECT id FROM permissions WHERE code IN ({fc}))
            """
        )
    )
    op.execute(sa.text(f"DELETE FROM permissions WHERE code IN ({fc})"))

    op.drop_index("ix_field_knowledge_docs_category", table_name="field_knowledge_docs")
    op.drop_index("ix_field_knowledge_docs_status", table_name="field_knowledge_docs")
    op.drop_table("field_knowledge_docs")

    op.drop_index("ix_field_support_tickets_project_id", table_name="field_support_tickets")
    op.drop_index("ix_field_support_tickets_status", table_name="field_support_tickets")
    op.drop_table("field_support_tickets")

    op.drop_index("ix_field_trial_runs_project_id", table_name="field_trial_runs")
    op.drop_index("ix_field_trial_runs_status", table_name="field_trial_runs")
    op.drop_table("field_trial_runs")

    op.drop_index("ix_field_process_annotations_standard_part_id", table_name="field_process_annotations")
    op.drop_index("ix_field_process_annotations_project_id", table_name="field_process_annotations")
    op.drop_table("field_process_annotations")

    op.drop_index("ix_field_process_plans_standard_part_id", table_name="field_process_plans")
    op.drop_index("ix_field_process_plans_project_id", table_name="field_process_plans")
    op.drop_index("ix_field_process_plans_status", table_name="field_process_plans")
    op.drop_table("field_process_plans")
