"""分流板大类数据字典种子（hrspec_mfld_*，对齐热流道 Excel 截图）

Revision ID: 20260421_0001
Revises: b5894b42461c
Create Date: 2026-04-21
"""

from __future__ import annotations

import uuid
from collections.abc import Sequence
from typing import Union

import sqlalchemy as sa
from alembic import op

from app.constants.sel_manifold_detail_dict import SEL_MANIFOLD_DICT_SEED

revision: str = "20260421_0001"
down_revision: Union[str, None] = "b5894b42461c"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    conn = op.get_bind()

    for code, cat_label, sort_ord, item_labels in SEL_MANIFOLD_DICT_SEED:
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
    raise NotImplementedError("分流板字典种子迁移不支持自动降级")
