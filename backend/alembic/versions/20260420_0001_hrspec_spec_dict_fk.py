"""热流道规格选项改存字典 UUID + 可参考系统编号文本

Revision ID: 20260420_0001
Revises: 20260419_0008
Create Date: 2026-04-20

"""

from __future__ import annotations

import uuid
from collections.abc import Sequence
from typing import Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

from app.constants.sel_hrspec_dict import SEL_HRSPEC_DICT_SEED

revision: str = "20260420_0001"
down_revision: Union[str, None] = "20260419_0008"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

_MIGRATE_VARCHAR: list[tuple[str, str, str]] = [
    ("system_glue_storage_modulus", "system_glue_storage_modulus_id", "hrspec_system_glue_storage"),
    ("main_nozzle_heating", "main_nozzle_heating_id", "hrspec_main_nozzle_heating"),
    ("main_nozzle_body_material", "main_nozzle_body_material_id", "hrspec_main_nozzle_body_material"),
    ("main_nozzle_heater", "main_nozzle_heater_id", "hrspec_main_nozzle_heater"),
    ("manifold_bridge", "manifold_bridge_id", "hrspec_manifold_bridge"),
    ("manifold_material", "manifold_material_id", "hrspec_manifold_material"),
    ("manifold_nozzle_connection", "manifold_nozzle_connection_id", "hrspec_manifold_nozzle_connection"),
    ("manifold_expansion_calc", "manifold_expansion_calc_id", "hrspec_manifold_expansion_calc"),
    ("manifold_plug", "manifold_plug_id", "hrspec_manifold_plug"),
    ("channel_direction_diagram", "channel_direction_diagram_id", "hrspec_channel_direction_diagram"),
    ("hot_nozzle_structure", "hot_nozzle_structure_id", "hrspec_hot_nozzle_structure"),
    ("hot_nozzle_heater", "hot_nozzle_heater_id", "hrspec_hot_nozzle_heater"),
    ("nozzle_core_material", "nozzle_core_material_id", "hrspec_nozzle_core_material"),
    ("nozzle_core_coating", "nozzle_core_coating_id", "hrspec_nozzle_core_coating"),
    ("nozzle_cap_material", "nozzle_cap_material_id", "hrspec_nozzle_cap_material"),
    ("insulation_cap_material", "insulation_cap_material_id", "hrspec_insulation_cap_material"),
    ("valve_pin_style", "valve_pin_style_id", "hrspec_valve_pin_style"),
    ("valve_pin_material", "valve_pin_material_id", "hrspec_valve_pin_material"),
    ("valve_pin_plating_process", "valve_pin_plating_process_id", "hrspec_valve_pin_plating_process"),
    ("shipping_water_jacket", "shipping_water_jacket_id", "hrspec_shipping_water_jacket"),
    ("shipping_protective_sleeve", "shipping_protective_sleeve_id", "hrspec_shipping_protective_sleeve"),
]

_MIGRATE_NUMERIC: list[tuple[str, str, str]] = [
    ("manifold_channel_diameter", "manifold_channel_diameter_id", "hrspec_manifold_channel_diameter"),
    ("gate_diameter", "gate_diameter_id", "hrspec_gate_diameter"),
]

_FK_COLS: list[str] = [b for _, b, _ in _MIGRATE_VARCHAR + _MIGRATE_NUMERIC]


def upgrade() -> None:
    conn = op.get_bind()

    for code, cat_label, sort_ord, item_labels in SEL_HRSPEC_DICT_SEED:
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

    for new_col in _FK_COLS:
        op.add_column(
            "sel_mold_hot_runner_spec",
            sa.Column(new_col, postgresql.UUID(as_uuid=True), nullable=True),
        )

    op.add_column(
        "sel_mold_hot_runner_spec",
        sa.Column("reference_system_number", sa.String(length=200), nullable=True),
    )

    for old, new, cat in _MIGRATE_VARCHAR:
        conn.execute(
            sa.text(
                f"""
                UPDATE sel_mold_hot_runner_spec AS s
                SET {new} = i.id
                FROM sel_dict_item AS i
                INNER JOIN sel_dict_category AS c ON i.category_id = c.id
                WHERE c.code = :code
                  AND s.{old} IS NOT NULL AND btrim(s.{old}::text) <> ''
                  AND btrim(i.label) = btrim(s.{old}::text)
                """
            ),
            {"code": cat},
        )

    for old, new, cat in _MIGRATE_NUMERIC:
        conn.execute(
            sa.text(
                f"""
                UPDATE sel_mold_hot_runner_spec AS s
                SET {new} = i.id
                FROM sel_dict_item AS i
                INNER JOIN sel_dict_category AS c ON i.category_id = c.id
                WHERE c.code = :code
                  AND s.{old} IS NOT NULL
                  AND (
                    btrim(i.label) = btrim(s.{old}::text)
                    OR s.{old}::numeric = cast(nullif(btrim(i.label), '') as numeric)
                  )
                """
            ),
            {"code": cat},
        )

    _OLD_VARCHAR_COLS = [a for a, _, _ in _MIGRATE_VARCHAR]
    _OLD_NUM_COLS = [a for a, _, _ in _MIGRATE_NUMERIC]
    for col in _OLD_VARCHAR_COLS + _OLD_NUM_COLS:
        op.drop_column("sel_mold_hot_runner_spec", col)

    for new_col in _FK_COLS:
        op.create_foreign_key(
            f"fk_sel_mold_hrspec_{new_col}_dict",
            "sel_mold_hot_runner_spec",
            "sel_dict_item",
            [new_col],
            ["id"],
            ondelete="RESTRICT",
        )


def downgrade() -> None:
    raise NotImplementedError("热流道规格字典化迁移不支持自动降级")
