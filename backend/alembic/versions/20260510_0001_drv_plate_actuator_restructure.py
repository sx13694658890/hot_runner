"""驱动系统：气缸板开孔驱动器按型号拆类；移除旧型号与两条 BOM 分类；全量同步种子项

Revision ID: 20260510_0001
Revises: 20260509_0001
Create Date: 2026-05-10
"""

from __future__ import annotations

import uuid
from collections.abc import Sequence
from typing import Union

import sqlalchemy as sa
from alembic import op

from app.constants.sel_drive_system_detail_dict import SEL_DRIVE_SYSTEM_DICT_SEED

revision: str = "20260510_0001"
down_revision: Union[str, None] = "20260509_0001"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

OLD_PLATE_CODES = (
    "hrspec_drv_actuator_plate_model",
    "hrspec_drv_actuator_plate_bom_hs_vc",
    "hrspec_drv_actuator_plate_bom_fep",
)


def upgrade() -> None:
    conn = op.get_bind()
    for c in OLD_PLATE_CODES:
        conn.execute(sa.text("DELETE FROM sel_dict_category WHERE code = :code"), {"code": c})

    for code, cat_label, sort_ord, item_labels in SEL_DRIVE_SYSTEM_DICT_SEED:
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
    raise NotImplementedError("驱动系统气缸板开孔驱动器结构调整迁移不支持自动降级")
