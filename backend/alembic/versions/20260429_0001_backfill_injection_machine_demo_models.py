"""幂等补种海天/恩格尔示例机型（修正首版种子漏插或 label 不完全匹配）

Revision ID: 20260429_0001
Revises: b1f0e993645a
Create Date: 2026-04-29

若 20260428 运行时品牌字典项尚未就绪，或 label 存在首尾空白导致
`i.label = :lbl` 匹配失败，则 `sel_injection_machine_model` 可能为空。
本迁移按 lower(btrim(label)) 查找品牌，且仅在该品牌下缺少同名型号时插入。
"""

from __future__ import annotations

import uuid
from collections.abc import Sequence
from typing import Union

import sqlalchemy as sa
from alembic import op

revision: str = "20260429_0001"
down_revision: Union[str, None] = "b1f0e993645a"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    conn = op.get_bind()

    def brand_id(lbl: str):
        row = conn.execute(
            sa.text(
                "SELECT i.id FROM sel_dict_item i "
                "INNER JOIN sel_dict_category c ON c.id = i.category_id "
                "WHERE c.code = 'injection_machine_brand' "
                "AND lower(btrim(i.label)) = lower(btrim(:lbl)) AND i.is_active IS true "
                "ORDER BY i.sort_order, i.label LIMIT 1"
            ),
            {"lbl": lbl},
        ).fetchone()
        return row[0] if row else None

    def model_exists(bid, mlabel: str) -> bool:
        r = conn.execute(
            sa.text(
                "SELECT 1 FROM sel_injection_machine_model "
                "WHERE brand_dict_item_id = :bid AND label = :lbl LIMIT 1"
            ),
            {"bid": bid, "lbl": mlabel},
        ).fetchone()
        return r is not None

    seed: list[tuple[str, list[tuple[str, int, dict]]]] = [
        (
            "海天",
            [
                (
                    "MA900III/370",
                    0,
                    {
                        "clamp_force_ton": 90,
                        "screw_diameter_mm": 32,
                        "tie_bar_horizontal_mm": 360,
                        "tie_bar_vertical_mm": 310,
                        "min_mold_thickness_mm": 150,
                        "max_mold_thickness_mm": 550,
                        "max_opening_stroke_mm": 320,
                    },
                ),
                (
                    "MA1200III/370",
                    1,
                    {
                        "clamp_force_ton": 120,
                        "screw_diameter_mm": 36,
                        "tie_bar_horizontal_mm": 410,
                        "tie_bar_vertical_mm": 360,
                        "min_mold_thickness_mm": 180,
                        "max_mold_thickness_mm": 650,
                        "max_opening_stroke_mm": 350,
                    },
                ),
            ],
        ),
        (
            "恩格尔",
            [
                (
                    "e-victory 310/120",
                    0,
                    {
                        "clamp_force_ton": 310,
                        "screw_diameter_mm": 45,
                        "tie_bar_horizontal_mm": 560,
                        "tie_bar_vertical_mm": 510,
                        "min_mold_thickness_mm": 200,
                        "max_mold_thickness_mm": 800,
                        "max_opening_stroke_mm": 500,
                    },
                ),
            ],
        ),
    ]

    for brand_lbl, models in seed:
        bid = brand_id(brand_lbl)
        if bid is None:
            continue
        for mlabel, sort_idx, spec_kw in models:
            if model_exists(bid, mlabel):
                continue
            mid = uuid.uuid4()
            conn.execute(
                sa.text(
                    "INSERT INTO sel_injection_machine_model "
                    "(id, brand_dict_item_id, label, sort_order, is_active) "
                    "VALUES (:id, :bid, :lbl, :so, true)"
                ),
                {"id": mid, "bid": bid, "lbl": mlabel, "so": sort_idx},
            )
            sid = uuid.uuid4()
            conn.execute(
                sa.text(
                    "INSERT INTO sel_injection_machine_model_spec ("
                    "id, model_id, clamp_force_ton, screw_diameter_mm, "
                    "tie_bar_horizontal_mm, tie_bar_vertical_mm, "
                    "min_mold_thickness_mm, max_mold_thickness_mm, max_opening_stroke_mm, remarks"
                    ") VALUES ("
                    ":id, :mid, :cft, :sd, :tbh, :tbv, :minmt, :maxmt, :mos, :rmk"
                    ")"
                ),
                {
                    "id": sid,
                    "mid": mid,
                    "cft": spec_kw.get("clamp_force_ton"),
                    "sd": spec_kw.get("screw_diameter_mm"),
                    "tbh": spec_kw.get("tie_bar_horizontal_mm"),
                    "tbv": spec_kw.get("tie_bar_vertical_mm"),
                    "minmt": spec_kw.get("min_mold_thickness_mm"),
                    "maxmt": spec_kw.get("max_mold_thickness_mm"),
                    "mos": spec_kw.get("max_opening_stroke_mm"),
                    "rmk": None,
                },
            )


def downgrade() -> None:
    conn = op.get_bind()
    conn.execute(
        sa.text(
            "DELETE FROM sel_injection_machine_model m "
            "USING sel_dict_item i, sel_dict_category c "
            "WHERE m.brand_dict_item_id = i.id AND i.category_id = c.id "
            "AND c.code = 'injection_machine_brand' "
            "AND lower(btrim(i.label)) IN ('海天', '恩格尔') "
            "AND m.label IN ('MA900III/370', 'MA1200III/370', 'e-victory 310/120')"
        )
    )
