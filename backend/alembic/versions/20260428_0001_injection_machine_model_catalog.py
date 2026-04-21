"""注塑机型号目录 + 机型参数表；sel_mold_info.injection_machine_model_id

Revision ID: 20260428_0001
Revises: 20260427_0001
Create Date: 2026-04-28

"""

from __future__ import annotations

import uuid
from collections.abc import Sequence
from typing import Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "20260428_0001"
down_revision: Union[str, None] = "20260427_0001"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "sel_injection_machine_model",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column("brand_dict_item_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("label", sa.String(length=200), nullable=False),
        sa.Column("sort_order", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default="true"),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("now()"),
        ),
        sa.ForeignKeyConstraint(
            ["brand_dict_item_id"],
            ["sel_dict_item.id"],
            name="fk_sel_injection_machine_model_brand_dict_item_id",
            ondelete="RESTRICT",
        ),
    )
    op.create_index(
        "ix_sel_injection_machine_model_brand_dict_item_id",
        "sel_injection_machine_model",
        ["brand_dict_item_id"],
        unique=False,
    )

    op.create_table(
        "sel_injection_machine_model_spec",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column("model_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("clamp_force_ton", sa.Integer(), nullable=True),
        sa.Column("screw_diameter_mm", sa.Numeric(10, 2), nullable=True),
        sa.Column("injection_weight_g", sa.Numeric(12, 2), nullable=True),
        sa.Column("tie_bar_horizontal_mm", sa.Numeric(10, 2), nullable=True),
        sa.Column("tie_bar_vertical_mm", sa.Numeric(10, 2), nullable=True),
        sa.Column("min_mold_thickness_mm", sa.Numeric(10, 2), nullable=True),
        sa.Column("max_mold_thickness_mm", sa.Numeric(10, 2), nullable=True),
        sa.Column("max_opening_stroke_mm", sa.Numeric(10, 2), nullable=True),
        sa.Column("max_injection_pressure_mpa", sa.Numeric(10, 2), nullable=True),
        sa.Column("nozzle_sphere_radius_mm", sa.Numeric(10, 2), nullable=True),
        sa.Column("platen_horizontal_mm", sa.Numeric(10, 2), nullable=True),
        sa.Column("platen_vertical_mm", sa.Numeric(10, 2), nullable=True),
        sa.Column("remarks", sa.Text(), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("now()"),
        ),
        sa.ForeignKeyConstraint(
            ["model_id"],
            ["sel_injection_machine_model.id"],
            name="fk_sel_injection_machine_model_spec_model_id",
            ondelete="CASCADE",
        ),
        sa.UniqueConstraint("model_id", name="uq_sel_injection_machine_model_spec_model_id"),
    )

    op.add_column(
        "sel_mold_info",
        sa.Column("injection_machine_model_id", postgresql.UUID(as_uuid=True), nullable=True),
    )
    op.create_foreign_key(
        "fk_sel_mold_info_injection_machine_model_id",
        "sel_mold_info",
        "sel_injection_machine_model",
        ["injection_machine_model_id"],
        ["id"],
        ondelete="SET NULL",
    )

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
    op.drop_constraint("fk_sel_mold_info_injection_machine_model_id", "sel_mold_info", type_="foreignkey")
    op.drop_column("sel_mold_info", "injection_machine_model_id")
    op.drop_table("sel_injection_machine_model_spec")
    op.drop_table("sel_injection_machine_model")
