"""模具选型领域表 sel_* — 对齐 docs/database_schema.sql（PostgreSQL）；种子材料数据同文档 INSERT。

Revision ID: 20260206_0001
Revises: 4298f2223457
Create Date: 2026-02-06

"""

from collections.abc import Sequence
from typing import Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "20260206_0001"
down_revision: Union[str, None] = "ecca140b6824"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


# docs/database_schema.sql INSERT 顺序（43 条）与属性行一一对应
_MATERIAL_ABBRS = [
    "ABS",
    "ASA",
    "CAB",
    "EVA",
    "FEP",
    "HDPE",
    "HIPS(PS)",
    "LCP",
    "LDPE",
    "PA11",
    "PA12",
    "PA46",
    "PA6",
    "PA66",
    "PBTP(PBT)",
    "PC",
    "PC+ABS",
    "PC+ASA",
    "PCT",
    "PCTA",
    "PCTG",
    "PEEK",
    "PEI",
    "PES",
    "PET",
    "PETG",
    "PETP",
    "PMMA",
    "POM",
    "POM+25FV",
    "PP",
    "PP+40FV",
    "PPO/PPE",
    "PPS",
    "PS",
    "PSU",
    "SAN",
    "SB",
    "SEBS",
    "TPE",
    "TPU",
    "HPVC",
    "PVC",
]

