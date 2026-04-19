"""模具热流道规格扁平行表 sel_mold_hot_runner_spec + 演示种子

Revision ID: 20260419_0008
Revises: 20260419_0007
Create Date: 2026-04-19

"""

from __future__ import annotations

import random
import uuid
from collections.abc import Sequence
from typing import Any, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "20260419_0008"
down_revision: Union[str, None] = "20260419_0007"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

# 与业务规格表选项池一致（演示种子随机取值）
_POOLS: dict[str, list[Any]] = {
    "system_glue_storage_modulus": ["X<1", "1<X<3", "3<X"],
    "main_nozzle_heating": ["是", "否"],
    "main_nozzle_body_material": ["FS136", "4CR13"],
    "main_nozzle_heater": ["EPM", "GPM", "MCM"],
    "manifold_bridge": ["是", "否"],
    "manifold_material": ["FS136", "4CR13", "SKD61", "DC53", "P20"],
    "manifold_channel_diameter": [5.0, 6.0, 8.0, 10, 15, 22],
    "manifold_nozzle_connection": ["M", "平压斜孔", "T"],
    "manifold_expansion_calc": ["是", "否"],
    "manifold_plug": ["BALA", "镶件+BALA", "常规"],
    "channel_direction_diagram": ["默认", "按模流分析报告"],
    "hot_nozzle_structure": [
        "SLT",
        "TOE",
        "SOE",
        "TLS",
        "OA",
        "PLT",
        "PLS",
        "SAC",
        "SLC",
        "TAC",
        "TLC",
        "SCC",
        "CC",
        "CCH",
        "CA",
    ],
    "hot_nozzle_heater": ["EPM", "EPT", "GPM", "GPT", "MCM", "MCT"],
    "gate_diameter": [1.0, 1.2, 1.5, 2, 2.5, 3.0, 3.5, 4.0, 5.0, 6.0, 7.0],
    "nozzle_core_material": ["SKD61", "铍铜", "铝合金", "钨铜", "DC53"],
    "nozzle_core_coating": ["Cr", "Ni", "Ti", "Ni+Cr"],
    "nozzle_cap_material": ["SKD61", "钛合金", "Cr12MoV"],
    "insulation_cap_material": ["PI", "PEEK", "钛合金"],
    "valve_pin_style": ["S", "T"],
    "valve_pin_material": ["SKD61", "SKH51"],
    "valve_pin_plating_process": [
        "TiN",
        "CrN",
        "ZrN",
        "DLC",
        "TiAlN",
        "CrAIN",
        "TiN+DLC",
        "TiSiN",
        "CrN+DLC",
    ],
    "shipping_water_jacket": ["是", "仅设计"],
    "shipping_protective_sleeve": ["是", "仅设计"],
}


def upgrade() -> None:
    op.create_table(
        "sel_mold_hot_runner_spec",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column(
            "mold_info_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("sel_mold_info.id", ondelete="CASCADE"),
            nullable=False,
            unique=True,
        ),
        sa.Column("system_glue_storage_modulus", sa.String(32), nullable=True),
        sa.Column("main_nozzle_heating", sa.String(16), nullable=True),
        sa.Column("main_nozzle_body_material", sa.String(64), nullable=True),
        sa.Column("main_nozzle_heater", sa.String(32), nullable=True),
        sa.Column("manifold_bridge", sa.String(16), nullable=True),
        sa.Column("manifold_material", sa.String(64), nullable=True),
        sa.Column("manifold_channel_diameter", sa.Numeric(10, 2), nullable=True),
        sa.Column("manifold_nozzle_connection", sa.String(64), nullable=True),
        sa.Column("manifold_expansion_calc", sa.String(16), nullable=True),
        sa.Column("manifold_plug", sa.String(64), nullable=True),
        sa.Column("channel_direction_diagram", sa.String(64), nullable=True),
        sa.Column("hot_nozzle_structure", sa.String(32), nullable=True),
        sa.Column("hot_nozzle_heater", sa.String(32), nullable=True),
        sa.Column("gate_diameter", sa.Numeric(10, 2), nullable=True),
        sa.Column("nozzle_core_material", sa.String(64), nullable=True),
        sa.Column("nozzle_core_coating", sa.String(32), nullable=True),
        sa.Column("nozzle_cap_material", sa.String(64), nullable=True),
        sa.Column("insulation_cap_material", sa.String(64), nullable=True),
        sa.Column("valve_pin_style", sa.String(16), nullable=True),
        sa.Column("valve_pin_material", sa.String(64), nullable=True),
        sa.Column("valve_pin_plating_process", sa.String(64), nullable=True),
        sa.Column("shipping_water_jacket", sa.String(32), nullable=True),
        sa.Column("shipping_protective_sleeve", sa.String(32), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
    )

    bind = op.get_bind()
    mids = bind.execute(sa.text("SELECT id FROM sel_mold_info ORDER BY created_at DESC LIMIT 12")).fetchall()
    rnd = random.Random(20260419)
    insert_sql = sa.text(
        """
        INSERT INTO sel_mold_hot_runner_spec (
            id, mold_info_id,
            system_glue_storage_modulus, main_nozzle_heating, main_nozzle_body_material, main_nozzle_heater,
            manifold_bridge, manifold_material, manifold_channel_diameter, manifold_nozzle_connection,
            manifold_expansion_calc, manifold_plug, channel_direction_diagram,
            hot_nozzle_structure, hot_nozzle_heater, gate_diameter,
            nozzle_core_material, nozzle_core_coating, nozzle_cap_material, insulation_cap_material,
            valve_pin_style, valve_pin_material, valve_pin_plating_process,
            shipping_water_jacket, shipping_protective_sleeve
        ) VALUES (
            :id, :mold_info_id,
            :system_glue_storage_modulus, :main_nozzle_heating, :main_nozzle_body_material, :main_nozzle_heater,
            :manifold_bridge, :manifold_material, :manifold_channel_diameter, :manifold_nozzle_connection,
            :manifold_expansion_calc, :manifold_plug, :channel_direction_diagram,
            :hot_nozzle_structure, :hot_nozzle_heater, :gate_diameter,
            :nozzle_core_material, :nozzle_core_coating, :nozzle_cap_material, :insulation_cap_material,
            :valve_pin_style, :valve_pin_material, :valve_pin_plating_process,
            :shipping_water_jacket, :shipping_protective_sleeve
        )
        ON CONFLICT (mold_info_id) DO NOTHING
        """
    )
    for (mid,) in mids:
        row = {k: rnd.choice(v) for k, v in _POOLS.items()}
        bind.execute(
            insert_sql,
            {
                "id": uuid.uuid4(),
                "mold_info_id": mid,
                **row,
            },
        )


def downgrade() -> None:
    op.drop_table("sel_mold_hot_runner_spec")
