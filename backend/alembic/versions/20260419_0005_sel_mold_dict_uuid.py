"""选型字典表 + 模具根部字典字段改存 sel_dict_item.id (UUID)

Revision ID: 20260419_0005
Revises: 20260413_0004
Create Date: 2026-04-19

"""

from __future__ import annotations

from collections.abc import Sequence
from typing import Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

from app.constants.sel_mold_dict import SEL_MOLD_DICT_SEED

revision: str = "20260419_0005"
down_revision: Union[str, None] = "20260413_0004"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "sel_dict_category",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("code", sa.String(length=80), nullable=False),
        sa.Column("label", sa.String(length=200), nullable=False),
        sa.Column("sort_order", sa.Integer(), server_default="0", nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("code"),
    )

    op.create_table(
        "sel_dict_item",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("category_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("label", sa.String(length=500), nullable=False),
        sa.Column("sort_order", sa.Integer(), server_default="0", nullable=False),
        sa.Column("is_active", sa.Boolean(), server_default="true", nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(["category_id"], ["sel_dict_category.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_sel_dict_item_category_id", "sel_dict_item", ["category_id"])

    conn = op.get_bind()

    # 种子分类与选项
    import uuid

    for code, cat_label, sort_ord, item_labels in SEL_MOLD_DICT_SEED:
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

    fk_cols = [
        ("mold_status_id", "mold_status", "mold_status"),
        ("mold_type_id", "mold_type", "mold_type"),
        ("locating_ring_eccentric_id", "locating_ring_eccentric", "locating_ring_eccentric"),
        ("order_requirement_id", "order_requirement", "order_requirement"),
        ("hot_runner_type_id", "hot_runner_type", "hot_runner_type"),
        ("point_numbering_rule_id", "point_numbering_rule", "point_numbering_rule"),
        ("driver_type_id", "driver_type", "driver_type"),
        ("solenoid_valve_id", "solenoid_valve", "solenoid_valve"),
        ("solenoid_valve_position_id", "solenoid_valve_position", "solenoid_valve_position"),
        ("gate_system_desc_id", "gate_system_desc", "gate_system_desc"),
        ("balance_requirement_id", "balance_requirement", "balance_requirement"),
        ("runner_plate_style_id", "runner_plate_style", "runner_plate_style"),
        ("solenoid_valve_socket_id", "solenoid_valve_socket", "solenoid_valve_socket"),
        ("signal_wiring_method_id", "signal_wiring_method", "signal_wiring_method"),
        ("cooling_medium_id", "cooling_medium", "cooling_medium"),
        ("water_oil_connector_position_id", "water_oil_connector_position", "water_oil_connector_position"),
        ("has_temp_controller_id", "has_temp_controller", "has_temp_controller"),
        ("has_sequence_controller_id", "has_sequence_controller", "has_sequence_controller"),
        ("has_booster_pump_id", "has_booster_pump", "has_booster_pump"),
        ("has_multiple_oil_pumps_id", "has_multiple_oil_pumps", "has_multiple_oil_pumps"),
        ("junction_box_position_id", "junction_box_position", "junction_box_position"),
        ("socket_type_id", "socket_type", "socket_type"),
        ("socket_pin_count_id", "socket_pin_count", "socket_pin_count"),
        ("thermocouple_type_id", "thermocouple_type", "thermocouple_type"),
        ("delivery_wiring_method_id", "delivery_wiring_method", "delivery_wiring_method"),
        ("debug_wiring_method_id", "debug_wiring_method", "debug_wiring_method"),
    ]

    for col_name, old_col, cat_code in fk_cols:
        op.add_column(
            "sel_mold_info",
            sa.Column(col_name, postgresql.UUID(as_uuid=True), nullable=True),
        )
        op.create_foreign_key(
            f"fk_sel_mold_info_{col_name}_dict_item",
            "sel_mold_info",
            "sel_dict_item",
            [col_name],
            ["id"],
            ondelete="RESTRICT",
        )

    # 旧数据回填：按文案匹配同分类下的字典项
    for col_name, old_col, cat_code in fk_cols:
        if old_col == "socket_pin_count":
            conn.execute(
                sa.text(
                    f"""
                    UPDATE sel_mold_info m
                    SET {col_name} = i.id
                    FROM sel_dict_item i
                    JOIN sel_dict_category c ON i.category_id = c.id
                    WHERE c.code = :cat
                      AND m.{old_col} IS NOT NULL
                      AND i.label = m.{old_col}::text
                    """
                ),
                {"cat": cat_code},
            )
        else:
            conn.execute(
                sa.text(
                    f"""
                    UPDATE sel_mold_info m
                    SET {col_name} = i.id
                    FROM sel_dict_item i
                    JOIN sel_dict_category c ON i.category_id = c.id
                    WHERE c.code = :cat
                      AND m.{old_col} IS NOT NULL
                      AND i.label = m.{old_col}
                    """
                ),
                {"cat": cat_code},
            )

    op.drop_index("ix_sel_mold_info_mold_type", table_name="sel_mold_info")
    op.drop_index("ix_sel_mold_info_hot_runner_type", table_name="sel_mold_info")

    old_cols = [x[1] for x in fk_cols]
    for oc in old_cols:
        op.drop_column("sel_mold_info", oc)


def downgrade() -> None:
    raise NotImplementedError("模具字典 UUID 迁移不可逆（需手工恢复）")
