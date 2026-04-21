"""sel_mold_info：客户设备库 customer_equipment_library_id + 字典种子

Revision ID: 20260430_0001
Revises: 20260429_0001
Create Date: 2026-04-30

"""

from __future__ import annotations

import uuid
from collections.abc import Sequence
from typing import Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "20260430_0001"
down_revision: Union[str, None] = "20260429_0001"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

_CATEGORY_CODE = "customer_equipment_library"
_CATEGORY_LABEL = "客户设备库"
_CATEGORY_SORT = 266
_ITEM_LABELS = ("A机器", "B机器", "C机器")


def upgrade() -> None:
    op.add_column(
        "sel_mold_info",
        sa.Column(
            "customer_equipment_library_id",
            postgresql.UUID(as_uuid=True),
            nullable=True,
        ),
    )
    op.create_foreign_key(
        "fk_sel_mold_info_customer_equipment_library_id",
        "sel_mold_info",
        "sel_dict_item",
        ["customer_equipment_library_id"],
        ["id"],
        ondelete="RESTRICT",
    )

    conn = op.get_bind()
    row = conn.execute(
        sa.text("SELECT id FROM sel_dict_category WHERE code = :c"),
        {"c": _CATEGORY_CODE},
    ).fetchone()
    if row is None:
        cid = uuid.uuid4()
        conn.execute(
            sa.text(
                "INSERT INTO sel_dict_category (id, code, label, sort_order) "
                "VALUES (:id, :code, :lbl, :so)"
            ),
            {"id": cid, "code": _CATEGORY_CODE, "lbl": _CATEGORY_LABEL, "so": _CATEGORY_SORT},
        )
    else:
        cid = row[0]

    max_so = conn.execute(
        sa.text("SELECT COALESCE(MAX(sort_order), -1) FROM sel_dict_item WHERE category_id = :cid"),
        {"cid": cid},
    ).scalar()
    next_so = int(max_so)

    for lbl in _ITEM_LABELS:
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
    op.drop_constraint(
        "fk_sel_mold_info_customer_equipment_library_id",
        "sel_mold_info",
        type_="foreignkey",
    )
    op.drop_column("sel_mold_info", "customer_equipment_library_id")
