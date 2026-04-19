"""
模具选型领域表 ORM — 字段对齐 docs/database_schema.sql（PostgreSQL / 语义码存 VARCHAR）。
与 docs 下 selection_engine.py / association_rules.py 引擎代码无运行时耦合，仅供持久化与接口使用。
"""

from __future__ import annotations

import uuid
from datetime import datetime
from decimal import Decimal
from typing import TYPE_CHECKING

from sqlalchemy import (
    Boolean,
    DateTime,
    ForeignKey,
    Integer,
    Numeric,
    String,
    Text,
    func,
)
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base

if TYPE_CHECKING:
    pass


class SelDictCategory(Base):
    """选型字典分类（如 mold_status），项见 SelDictItem。"""

    __tablename__ = "sel_dict_category"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    code: Mapped[str] = mapped_column(String(80), nullable=False, unique=True)
    label: Mapped[str] = mapped_column(String(200), nullable=False)
    sort_order: Mapped[int] = mapped_column(Integer, nullable=False, server_default="0")

    items: Mapped[list["SelDictItem"]] = relationship(
        back_populates="category",
        cascade="all, delete-orphan",
        order_by="SelDictItem.sort_order",
    )


class SelDictItem(Base):
    """选型字典项；模具根部字典字段存本表 id（UUID）。"""

    __tablename__ = "sel_dict_item"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    category_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("sel_dict_category.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    label: Mapped[str] = mapped_column(String(500), nullable=False)
    sort_order: Mapped[int] = mapped_column(Integer, nullable=False, server_default="0")
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, server_default="true")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    category: Mapped[SelDictCategory] = relationship(back_populates="items")


class SelMaterial(Base):
    """材料主表（与文档 materials 对应）"""

    __tablename__ = "sel_material"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    abbreviation: Mapped[str] = mapped_column(String(40), nullable=False, unique=True)
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, server_default="true")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    property_row: Mapped[SelMaterialProperty | None] = relationship(
        back_populates="material",
        cascade="all, delete-orphan",
        uselist=False,
    )

    mold_infos: Mapped[list["SelMoldInfo"]] = relationship(back_populates="material")


