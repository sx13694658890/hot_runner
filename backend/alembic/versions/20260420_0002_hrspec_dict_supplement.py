"""按当前 SEL_HRSPEC_DICT_SEED 向存量库追加缺失的热流道规格字典项

Revision ID: 20260420_0002
Revises: 20260420_0001
Create Date: 2026-04-20

与 docs/hot_runner_system_hot_runner_system/hot_runner_complete_data.json、
hot_runner_data_dictionary.md 对齐；对已存在分类按 label（忽略大小写与首尾空格）去重后插入。
"""

from __future__ import annotations

import uuid
from collections.abc import Sequence
from typing import Union

import sqlalchemy as sa
from alembic import op

from app.constants.sel_hrspec_dict import SEL_HRSPEC_DICT_SEED

revision: str = "20260420_0002"
down_revision: Union[str, None] = "20260420_0001"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    conn = op.get_bind()

    for code, _label, _so, item_labels in SEL_HRSPEC_DICT_SEED:
        row = conn.execute(
            sa.text("SELECT id FROM sel_dict_category WHERE code = :code"),
            {"code": code},
        ).fetchone()
        if row is None:
            continue
        category_id = row[0]

        max_so = conn.execute(
            sa.text("SELECT COALESCE(MAX(sort_order), -1) FROM sel_dict_item WHERE category_id = :cid"),
            {"cid": category_id},
        ).scalar()
        next_so = int(max_so)

        for lbl in item_labels:
            dup = conn.execute(
                sa.text(
                    "SELECT 1 FROM sel_dict_item WHERE category_id = :cid "
                    "AND lower(btrim(label)) = lower(btrim(:lbl)) LIMIT 1"
                ),
                {"cid": category_id, "lbl": lbl},
            ).fetchone()
            if dup is not None:
                continue
            next_so += 1
            conn.execute(
                sa.text(
                    "INSERT INTO sel_dict_item (id, category_id, label, sort_order, is_active) "
                    "VALUES (:iid, :cid, :lbl, :so, true)"
                ),
                {
                    "iid": uuid.uuid4(),
                    "cid": category_id,
                    "lbl": lbl,
                    "so": next_so,
                },
            )


def downgrade() -> None:
    raise NotImplementedError("字典项补充迁移不支持自动降级（避免误删业务已选 UUID）")
