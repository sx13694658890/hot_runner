"""Pydantic：模具选型领域表 API（与 sel_* 表、docs/database_schema.sql 对齐）。"""

from __future__ import annotations

from datetime import datetime
from decimal import Decimal
from typing import Any
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

from app.schemas.common import ORMModel


class SelMaterialPropertyRead(ORMModel):
    id: UUID
    mold_temp: str | None
    melt_temp: str | None
    degradation_temp: str | None
    molding_window: int | None
    ejection_temp: str | None
    crystallinity: str | None
    moisture_absorption: str | None
    viscosity: str | None
    metal_corrosion: str | None
    injection_pressure: str | None
    residence_time: str | None


class SelMaterialRead(ORMModel):
    id: UUID
    abbreviation: str
    is_active: bool
    material_property: SelMaterialPropertyRead | None = Field(
        default=None,
        validation_alias="property_row",
    )

    model_config = ConfigDict(from_attributes=True, populate_by_name=True)


class SelProductInfoWrite(BaseModel):
    product_name: str | None = None
    weight: Decimal | None = None
    application_field_id: UUID | None = None
    wall_thickness_id: UUID | None = None
    color_id: UUID | None = None
    color_remark: str | None = None
    surface_finish_id: UUID | None = None
    precision_level_id: UUID | None = None
    mechanical_requirement_id: UUID | None = None
    efficiency_requirement_id: UUID | None = None
    production_batch_id: UUID | None = None


class SelProductInfoRead(ORMModel):
    id: UUID
    mold_info_id: UUID
    product_name: str | None
    weight: Decimal | None
    application_field_id: UUID | None
    application_field_label: str | None = None
    wall_thickness_id: UUID | None
    wall_thickness_label: str | None = None
    color_id: UUID | None
    color_label: str | None = None
    color_remark: str | None = None
    surface_finish_id: UUID | None
    surface_finish_label: str | None = None
    precision_level_id: UUID | None
    precision_level_label: str | None = None
    mechanical_requirement_id: UUID | None
    mechanical_requirement_label: str | None = None
    efficiency_requirement_id: UUID | None
    efficiency_requirement_label: str | None = None
    production_batch_id: UUID | None
    production_batch_label: str | None = None
    created_at: datetime
    updated_at: datetime


class SelNozzleWrite(BaseModel):
    nozzle_index: int = 1
    structure: str | None = None
    heater: str | None = None
    gate_diameter: Decimal | None = None
    tip_material: str | None = None
    tip_coating: str | None = None
    cap_material: str | None = None
    insulator_material: str | None = None


class SelValvePinWrite(BaseModel):
    style: str | None = None
    material: str | None = None
    coating: str | None = None


class SelHotRunnerWrite(BaseModel):
    resin_retention_cycles: str | None = None
    main_nozzle_heating: bool | None = None
    main_nozzle_material: str | None = None
    main_nozzle_heater: str | None = None
    manifold_bridging: bool | None = None
    manifold_material: str | None = None
    manifold_runner_diameter: Decimal | None = None
    manifold_interface: str | None = None
    manifold_calculate_expansion: bool | None = None
    manifold_plug: str | None = None
    manifold_runner_diagram: str | None = None
    nozzles: list[SelNozzleWrite] = Field(default_factory=list)
    valve_pin: SelValvePinWrite | None = None


class SelNozzleRead(ORMModel):
    id: UUID
    hot_runner_id: UUID
    nozzle_index: int
    structure: str | None
    heater: str | None
    gate_diameter: Decimal | None
    tip_material: str | None
    tip_coating: str | None
    cap_material: str | None
    insulator_material: str | None


class SelValvePinRead(ORMModel):
    id: UUID
    hot_runner_id: UUID
    style: str | None
    material: str | None
    coating: str | None