class SelMaterialProperty(Base):
    """材料属性（与文档 material_properties 对应）"""

    __tablename__ = "sel_material_property"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    material_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("sel_material.id", ondelete="CASCADE"),
        nullable=False,
        unique=True,
    )

    mold_temp: Mapped[str | None] = mapped_column(String(80), nullable=True)
    melt_temp: Mapped[str | None] = mapped_column(String(80), nullable=True)
    degradation_temp: Mapped[str | None] = mapped_column(String(80), nullable=True)
    molding_window: Mapped[int | None] = mapped_column(Integer, nullable=True)
    ejection_temp: Mapped[str | None] = mapped_column(String(80), nullable=True)
    crystallinity: Mapped[str | None] = mapped_column(String(32), nullable=True)
    moisture_absorption: Mapped[str | None] = mapped_column(String(80), nullable=True)
    viscosity: Mapped[str | None] = mapped_column(String(32), nullable=True)
    metal_corrosion: Mapped[str | None] = mapped_column(String(32), nullable=True)
    injection_pressure: Mapped[str | None] = mapped_column(String(80), nullable=True)
    residence_time: Mapped[str | None] = mapped_column(String(80), nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    material: Mapped[SelMaterial] = relationship(back_populates="property_row")


class SelMoldInfo(Base):
    """模具信息（mold_info）"""

    __tablename__ = "sel_mold_info"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    manufacturer: Mapped[str | None] = mapped_column(String(200), nullable=True)
    manager: Mapped[str | None] = mapped_column(String(100), nullable=True)
    manager_phone: Mapped[str | None] = mapped_column(String(50), nullable=True)
    mold_id: Mapped[str | None] = mapped_column(String(100), nullable=True)
    hot_runner_id: Mapped[str | None] = mapped_column(String(100), nullable=True)
    nozzle_count: Mapped[int | None] = mapped_column(Integer, nullable=True)
    cavity_count: Mapped[int | None] = mapped_column(Integer, nullable=True)

    mold_status_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("sel_dict_item.id", ondelete="RESTRICT"), nullable=True
    )
    mold_type_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("sel_dict_item.id", ondelete="RESTRICT"), nullable=True
    )
    locating_ring_eccentric_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("sel_dict_item.id", ondelete="RESTRICT"), nullable=True
    )
    order_requirement_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("sel_dict_item.id", ondelete="RESTRICT"), nullable=True
    )
    hot_runner_type_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("sel_dict_item.id", ondelete="RESTRICT"), nullable=True
    )
    point_numbering_rule_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("sel_dict_item.id", ondelete="RESTRICT"), nullable=True
    )
    driver_type_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("sel_dict_item.id", ondelete="RESTRICT"), nullable=True
    )
    solenoid_valve_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("sel_dict_item.id", ondelete="RESTRICT"), nullable=True
    )
    solenoid_valve_position_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("sel_dict_item.id", ondelete="RESTRICT"), nullable=True
    )
    gate_system_desc_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("sel_dict_item.id", ondelete="RESTRICT"), nullable=True
    )

    mold_core_eject: Mapped[bool | None] = mapped_column(Boolean, nullable=True)
    balance_requirement_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("sel_dict_item.id", ondelete="RESTRICT"), nullable=True
    )
    plate_thickness_adjustable: Mapped[bool | None] = mapped_column(Boolean, nullable=True)
    runner_plate_style_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("sel_dict_item.id", ondelete="RESTRICT"), nullable=True
    )
    wire_frame_needed: Mapped[bool | None] = mapped_column(Boolean, nullable=True)
    solenoid_valve_socket_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("sel_dict_item.id", ondelete="RESTRICT"), nullable=True
    )
    signal_wiring_method_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("sel_dict_item.id", ondelete="RESTRICT"), nullable=True
    )

    cooling_medium_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("sel_dict_item.id", ondelete="RESTRICT"), nullable=True
    )
    water_oil_connector_position_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("sel_dict_item.id", ondelete="RESTRICT"), nullable=True
    )
    has_mold_temp_controller: Mapped[bool | None] = mapped_column(Boolean, nullable=True)
    has_temp_controller_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("sel_dict_item.id", ondelete="RESTRICT"), nullable=True
    )
    has_sequence_controller_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("sel_dict_item.id", ondelete="RESTRICT"), nullable=True
    )
    has_booster_pump_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("sel_dict_item.id", ondelete="RESTRICT"), nullable=True
    )
    has_multiple_oil_pumps_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("sel_dict_item.id", ondelete="RESTRICT"), nullable=True
    )

    junction_box_position_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("sel_dict_item.id", ondelete="RESTRICT"), nullable=True
    )
    socket_type_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("sel_dict_item.id", ondelete="RESTRICT"), nullable=True
    )
    socket_pin_count_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("sel_dict_item.id", ondelete="RESTRICT"), nullable=True
    )
    thermocouple_type_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("sel_dict_item.id", ondelete="RESTRICT"), nullable=True
    )
    delivery_wiring_method_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("sel_dict_item.id", ondelete="RESTRICT"), nullable=True
    )
    debug_wiring_method_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("sel_dict_item.id", ondelete="RESTRICT"), nullable=True
    )

    injection_machine_model: Mapped[str | None] = mapped_column(String(100), nullable=True)
    injection_machine_tonnage: Mapped[int | None] = mapped_column(Integer, nullable=True)
    barrel_sphere_radius: Mapped[Decimal | None] = mapped_column(Numeric(10, 2), nullable=True)
    barrel_orifice: Mapped[Decimal | None] = mapped_column(Numeric(10, 2), nullable=True)

    material_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("sel_material.id", ondelete="SET NULL"),
        nullable=True,
    )

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    material: Mapped[SelMaterial | None] = relationship(back_populates="mold_infos")

    product: Mapped[SelProductInfo | None] = relationship(
        back_populates="mold",
        cascade="all, delete-orphan",
        uselist=False,
    )
    hot_runner: Mapped[SelHotRunnerSystem | None] = relationship(
        back_populates="mold",
        cascade="all, delete-orphan",
        uselist=False,
    )
    hot_runner_spec: Mapped["SelMoldHotRunnerSpec | None"] = relationship(
        back_populates="mold",
        cascade="all, delete-orphan",
        uselist=False,
    )


