"""sel_product_info 字典 UUID + product 字典种子

Revision ID: 20260419_0006
Revises: 20260419_0005
Create Date: 2026-04-19

"""

from __future__ import annotations

from collections.abc import Sequence
from typing import Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

from app.constants.sel_product_dict import SEL_PRODUCT_DICT_SEED

revision: str = "20260419_0006"
down_revision: Union[str, None] = "20260419_0005"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    conn = op.get_bind()
    import uuid

    for code, cat_label, sort_ord, item_labels in SEL_PRODUCT_DICT_SEED:
        cid = uuid.uuid4()
        conn.execute(
            sa.text(
                "INSERT INTO sel_dict_category (id, code, label, sort_order) "
                "VALUES (:id, :code, :label, :so)"
            ),
            {"id": cid, "code": code, "label": cat_label, "so": sort_ord},
        )
        for i, lbl in enumerate(item_labels):
            conn.execute(
                sa.text(
                    "INSERT INTO sel_dict_item (id, category_id, label, sort_order, is_active) "
                    "VALUES (:iid, :cid, :lbl, :so, true)"
                ),
                {"iid": uuid.uuid4(), "cid": cid, "lbl": lbl, "so": i},
            )

    fk_cols = [
        ("application_field_id", "application_field", "product_application_field"),
        ("wall_thickness_id", "wall_thickness", "product_wall_thickness"),
        ("color_id", "color", "product_color"),
        ("surface_finish_id", "surface_finish", "product_surface_finish"),
        ("precision_level_id", "precision_level", "product_precision_level"),
        ("mechanical_requirement_id", "mechanical_requirement", "product_mechanical_requirement"),
        ("efficiency_requirement_id", "efficiency_requirement", "product_efficiency_requirement"),
        ("production_batch_id", "production_batch", "product_production_batch"),
    ]

    op.add_column(
        "sel_product_info",
        sa.Column("color_remark", sa.String(length=200), nullable=True),
    )

    for col_name, old_col, cat_code in fk_cols:
        op.add_column(
            "sel_product_info",
            sa.Column(col_name, postgresql.UUID(as_uuid=True), nullable=True),
        )
        op.create_foreign_key(
            f"fk_sel_product_info_{col_name}_dict_item",
            "sel_product_info",
            "sel_dict_item",
            [col_name],
            ["id"],
            ondelete="RESTRICT",
        )

    for col_name, old_col, cat_code in fk_cols:
        conn.execute(
            sa.text(
                f"""
                UPDATE sel_product_info p
                SET {col_name} = i.id
                FROM sel_dict_item i
                JOIN sel_dict_category c ON i.category_id = c.id
                WHERE c.code = :cat
                  AND p.{old_col} IS NOT NULL
                  AND i.label = p.{old_col}
                """
            ),
            {"cat": cat_code},
        )

    op.drop_index("ix_sel_product_application", table_name="sel_product_info")

    old_cols = [x[1] for x in fk_cols]
    for oc in old_cols:
        op.drop_column("sel_product_info", oc)


def downgrade() -> None:
    raise NotImplementedError("sel_product_info 字典 UUID 迁移不可逆")
