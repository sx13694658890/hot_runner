"""热咀大类：结构代码拆为四类（开放式/针阀式×大水口/点胶口），移除扁平 hrspec_hnz_structure_code

Revision ID: 20260508_0001
Revises: 20260507_0001
Create Date: 2026-05-08
"""

from __future__ import annotations

import uuid
from collections.abc import Sequence
from typing import Union

import sqlalchemy as sa
from alembic import op

from app.constants.sel_hot_nozzle_detail_dict import SEL_HOT_NOZZLE_DICT_SEED

revision: str = "20260508_0001"
down_revision: Union[str, None] = "20260507_0001"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

OLD_FLAT_CODE = "hrspec_hnz_structure_code"
STRUCT_PREFIX = "hrspec_hnz_structure_"


def upgrade() -> None:
    conn = op.get_bind()
    conn.execute(
        sa.text("DELETE FROM sel_dict_category WHERE code = :c"),
        {"c": OLD_FLAT_CODE},
    )

    for code, cat_label, sort_ord, item_labels in SEL_HOT_NOZZLE_DICT_SEED:
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
            conn.execute(
                sa.text("UPDATE sel_dict_category SET label = :lbl, sort_order = :so WHERE id = :id"),
                {"lbl": cat_label, "so": sort_ord, "id": cid},
            )

        if not code.startswith(STRUCT_PREFIX):
            continue

        conn.execute(sa.text("DELETE FROM sel_dict_item WHERE category_id = :cid"), {"cid": cid})
        for i, lbl in enumerate(item_labels):
            conn.execute(
                sa.text(
                    "INSERT INTO sel_dict_item (id, category_id, label, sort_order, is_active) "
                    "VALUES (:iid, :cid, :lbl, :so, true)"
                ),
                {"iid": uuid.uuid4(), "cid": cid, "lbl": lbl, "so": i},
            )


def downgrade() -> None:
    raise NotImplementedError("热咀结构代码拆分迁移不支持自动降级")