class SelHotRunnerRead(ORMModel):
    id: UUID
    mold_info_id: UUID
    resin_retention_cycles: str | None
    main_nozzle_heating: bool | None
    main_nozzle_material: str | None
    main_nozzle_heater: str | None
    manifold_bridging: bool | None
    manifold_material: str | None
    manifold_runner_diameter: Decimal | None
    manifold_interface: str | None
    manifold_calculate_expansion: bool | None
    manifold_plug: str | None
    manifold_runner_diagram: str | None
    nozzles: list[SelNozzleRead] = Field(default_factory=list)
    valve_pin: SelValvePinRead | None = None


class SelMoldInfoWrite(BaseModel):
    manufacturer: str | None = None
    manager: str | None = None
    manager_phone: str | None = None
    mold_id: str | None = None
    hot_runner_id: str | None = None
    nozzle_count: int | None = None
    cavity_count: int | None = None
    mold_status_id: UUID | None = None
    mold_type_id: UUID | None = None
    locating_ring_eccentric_id: UUID | None = None
    order_requirement_id: UUID | None = None
    hot_runner_type_id: UUID | None = None
    point_numbering_rule_id: UUID | None = None
    driver_type_id: UUID | None = None
    solenoid_valve_id: UUID | None = None
    solenoid_valve_position_id: UUID | None = None
    gate_system_desc_id: UUID | None = None
    mold_core_eject: bool | None = None
    balance_requirement_id: UUID | None = None
    plate_thickness_adjustable: bool | None = None
    runner_plate_style_id: UUID | None = None
    wire_frame_needed: bool | None = None
    solenoid_valve_socket_id: UUID | None = None
    signal_wiring_method_id: UUID | None = None
    cooling_medium_id: UUID | None = None
    water_oil_connector_position_id: UUID | None = None
    has_mold_temp_controller: bool | None = None
    has_temp_controller_id: UUID | None = None
    has_sequence_controller_id: UUID | None = None
    has_booster_pump_id: UUID | None = None
    has_multiple_oil_pumps_id: UUID | None = None
    junction_box_position_id: UUID | None = None
    socket_type_id: UUID | None = None
    socket_pin_count_id: UUID | None = None
    thermocouple_type_id: UUID | None = None
    delivery_wiring_method_id: UUID | None = None
    debug_wiring_method_id: UUID | None = None
    injection_machine_model: str | None = None
    injection_machine_tonnage: int | None = None
    barrel_sphere_radius: Decimal | None = None
    barrel_orifice: Decimal | None = None
    material_id: UUID | None = None


class SelMoldInfoCreate(SelMoldInfoWrite):
    product: SelProductInfoWrite | None = None
    hot_runner: SelHotRunnerWrite | None = None


class SelMoldInfoPatch(SelMoldInfoWrite):
    """PATCH：仅出现的字段更新；可选嵌套整体替换子表。"""

    product: SelProductInfoWrite | None = None
    hot_runner: SelHotRunnerWrite | None = None


