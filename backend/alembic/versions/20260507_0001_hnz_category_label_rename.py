"""热咀大类：三处分类显示名调整（垫圈/本体碟簧）

Revision ID: 20260507_0001
Revises: 20260506_0001
Create Date: 2026-05-07
"""

from __future__ import annotations

from collections.abc import Sequence
from typing import Union

import sqlalchemy as sa
from alembic import op

revision: str = "20260507_0001"
down_revision: Union[str, None] = "20260506_0001"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    conn = op.get_bind()
    for code, label in (
        ("hrspec_hnz_section_coiled", "垫圈-镶嵌用"),
        ("hrspec_hnz_section_beryllium", "垫圈-铜套用"),
        ("hrspec_hnz_body_length", "本体碟簧"),
    ):
        conn.execute(
            sa.text("UPDATE sel_dict_category SET label = :l WHERE code = :c"),
            {"l": label, "c": code},
        )


def downgrade() -> None:
    conn = op.get_bind()
    for code, label in (
        ("hrspec_hnz_section_coiled", "截面-绕线咀"),
        ("hrspec_hnz_section_beryllium", "截面-铍铜咀"),
        ("hrspec_hnz_body_length", "本体长度"),
    ):
        conn.execute(
            sa.text("UPDATE sel_dict_category SET label = :l WHERE code = :c"),
            {"l": label, "c": code},
        )
