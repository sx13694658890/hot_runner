"""sel_mold_info：注塑机品牌 injection_machine_brand_id + 字典种子

Revision ID: 20260427_0001
Revises: 20260426_0001
Create Date: 2026-04-27

"""

from __future__ import annotations

import uuid
from collections.abc import Sequence
from typing import Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

from app.constants.sel_mold_dict import SEL_MOLD_DICT_SEED

revision: str = "20260427_0001"
down_revision: Union[str, None] = "20260426_0001"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "sel_mold_info",
        sa.Column(
            "injection_machine_brand_id",
            postgresql.UUID(as_uuid=True),
            nullable=True,
        ),
    )
    op.create_foreign_key(
        "fk_sel_mold_info_injection_machine_brand_id",
        "sel_mold_info",
        "sel_dict_item",
        ["injection_machine_brand_id"],
        ["id"],
        ondelete="RESTRICT",
    )

    conn = op.get_bind()
    for code, cat_label, sort_ord, item_labels in SEL_MOLD_DICT_SEED:
        if code != "injection_machine_brand":
            continue
        row = conn.execute(sa.text("SELECT id FROM sel_dict_category WHERE code = :c"), {"c": code}).fetchone()
        if row is None:
            cid = uuid.uuid4()
            conn.execute(
                sa.text(
                    "INSERT INTO sel_dict_category (id, code, label, sort_order) "
                    "VALUES (:id, :code, :lbl, :so)"
                ),
                {"id": cid, "code": code, "lbl": cat_label, "so": sort_ord},
            )
        else:
            cid = row[0]

        max_so = conn.execute(
            sa.text("SELECT COALESCE(MAX(sort_order), -1) FROM sel_dict_item WHERE category_id = :cid"),
            {"cid": cid},
        ).scalar()
        next_so = int(max_so)

        for lbl in item_labels:
            dup = conn.execute(
                sa.text(
                    "SELECT 1 FROM sel_dict_item WHERE category_id = :cid "
                    "AND lower(btrim(label)) = lower(btrim(:lbl)) LIMIT 1"
                ),
                {"cid": cid, "lbl": lbl},
            ).fetchone()
            if dup is not None:
                continue
            next_so += 1
            conn.execute(
                sa.text(
                    "INSERT INTO sel_dict_item (id, category_id, label, sort_order, is_active) "
                    "VALUES (:iid, :cid, :lbl, :so, true)"
                ),
                {"iid": uuid.uuid4(), "cid": cid, "lbl": lbl, "so": next_so},
            )


def downgrade() -> None:
    op.drop_constraint("fk_sel_mold_info_injection_machine_brand_id", "sel_mold_info", type_="foreignkey")
    op.drop_column("sel_mold_info", "injection_machine_brand_id")