# (mold_temp, melt_temp, degradation_temp, molding_window, ejection_temp, crystallinity, moisture_absorption, viscosity, metal_corrosion, injection_pressure, residence_time)
_MATERIAL_PROPS: list[tuple] = [
    ("40~80", "220~260", ">270", 40, "70~90", "非晶", "0.2~0.4", "中高", "无", "80~140", "3~6"),
    ("50~90", "230~270", ">280", 40, "80~100", "非晶", "0.2~0.4", "中高", "无", "90~150", "3~6"),
    ("20~60", "200~230", ">240", 30, "40~60", "非晶", "<0.2", "中", "无", "70~120", "2~4"),
    ("10~40", "160~190", ">200", 30, "30~50", "高结晶", "<0.1", "低", "无", "60~100", "2~4"),
    ("150~200", "320~380", ">400", 60, "180~200", "高结晶", "<0.01", "低", "无", "60~100", "长期"),
    ("20~60", "180~220", ">280", 40, "50~70", "高结晶", "<0.01", "低", "无", "60~100", "2~5"),
    ("20~60", "180~220", ">250", 40, "50~70", "非晶", "0.1~0.3", "中", "无", "70~120", "2~5"),
    ("100~150", "310~340", ">360", 30, "160~180", "高结晶", "0.02~0.05", "极低", "无", "70~120", "2~4"),
    ("10~40", "170~200", ">260", 30, "40~60", "高结晶", "<0.01", "低", "无", "60~90", "2~5"),
    ("60~100", "230~260", ">280", 30, "90~110", "高结晶", "0.2~0.4", "中", "弱", "80~140", "3~6"),
    ("50~90", "220~250", ">270", 30, "80~100", "高结晶", "0.1~0.3", "中", "弱", "80~130", "3~6"),
    ("100~150", "290~320", ">330", 30, "140~160", "高结晶", "0.1~0.3", "中", "弱", "90~160", "3~6"),
    ("60~100", "240~270", ">280", 30, "90~110", "高结晶", "1.2~1.8", "中", "弱", "80~150", "2~4"),
    ("70~110", "260~290", ">290", 30, "100~120", "高结晶", "1.3~2.0", "中", "弱", "90~160", "2~4"),
    ("60~100", "240~270", ">280", 30, "90~110", "高结晶", "0.1~0.3", "中", "弱", "80~140", "3~6"),
    ("70~110", "280~310", ">320", 30, "100~120", "非晶", "0.1~0.3", "中高", "无", "100~170", "3~6"),
    ("50~90", "250~280", ">290", 30, "80~100", "非晶", "0.1~0.3", "中", "无", "90~150", "3~6"),
    ("60~100", "260~290", ">300", 30, "90~110", "非晶", "0.1~0.3", "中高", "无", "90~150", "3~6"),
    ("100~150", "280~310", ">320", 30, "140~160", "半结晶", "0.1~0.3", "中高", "无", "100~170", "3~6"),
    ("60~100", "240~270", ">280", 30, "90~110", "非晶", "0.1~0.3", "中", "无", "80~140", "3~6"),
    ("30~70", "230~260", ">270", 30, "60~80", "非晶", "0.1~0.3", "中", "无", "80~130", "3~6"),
    ("160~190", "350~400", ">420", 50, "200~220", "高结晶", "<0.1", "高", "无", "100~180", "4~8"),
    ("130~160", "330~390", ">400", 60, "160~180", "非晶", "0.1~0.3", "高", "无", "100~180", "4~8"),
    ("140~180", "330~390", ">400", 60, "170~190", "非晶", "0.1~0.3", "高", "无", "100~180", "4~8"),
    ("120~160", "260~290", ">300", 30, "130~150", "高结晶", "0.2~0.4", "中", "弱", "90~160", "2~4"),
    ("30~70", "230~260", ">270", 30, "60~80", "非晶", "0.1~0.3", "中", "无", "80~130", "3~6"),
    ("120~160", "260~290", ">300", 30, "130~150", "高结晶", "0.2~0.4", "中", "弱", "90~160", "2~4"),
    ("40~80", "220~250", ">260", 30, "70~90", "非晶", "0.2~0.5", "高", "无", "100~170", "3~6"),
    ("60~100", "190~220", ">230", 30, "90~110", "高结晶", "0.1~0.3", "低", "较强", "70~120", "2~4"),
    ("80~120", "200~230", ">240", 30, "110~130", "高结晶", "0.1~0.3", "低", "较强", "80~140", "2~4"),
    ("20~60", "200~230", ">260", 30, "50~70", "高结晶", "<0.01", "低", "无", "60~100", "2~5"),
    ("40~80", "210~240", ">270", 30, "70~90", "高结晶", "<0.01", "低", "无", "80~140", "2~5"),
    ("80~120", "270~300", ">310", 30, "120~140", "非晶", "0.1~0.3", "中高", "无", "90~150", "3~6"),
    ("120~160", "290~320", ">350", 30, "150~170", "高结晶", "0.01~0.05", "中", "无", "90~160", "4~8"),
    ("20~60", "180~220", ">250", 40, "50~70", "非晶", "0.1~0.3", "中", "无", "70~120", "2~5"),
    ("120~160", "320~380", ">380", 60, "160~180", "非晶", "0.1~0.3", "高", "无", "100~180", "4~8"),
    ("40~80", "210~240", ">250", 30, "70~90", "非晶", "0.1~0.3", "中", "无", "80~140", "3~6"),
    ("20~60", "180~220", ">240", 40, "50~70", "非晶", "0.1~0.3", "低", "无", "70~120", "2~5"),
    ("20~60", "190~230", ">240", 40, "50~70", "非晶", "<0.1", "低", "无", "60~100", "2~5"),
    ("10~40", "170~200", ">220", 30, "40~60", "非晶", "<0.1", "低", "无", "70~120", "2~5"),
    ("20~60", "180~210", ">220", 30, "50~70", "非晶", "0.1~0.3", "中", "无", "80~140", "2~4"),
    ("20~50", "170~200", ">190", 30, "40~60", "非晶", "0.1~0.3", "中", "强", "80~140", "≤2"),
    ("20~50", "160~190", ">180", 30, "40~60", "非晶", "0.1~0.3", "中", "强", "80~140", "≤2"),
]