class SelMoldInfoRead(ORMModel):
    id: UUID
    manufacturer: str | None
    manager: str | None
    manager_phone: str | None
    mold_id: str | None
    hot_runner_id: str | None
    nozzle_count: int | None
    cavity_count: int | None
    mold_status_id: UUID | None
    mold_status_label: str | None = None
    mold_type_id: UUID | None
    mold_type_label: str | None = None
    locating_ring_eccentric_id: UUID | None
    locating_ring_eccentric_label: str | None = None
    order_requirement_id: UUID | None
    order_requirement_label: str | None = None
    hot_runner_type_id: UUID | None
    hot_runner_type_label: str | None = None
    point_numbering_rule_id: UUID | None
    point_numbering_rule_label: str | None = None
    driver_type_id: UUID | None
    driver_type_label: str | None = None
    solenoid_valve_id: UUID | None
    solenoid_valve_label: str | None = None
    solenoid_valve_position_id: UUID | None
    solenoid_valve_position_label: str | None = None
    gate_system_desc_id: UUID | None
    gate_system_desc_label: str | None = None
    mold_core_eject: bool | None
    balance_requirement_id: UUID | None
    balance_requirement_label: str | None = None
    plate_thickness_adjustable: bool | None
    runner_plate_style_id: UUID | None
    runner_plate_style_label: str | None = None
    wire_frame_needed: bool | None
    solenoid_valve_socket_id: UUID | None
    solenoid_valve_socket_label: str | None = None
    signal_wiring_method_id: UUID | None
    signal_wiring_method_label: str | None = None
    cooling_medium_id: UUID | None
    cooling_medium_label: str | None = None
    water_oil_connector_position_id: UUID | None
    water_oil_connector_position_label: str | None = None
    has_mold_temp_controller: bool | None
    has_temp_controller_id: UUID | None
    has_temp_controller_label: str | None = None
    has_sequence_controller_id: UUID | None
    has_sequence_controller_label: str | None = None
    has_booster_pump_id: UUID | None
    has_booster_pump_label: str | None = None
    has_multiple_oil_pumps_id: UUID | None
    has_multiple_oil_pumps_label: str | None = None
    junction_box_position_id: UUID | None
    junction_box_position_label: str | None = None
    socket_type_id: UUID | None
    socket_type_label: str | None = None
    socket_pin_count_id: UUID | None
    socket_pin_count_label: str | None = None
    thermocouple_type_id: UUID | None
    thermocouple_type_label: str | None = None
    delivery_wiring_method_id: UUID | None
    delivery_wiring_method_label: str | None = None
    debug_wiring_method_id: UUID | None
    debug_wiring_method_label: str | None = None
    injection_machine_model: str | None
    injection_machine_tonnage: int | None
    barrel_sphere_radius: Decimal | None
    barrel_orifice: Decimal | None
    created_at: datetime
    updated_at: datetime
    material_id: UUID | None = None
    material: SelMaterialRead | None = None
    product: SelProductInfoRead | None = None
    hot_runner: SelHotRunnerRead | None = None


class SelAssociationRuleRead(ORMModel):
    id: UUID
    rule_code: str
    rule_name: str
    trigger_conditions: dict[str, Any] | None
    recommendations: dict[str, Any] | None
    exclusions: dict[str, Any] | None
    reason: str | None
    priority: int
    is_active: bool


# ----- 分表列表（扁平行 + 关联展示字段） -----


class SelMaterialMasterRead(ORMModel):
    """材料主表 sel_material（不含属性行）"""

    id: UUID
    abbreviation: str
    is_active: bool
    created_at: datetime


class SelMaterialPropertyFlatRead(SelMaterialPropertyRead):
    """材料属性表 + 关联缩写"""

    material_id: UUID
    abbreviation: str
    created_at: datetime | None = None


class SelProductInfoListRead(SelProductInfoRead):
    """产品信息表 + 所属模具业务字段"""

    mold_number: str | None = Field(None, description="sel_mold_info.mold_id")
    mold_manufacturer: str | None = None
    created_at: datetime | None = None
    updated_at: datetime | None = None


class SelHotRunnerSystemListRead(ORMModel):
    """热流道系统表扁平行 + 模具标识"""

    id: UUID
    mold_info_id: UUID
    resin_retention_cycles: str | None
    main_nozzle_heating: bool | None
    main_nozzle_material: str | None
    main_nozzle_heater: str | None
    manifold_bridging: bool | None
    manifold_material: str | None
    manifold_runner_diameter: Decimal | None
    manifold_interface: str | None
    manifold_calculate_expansion: bool | None
    manifold_plug: str | None
    manifold_runner_diagram: str | None
    created_at: datetime
    updated_at: datetime
    mold_number: str | None = None
    mold_manufacturer: str | None = None


class SelNozzleListRead(SelNozzleRead):
    """热咀配置 + 模具/热流道上下文"""

    mold_number: str | None = None
    mold_manufacturer: str | None = None


class SelValvePinListRead(SelValvePinRead):
    """阀针配置 + 模具上下文"""

    mold_number: str | None = None
    mold_manufacturer: str | None = None