class SelProductInfo(Base):
    """产品信息"""

    __tablename__ = "sel_product_info"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    mold_info_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("sel_mold_info.id", ondelete="CASCADE"),
        nullable=False,
        unique=True,
    )

    product_name: Mapped[str | None] = mapped_column(String(200), nullable=True)
    weight: Mapped[Decimal | None] = mapped_column(Numeric(12, 2), nullable=True)

    application_field_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("sel_dict_item.id", ondelete="RESTRICT"), nullable=True
    )
    wall_thickness_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("sel_dict_item.id", ondelete="RESTRICT"), nullable=True
    )
    color_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("sel_dict_item.id", ondelete="RESTRICT"), nullable=True
    )
    color_remark: Mapped[str | None] = mapped_column(String(200), nullable=True)
    surface_finish_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("sel_dict_item.id", ondelete="RESTRICT"), nullable=True
    )
    precision_level_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("sel_dict_item.id", ondelete="RESTRICT"), nullable=True
    )
    mechanical_requirement_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("sel_dict_item.id", ondelete="RESTRICT"), nullable=True
    )
    efficiency_requirement_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("sel_dict_item.id", ondelete="RESTRICT"), nullable=True
    )
    production_batch_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("sel_dict_item.id", ondelete="RESTRICT"), nullable=True
    )

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    mold: Mapped[SelMoldInfo] = relationship(back_populates="product")