def upgrade() -> None:
    conn = op.get_bind()

    op.create_table(
        "sel_material",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("abbreviation", sa.String(length=40), nullable=False),
        sa.Column("is_active", sa.Boolean(), server_default="true", nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("abbreviation"),
    )

    op.create_table(
        "sel_material_property",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("material_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("mold_temp", sa.String(length=80), nullable=True),
        sa.Column("melt_temp", sa.String(length=80), nullable=True),
        sa.Column("degradation_temp", sa.String(length=80), nullable=True),
        sa.Column("molding_window", sa.Integer(), nullable=True),
        sa.Column("ejection_temp", sa.String(length=80), nullable=True),
        sa.Column("crystallinity", sa.String(length=32), nullable=True),
        sa.Column("moisture_absorption", sa.String(length=80), nullable=True),
        sa.Column("viscosity", sa.String(length=32), nullable=True),
        sa.Column("metal_corrosion", sa.String(length=32), nullable=True),
        sa.Column("injection_pressure", sa.String(length=80), nullable=True),
        sa.Column("residence_time", sa.String(length=80), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(["material_id"], ["sel_material.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("material_id"),
    )

    op.create_table(
        "sel_mold_info",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("manufacturer", sa.String(length=200), nullable=True),
        sa.Column("manager", sa.String(length=100), nullable=True),
        sa.Column("manager_phone", sa.String(length=50), nullable=True),
        sa.Column("mold_id", sa.String(length=100), nullable=True),
        sa.Column("hot_runner_id", sa.String(length=100), nullable=True),
        sa.Column("nozzle_count", sa.Integer(), nullable=True),
        sa.Column("cavity_count", sa.Integer(), nullable=True),
        sa.Column("mold_status", sa.String(length=64), nullable=True),
        sa.Column("mold_type", sa.String(length=64), nullable=True),
        sa.Column("locating_ring_eccentric", sa.String(length=32), nullable=True),
        sa.Column("order_requirement", sa.String(length=64), nullable=True),
        sa.Column("hot_runner_type", sa.String(length=128), nullable=True),
        sa.Column("point_numbering_rule", sa.String(length=64), nullable=True),
        sa.Column("driver_type", sa.String(length=32), nullable=True),
        sa.Column("solenoid_valve", sa.String(length=64), nullable=True),
        sa.Column("solenoid_valve_position", sa.String(length=64), nullable=True),
        sa.Column("gate_system_desc", sa.String(length=32), nullable=True),
        sa.Column("mold_core_eject", sa.Boolean(), nullable=True),
        sa.Column("balance_requirement", sa.String(length=32), nullable=True),
        sa.Column("plate_thickness_adjustable", sa.Boolean(), nullable=True),
        sa.Column("runner_plate_style", sa.String(length=64), nullable=True),
        sa.Column("wire_frame_needed", sa.Boolean(), nullable=True),
        sa.Column("solenoid_valve_socket", sa.String(length=100), nullable=True),
        sa.Column("signal_wiring_method", sa.String(length=64), nullable=True),
        sa.Column("cooling_medium", sa.String(length=32), nullable=True),
        sa.Column("water_oil_connector_position", sa.String(length=64), nullable=True),
        sa.Column("has_mold_temp_controller", sa.Boolean(), nullable=True),
        sa.Column("has_temp_controller", sa.String(length=64), nullable=True),
        sa.Column("has_sequence_controller", sa.String(length=64), nullable=True),
        sa.Column("has_booster_pump", sa.String(length=64), nullable=True),
        sa.Column("has_multiple_oil_pumps", sa.String(length=64), nullable=True),
        sa.Column("junction_box_position", sa.String(length=64), nullable=True),
        sa.Column("socket_type", sa.String(length=64), nullable=True),
        sa.Column("socket_pin_count", sa.Integer(), nullable=True),
        sa.Column("thermocouple_type", sa.String(length=8), nullable=True),
        sa.Column("delivery_wiring_method", sa.String(length=100), nullable=True),
        sa.Column("debug_wiring_method", sa.String(length=100), nullable=True),
        sa.Column("injection_machine_model", sa.String(length=100), nullable=True),
        sa.Column("injection_machine_tonnage", sa.Integer(), nullable=True),
        sa.Column("barrel_sphere_radius", sa.Numeric(10, 2), nullable=True),
        sa.Column("barrel_orifice", sa.Numeric(10, 2), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.PrimaryKeyConstraint("id"),
    )

    op.create_table(
        "sel_product_info",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("mold_info_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("product_name", sa.String(length=200), nullable=True),
        sa.Column("application_field", sa.String(length=64), nullable=True),
        sa.Column("weight", sa.Numeric(12, 2), nullable=True),
        sa.Column("wall_thickness", sa.String(length=64), nullable=True),
        sa.Column("color", sa.String(length=32), nullable=True),
        sa.Column("surface_finish", sa.String(length=64), nullable=True),
        sa.Column("precision_level", sa.String(length=64), nullable=True),
        sa.Column("mechanical_requirement", sa.String(length=64), nullable=True),
        sa.Column("efficiency_requirement", sa.String(length=32), nullable=True),
        sa.Column("production_batch", sa.String(length=64), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(["mold_info_id"], ["sel_mold_info.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("mold_info_id"),
    )

    op.create_table(
        "sel_hot_runner_system",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("mold_info_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("resin_retention_cycles", sa.String(length=32), nullable=True),
        sa.Column("main_nozzle_heating", sa.Boolean(), nullable=True),
        sa.Column("main_nozzle_material", sa.String(length=32), nullable=True),
        sa.Column("main_nozzle_heater", sa.String(length=16), nullable=True),
        sa.Column("manifold_bridging", sa.Boolean(), nullable=True),
        sa.Column("manifold_material", sa.String(length=32), nullable=True),
        sa.Column("manifold_runner_diameter", sa.Numeric(10, 2), nullable=True),
        sa.Column("manifold_interface", sa.String(length=32), nullable=True),
        sa.Column("manifold_calculate_expansion", sa.Boolean(), nullable=True),
        sa.Column("manifold_plug", sa.String(length=64), nullable=True),
        sa.Column("manifold_runner_diagram", sa.String(length=64), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(["mold_info_id"], ["sel_mold_info.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("mold_info_id"),
    )

    op.create_table(
        "sel_nozzle_config",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("hot_runner_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("nozzle_index", sa.Integer(), server_default="1", nullable=False),
        sa.Column("structure", sa.String(length=16), nullable=True),
        sa.Column("heater", sa.String(length=16), nullable=True),
        sa.Column("gate_diameter", sa.Numeric(10, 2), nullable=True),
        sa.Column("tip_material", sa.String(length=32), nullable=True),
        sa.Column("tip_coating", sa.String(length=32), nullable=True),
        sa.Column("cap_material", sa.String(length=32), nullable=True),
        sa.Column("insulator_material", sa.String(length=32), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(["hot_runner_id"], ["sel_hot_runner_system.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("hot_runner_id", "nozzle_index", name="uq_sel_nozzle_hot_runner_index"),
    )

    op.create_table(
        "sel_valve_pin_config",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("hot_runner_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("style", sa.String(length=8), nullable=True),
        sa.Column("material", sa.String(length=32), nullable=True),
        sa.Column("coating", sa.String(length=32), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(["hot_runner_id"], ["sel_hot_runner_system.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("hot_runner_id"),
    )

    op.create_table(
        "sel_association_rule",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("rule_code", sa.String(length=64), nullable=False),
        sa.Column("rule_name", sa.String(length=200), nullable=False),
        sa.Column("trigger_conditions", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column("recommendations", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column("exclusions", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column("reason", sa.Text(), nullable=True),
        sa.Column("priority", sa.Integer(), server_default="1", nullable=False),
        sa.Column("is_active", sa.Boolean(), server_default="true", nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("rule_code"),
    )

    op.create_index("ix_sel_mold_info_mold_type", "sel_mold_info", ["mold_type"])
    op.create_index("ix_sel_mold_info_hot_runner_type", "sel_mold_info", ["hot_runner_type"])
    op.create_index("ix_sel_product_application", "sel_product_info", ["application_field"])
    op.create_index("ix_sel_material_abbr", "sel_material", ["abbreviation"])

    import json
    import uuid

    ins_mat = sa.text(
        """
        INSERT INTO sel_material (id, abbreviation, is_active)
        VALUES (:id, :abbr, true)
        """
    )
    ins_prop = sa.text(
        """
        INSERT INTO sel_material_property (
          id, material_id, mold_temp, melt_temp, degradation_temp, molding_window,
          ejection_temp, crystallinity, moisture_absorption, viscosity, metal_corrosion,
          injection_pressure, residence_time
        ) VALUES (
          :id, :mid, :mt, :met, :deg, :mw, :ej, :cry, :mois, :visc, :corr, :inj, :dwell
        )
        """
    )

    for abbr, prow in zip(_MATERIAL_ABBRS, _MATERIAL_PROPS):
        mid = uuid.uuid4()
        conn.execute(ins_mat, {"id": mid, "abbr": abbr})
        conn.execute(
            ins_prop,
            {
                "id": uuid.uuid4(),
                "mid": mid,
                "mt": prow[0],
                "met": prow[1],
                "deg": prow[2],
                "mw": prow[3],
                "ej": prow[4],
                "cry": prow[5],
                "mois": prow[6],
                "visc": prow[7],
                "corr": prow[8],
                "inj": prow[9],
                "dwell": prow[10],
            },
        )

    rule1 = sa.text(
        """
        INSERT INTO sel_association_rule (
          id, rule_code, rule_name, trigger_conditions, recommendations, reason, priority, is_active
        ) VALUES (
          :id, :code, :name, CAST(:tc AS jsonb), CAST(:rec AS jsonb), :reason, :prio, true
        )
        """
    )
    rule2 = sa.text(
        """
        INSERT INTO sel_association_rule (
          id, rule_code, rule_name, trigger_conditions, recommendations, exclusions, reason, priority, is_active
        ) VALUES (
          :id, :code, :name, CAST(:tc AS jsonb), CAST(:rec AS jsonb), CAST(:exc AS jsonb), :reason, :prio, true
        )
        """
    )
    conn.execute(
        rule1,
        {
            "id": uuid.uuid4(),
            "code": "MAT_HIGH_TEMP",
            "name": "高温材料规则",
            "tc": json.dumps({"material_groups": ["高温材料"]}),
            "rec": json.dumps({"thermocouple_type": ["K"], "main_nozzle_heater": ["MCM"]}),
            "reason": "高温材料需要耐高温组件（与 docs/数据模型 §5.1 对齐，引擎逻辑见 docs/association_rules.py）",
            "prio": 10,
        },
    )
    conn.execute(
        rule2,
        {
            "id": uuid.uuid4(),
            "code": "MAT_CORROSIVE",
            "name": "腐蚀性材料规则",
            "tc": json.dumps({"material_groups": ["腐蚀性材料"]}),
            "rec": json.dumps({"tip_coating": ["Ni", "DLC"], "main_nozzle_material": ["FS136"]}),
            "exc": json.dumps({"tip_coating": ["Cr"]}),
            "reason": "腐蚀性材料会腐蚀普通钢材",
            "prio": 20,
        },
    )


def downgrade() -> None:
    op.drop_index("ix_sel_material_abbr", table_name="sel_material")
    op.drop_index("ix_sel_product_application", table_name="sel_product_info")
    op.drop_index("ix_sel_mold_info_hot_runner_type", table_name="sel_mold_info")
    op.drop_index("ix_sel_mold_info_mold_type", table_name="sel_mold_info")

    op.drop_table("sel_association_rule")
    op.drop_table("sel_valve_pin_config")
    op.drop_table("sel_nozzle_config")
    op.drop_table("sel_hot_runner_system")
    op.drop_table("sel_product_info")
    op.drop_table("sel_mold_info")
    op.drop_table("sel_material_property")
    op.drop_table("sel_material")