class SelMoldHotRunnerSpecRead(ORMModel):
    """模具热流道规格：字典字段存 UUID，读接口带 *_label；可参考系统编号为自由文本。"""

    id: UUID
    mold_info_id: UUID
    system_glue_storage_modulus_id: UUID | None = None
    system_glue_storage_modulus_label: str | None = None
    main_nozzle_heating_id: UUID | None = None
    main_nozzle_heating_label: str | None = None
    main_nozzle_body_material_id: UUID | None = None
    main_nozzle_body_material_label: str | None = None
    main_nozzle_heater_id: UUID | None = None
    main_nozzle_heater_label: str | None = None
    manifold_bridge_id: UUID | None = None
    manifold_bridge_label: str | None = None
    manifold_material_id: UUID | None = None
    manifold_material_label: str | None = None
    manifold_channel_diameter_id: UUID | None = None
    manifold_channel_diameter_label: str | None = None
    manifold_nozzle_connection_id: UUID | None = None
    manifold_nozzle_connection_label: str | None = None
    manifold_expansion_calc_id: UUID | None = None
    manifold_expansion_calc_label: str | None = None
    manifold_plug_id: UUID | None = None
    manifold_plug_label: str | None = None
    channel_direction_diagram_id: UUID | None = None
    channel_direction_diagram_label: str | None = None
    hot_nozzle_structure_id: UUID | None = None
    hot_nozzle_structure_label: str | None = None
    hot_nozzle_heater_id: UUID | None = None
    hot_nozzle_heater_label: str | None = None
    gate_diameter_id: UUID | None = None
    gate_diameter_label: str | None = None
    nozzle_core_material_id: UUID | None = None
    nozzle_core_material_label: str | None = None
    nozzle_core_coating_id: UUID | None = None
    nozzle_core_coating_label: str | None = None
    nozzle_cap_material_id: UUID | None = None
    nozzle_cap_material_label: str | None = None
    insulation_cap_material_id: UUID | None = None
    insulation_cap_material_label: str | None = None
    valve_pin_style_id: UUID | None = None
    valve_pin_style_label: str | None = None
    valve_pin_material_id: UUID | None = None
    valve_pin_material_label: str | None = None
    valve_pin_plating_process_id: UUID | None = None
    valve_pin_plating_process_label: str | None = None
    shipping_water_jacket_id: UUID | None = None
    shipping_water_jacket_label: str | None = None
    shipping_protective_sleeve_id: UUID | None = None
    shipping_protective_sleeve_label: str | None = None
    reference_system_number: str | None = None
    created_at: datetime
    updated_at: datetime


class SelMoldHotRunnerSpecListRead(SelMoldHotRunnerSpecRead):
    mold_number: str | None = Field(None, description="sel_mold_info.mold_id")
    mold_manufacturer: str | None = None


class SelMoldHotRunnerSpecPatch(BaseModel):
    """部分更新；未出现的字段不改。"""

    model_config = ConfigDict(extra="forbid")

    system_glue_storage_modulus_id: UUID | None = None
    main_nozzle_heating_id: UUID | None = None
    main_nozzle_body_material_id: UUID | None = None
    main_nozzle_heater_id: UUID | None = None
    manifold_bridge_id: UUID | None = None
    manifold_material_id: UUID | None = None
    manifold_channel_diameter_id: UUID | None = None
    manifold_nozzle_connection_id: UUID | None = None
    manifold_expansion_calc_id: UUID | None = None
    manifold_plug_id: UUID | None = None
    channel_direction_diagram_id: UUID | None = None
    hot_nozzle_structure_id: UUID | None = None
    hot_nozzle_heater_id: UUID | None = None
    gate_diameter_id: UUID | None = None
    nozzle_core_material_id: UUID | None = None
    nozzle_core_coating_id: UUID | None = None
    nozzle_cap_material_id: UUID | None = None
    insulation_cap_material_id: UUID | None = None
    valve_pin_style_id: UUID | None = None
    valve_pin_material_id: UUID | None = None
    valve_pin_plating_process_id: UUID | None = None
    shipping_water_jacket_id: UUID | None = None
    shipping_protective_sleeve_id: UUID | None = None
    reference_system_number: str | None = None


class SelMoldHotRunnerSpecPage(BaseModel):
    items: list[SelMoldHotRunnerSpecListRead]
    total: int