class SelHotRunnerSystem(Base):
    """热流道系统"""

    __tablename__ = "sel_hot_runner_system"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    mold_info_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("sel_mold_info.id", ondelete="CASCADE"),
        nullable=False,
        unique=True,
    )

    resin_retention_cycles: Mapped[str | None] = mapped_column(String(32), nullable=True)

    main_nozzle_heating: Mapped[bool | None] = mapped_column(Boolean, nullable=True)
    main_nozzle_material: Mapped[str | None] = mapped_column(String(32), nullable=True)
    main_nozzle_heater: Mapped[str | None] = mapped_column(String(16), nullable=True)

    manifold_bridging: Mapped[bool | None] = mapped_column(Boolean, nullable=True)
    manifold_material: Mapped[str | None] = mapped_column(String(32), nullable=True)
    manifold_runner_diameter: Mapped[Decimal | None] = mapped_column(Numeric(10, 2), nullable=True)
    manifold_interface: Mapped[str | None] = mapped_column(String(32), nullable=True)
    manifold_calculate_expansion: Mapped[bool | None] = mapped_column(Boolean, nullable=True)
    manifold_plug: Mapped[str | None] = mapped_column(String(64), nullable=True)
    manifold_runner_diagram: Mapped[str | None] = mapped_column(String(64), nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    mold: Mapped[SelMoldInfo] = relationship(back_populates="hot_runner")
    nozzles: Mapped[list[SelNozzleConfig]] = relationship(
        back_populates="hot_runner",
        cascade="all, delete-orphan",
    )
    valve_pin: Mapped[SelValvePinConfig | None] = relationship(
        back_populates="hot_runner",
        cascade="all, delete-orphan",
        uselist=False,
    )


class SelNozzleConfig(Base):
    """热咀配置"""

    __tablename__ = "sel_nozzle_config"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    hot_runner_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("sel_hot_runner_system.id", ondelete="CASCADE"),
        nullable=False,
    )
    nozzle_index: Mapped[int] = mapped_column(Integer, nullable=False, server_default="1")

    structure: Mapped[str | None] = mapped_column(String(16), nullable=True)
    heater: Mapped[str | None] = mapped_column(String(16), nullable=True)
    gate_diameter: Mapped[Decimal | None] = mapped_column(Numeric(10, 2), nullable=True)
    tip_material: Mapped[str | None] = mapped_column(String(32), nullable=True)
    tip_coating: Mapped[str | None] = mapped_column(String(32), nullable=True)
    cap_material: Mapped[str | None] = mapped_column(String(32), nullable=True)
    insulator_material: Mapped[str | None] = mapped_column(String(32), nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    hot_runner: Mapped[SelHotRunnerSystem] = relationship(back_populates="nozzles")


class SelValvePinConfig(Base):
    """阀针配置"""

    __tablename__ = "sel_valve_pin_config"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    hot_runner_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("sel_hot_runner_system.id", ondelete="CASCADE"),
        nullable=False,
        unique=True,
    )

    style: Mapped[str | None] = mapped_column(String(8), nullable=True)
    material: Mapped[str | None] = mapped_column(String(32), nullable=True)
    coating: Mapped[str | None] = mapped_column(String(32), nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    hot_runner: Mapped[SelHotRunnerSystem] = relationship(back_populates="valve_pin")


class SelMoldHotRunnerSpec(Base):
    """模具热流道规格（选项字段存 sel_dict_item.id；可参考系统编号为自由文本）。"""

    __tablename__ = "sel_mold_hot_runner_spec"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    mold_info_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("sel_mold_info.id", ondelete="CASCADE"),
        nullable=False,
        unique=True,
    )

    system_glue_storage_modulus_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("sel_dict_item.id", ondelete="RESTRICT"), nullable=True
    )
    main_nozzle_heating_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("sel_dict_item.id", ondelete="RESTRICT"), nullable=True
    )
    main_nozzle_body_material_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("sel_dict_item.id", ondelete="RESTRICT"), nullable=True
    )
    main_nozzle_heater_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("sel_dict_item.id", ondelete="RESTRICT"), nullable=True
    )

    manifold_bridge_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("sel_dict_item.id", ondelete="RESTRICT"), nullable=True
    )
    manifold_material_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("sel_dict_item.id", ondelete="RESTRICT"), nullable=True
    )
    manifold_channel_diameter_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("sel_dict_item.id", ondelete="RESTRICT"), nullable=True
    )
    manifold_nozzle_connection_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("sel_dict_item.id", ondelete="RESTRICT"), nullable=True
    )
    manifold_expansion_calc_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("sel_dict_item.id", ondelete="RESTRICT"), nullable=True
    )
    manifold_plug_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("sel_dict_item.id", ondelete="RESTRICT"), nullable=True
    )
    channel_direction_diagram_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("sel_dict_item.id", ondelete="RESTRICT"), nullable=True
    )

    hot_nozzle_structure_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("sel_dict_item.id", ondelete="RESTRICT"), nullable=True
    )
    hot_nozzle_heater_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("sel_dict_item.id", ondelete="RESTRICT"), nullable=True
    )
    gate_diameter_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("sel_dict_item.id", ondelete="RESTRICT"), nullable=True
    )
    nozzle_core_material_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("sel_dict_item.id", ondelete="RESTRICT"), nullable=True
    )
    nozzle_core_coating_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("sel_dict_item.id", ondelete="RESTRICT"), nullable=True
    )
    nozzle_cap_material_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("sel_dict_item.id", ondelete="RESTRICT"), nullable=True
    )
    insulation_cap_material_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("sel_dict_item.id", ondelete="RESTRICT"), nullable=True
    )

    valve_pin_style_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("sel_dict_item.id", ondelete="RESTRICT"), nullable=True
    )
    valve_pin_material_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("sel_dict_item.id", ondelete="RESTRICT"), nullable=True
    )
    valve_pin_plating_process_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("sel_dict_item.id", ondelete="RESTRICT"), nullable=True
    )

    shipping_water_jacket_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("sel_dict_item.id", ondelete="RESTRICT"), nullable=True
    )
    shipping_protective_sleeve_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("sel_dict_item.id", ondelete="RESTRICT"), nullable=True
    )

    reference_system_number: Mapped[str | None] = mapped_column(String(200), nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    mold: Mapped[SelMoldInfo] = relationship(back_populates="hot_runner_spec")


class SelAssociationRule(Base):
    """关联规则（JSON 字段存触发条件 / 推荐 / 排除）"""

    __tablename__ = "sel_association_rule"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    rule_code: Mapped[str] = mapped_column(String(64), nullable=False, unique=True)
    rule_name: Mapped[str] = mapped_column(String(200), nullable=False)
    trigger_conditions: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    recommendations: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    exclusions: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    reason: Mapped[str | None] = mapped_column(Text, nullable=True)
    priority: Mapped[int] = mapped_column(Integer, nullable=False, server_default="1")
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, server_default="true")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
