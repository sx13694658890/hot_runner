/**
 * GET /api/v1/selection-catalog/* 响应形状（与 docs/模具选型-领域表-前端对接API文档.md 一致）
 */
import type { UUID } from "@/lib/types";

export interface SelMaterialPropertyRead {
  id: UUID;
  mold_temp: string | null;
  melt_temp: string | null;
  degradation_temp: string | null;
  molding_window: number | null;
  ejection_temp: string | null;
  crystallinity: string | null;
  moisture_absorption: string | null;
  viscosity: string | null;
  metal_corrosion: string | null;
  injection_pressure: string | null;
  residence_time: string | null;
}

export interface SelMaterialRead {
  id: UUID;
  abbreviation: string;
  is_active: boolean;
  material_property: SelMaterialPropertyRead | null;
}

/** GET /selection-catalog/materials-master */
export interface SelMaterialMasterRead {
  id: UUID;
  abbreviation: string;
  is_active: boolean;
  created_at: string;
}

/** GET /selection-catalog/material-properties */
export interface SelMaterialPropertyFlatRead extends SelMaterialPropertyRead {
  material_id: UUID;
  abbreviation: string;
  created_at?: string | null;
}

/** GET /selection-catalog/hot-runner-systems */
export interface SelHotRunnerSystemListRead {
  id: UUID;
  mold_info_id: UUID;
  resin_retention_cycles: string | null;
  main_nozzle_heating: boolean | null;
  main_nozzle_material: string | null;
  main_nozzle_heater: string | null;
  manifold_bridging: boolean | null;
  manifold_material: string | null;
  manifold_runner_diameter: string | null;
  manifold_interface: string | null;
  manifold_calculate_expansion: boolean | null;
  manifold_plug: string | null;
  manifold_runner_diagram: string | null;
  created_at: string;
  updated_at: string;
  mold_number: string | null;
  mold_manufacturer: string | null;
}

/** GET /selection-catalog/mold-hot-runner-specs 列表项（字典 UUID + *_label + 模具标识） */
export interface SelMoldHotRunnerSpecListRead {
  id: UUID;
  mold_info_id: UUID;
  system_glue_storage_modulus_id: UUID | null;
  system_glue_storage_modulus_label: string | null;
  main_nozzle_heating_id: UUID | null;
  main_nozzle_heating_label: string | null;
  main_nozzle_body_material_id: UUID | null;
  main_nozzle_body_material_label: string | null;
  main_nozzle_heater_id: UUID | null;
  main_nozzle_heater_label: string | null;
  manifold_bridge_id: UUID | null;
  manifold_bridge_label: string | null;
  manifold_material_id: UUID | null;
  manifold_material_label: string | null;
  manifold_channel_diameter_id: UUID | null;
  manifold_channel_diameter_label: string | null;
  manifold_nozzle_connection_id: UUID | null;
  manifold_nozzle_connection_label: string | null;
  manifold_expansion_calc_id: UUID | null;
  manifold_expansion_calc_label: string | null;
  manifold_plug_id: UUID | null;
  manifold_plug_label: string | null;
  channel_direction_diagram_id: UUID | null;
  channel_direction_diagram_label: string | null;
  hot_nozzle_structure_id: UUID | null;
  hot_nozzle_structure_label: string | null;
  hot_nozzle_heater_id: UUID | null;
  hot_nozzle_heater_label: string | null;
  gate_diameter_id: UUID | null;
  gate_diameter_label: string | null;
  nozzle_core_material_id: UUID | null;
  nozzle_core_material_label: string | null;
  nozzle_core_coating_id: UUID | null;
  nozzle_core_coating_label: string | null;
  nozzle_cap_material_id: UUID | null;
  nozzle_cap_material_label: string | null;
  insulation_cap_material_id: UUID | null;
  insulation_cap_material_label: string | null;
  valve_pin_style_id: UUID | null;
  valve_pin_style_label: string | null;
  valve_pin_material_id: UUID | null;
  valve_pin_material_label: string | null;
  valve_pin_plating_process_id: UUID | null;
  valve_pin_plating_process_label: string | null;
  shipping_water_jacket_id: UUID | null;
  shipping_water_jacket_label: string | null;
  shipping_protective_sleeve_id: UUID | null;
  shipping_protective_sleeve_label: string | null;
  reference_system_number: string | null;
  created_at: string;
  updated_at: string;
  mold_number: string | null;
  mold_manufacturer: string | null;
}

/** GET /selection-catalog/mold-hot-runner-specs 分页体 */
export interface SelMoldHotRunnerSpecPage {
  items: SelMoldHotRunnerSpecListRead[];
  total: number;
}

/** PATCH /selection-catalog/mold-hot-runner-specs/{id}（仅提交需更新的字段） */
export type SelMoldHotRunnerSpecPatch = Partial<{
  system_glue_storage_modulus_id: UUID | null;
  main_nozzle_heating_id: UUID | null;
  main_nozzle_body_material_id: UUID | null;
  main_nozzle_heater_id: UUID | null;
  manifold_bridge_id: UUID | null;
  manifold_material_id: UUID | null;
  manifold_channel_diameter_id: UUID | null;
  manifold_nozzle_connection_id: UUID | null;
  manifold_expansion_calc_id: UUID | null;
  manifold_plug_id: UUID | null;
  channel_direction_diagram_id: UUID | null;
  hot_nozzle_structure_id: UUID | null;
  hot_nozzle_heater_id: UUID | null;
  gate_diameter_id: UUID | null;
  nozzle_core_material_id: UUID | null;
  nozzle_core_coating_id: UUID | null;
  nozzle_cap_material_id: UUID | null;
  insulation_cap_material_id: UUID | null;
  valve_pin_style_id: UUID | null;
  valve_pin_material_id: UUID | null;
  valve_pin_plating_process_id: UUID | null;
  shipping_water_jacket_id: UUID | null;
  shipping_protective_sleeve_id: UUID | null;
  reference_system_number: string | null;
}>;

/** GET /selection-catalog/nozzle-configs */
export interface SelNozzleListRead extends SelNozzleRead {
  mold_number: string | null;
  mold_manufacturer: string | null;
}

/** GET /selection-catalog/valve-pin-configs */
export interface SelValvePinListRead extends SelValvePinRead {
  mold_number: string | null;
  mold_manufacturer: string | null;
}

export interface SelAssociationRuleRead {
  id: UUID;
  rule_code: string;
  rule_name: string;
  trigger_conditions: Record<string, unknown> | null;
  recommendations: Record<string, unknown> | null;
  exclusions: Record<string, unknown> | null;
  reason: string | null;
  priority: number;
  is_active: boolean;
}

export interface SelProductInfoRead {
  id: UUID;
  mold_info_id: UUID;
  product_name: string | null;
  /** Decimal 序列化常为 string；部分环境可能为 number */
  weight: string | number | null;
  application_field_id: UUID | null;
  application_field_label: string | null;
  wall_thickness_id: UUID | null;
  wall_thickness_label: string | null;
  color_id: UUID | null;
  color_label: string | null;
  color_remark: string | null;
  surface_finish_id: UUID | null;
  surface_finish_label: string | null;
  precision_level_id: UUID | null;
  precision_level_label: string | null;
  mechanical_requirement_id: UUID | null;
  mechanical_requirement_label: string | null;
  efficiency_requirement_id: UUID | null;
  efficiency_requirement_label: string | null;
  production_batch_id: UUID | null;
  production_batch_label: string | null;
  created_at: string;
  updated_at: string;
}

/** GET /selection-catalog/product-infos */
export interface SelProductInfoListRead extends SelProductInfoRead {
  mold_number: string | null;
  mold_manufacturer: string | null;
}

export interface SelNozzleRead {
  id: UUID;
  hot_runner_id: UUID;
  nozzle_index: number;
  structure: string | null;
  heater: string | null;
  gate_diameter: string | null;
  tip_material: string | null;
  tip_coating: string | null;
  cap_material: string | null;
  insulator_material: string | null;
}

export interface SelValvePinRead {
  id: UUID;
  hot_runner_id: UUID;
  style: string | null;
  material: string | null;
  coating: string | null;
}

export interface SelHotRunnerRead {
  id: UUID;
  mold_info_id: UUID;
  resin_retention_cycles: string | null;
  main_nozzle_heating: boolean | null;
  main_nozzle_material: string | null;
  main_nozzle_heater: string | null;
  manifold_bridging: boolean | null;
  manifold_material: string | null;
  manifold_runner_diameter: string | null;
  manifold_interface: string | null;
  manifold_calculate_expansion: boolean | null;
  manifold_plug: string | null;
  manifold_runner_diagram: string | null;
  nozzles: SelNozzleRead[];
  valve_pin: SelValvePinRead | null;
}

/** 列表项中 product / hot_runner 可为 null；字典字段存 UUID，展示用 *_label */
export interface SelMoldInfoRead {
  id: UUID;
  manufacturer: string | null;
  manager: string | null;
  manager_phone: string | null;
  mold_id: string | null;
  hot_runner_id: string | null;
  nozzle_count: number | null;
  cavity_count: number | null;
  mold_status_id: UUID | null;
  mold_status_label: string | null;
  mold_type_id: UUID | null;
  mold_type_label: string | null;
  locating_ring_eccentric_id: UUID | null;
  locating_ring_eccentric_label: string | null;
  order_requirement_id: UUID | null;
  order_requirement_label: string | null;
  hot_runner_type_id: UUID | null;
  hot_runner_type_label: string | null;
  point_numbering_rule_id: UUID | null;
  point_numbering_rule_label: string | null;
  driver_type_id: UUID | null;
  driver_type_label: string | null;
  solenoid_valve_id: UUID | null;
  solenoid_valve_label: string | null;
  solenoid_valve_position_id: UUID | null;
  solenoid_valve_position_label: string | null;
  gate_system_desc_id: UUID | null;
  gate_system_desc_label: string | null;
  mold_core_eject: boolean | null;
  balance_requirement_id: UUID | null;
  balance_requirement_label: string | null;
  plate_thickness_adjustable: boolean | null;
  runner_plate_style_id: UUID | null;
  runner_plate_style_label: string | null;
  wire_frame_needed: boolean | null;
  solenoid_valve_socket_id: UUID | null;
  solenoid_valve_socket_label: string | null;
  signal_wiring_method_id: UUID | null;
  signal_wiring_method_label: string | null;
  cooling_medium_id: UUID | null;
  cooling_medium_label: string | null;
  water_oil_connector_position_id: UUID | null;
  water_oil_connector_position_label: string | null;
  has_mold_temp_controller: boolean | null;
  has_temp_controller_id: UUID | null;
  has_temp_controller_label: string | null;
  has_sequence_controller_id: UUID | null;
  has_sequence_controller_label: string | null;
  has_booster_pump_id: UUID | null;
  has_booster_pump_label: string | null;
  has_multiple_oil_pumps_id: UUID | null;
  has_multiple_oil_pumps_label: string | null;
  junction_box_position_id: UUID | null;
  junction_box_position_label: string | null;
  socket_type_id: UUID | null;
  socket_type_label: string | null;
  socket_pin_count_id: UUID | null;
  socket_pin_count_label: string | null;
  thermocouple_type_id: UUID | null;
  thermocouple_type_label: string | null;
  delivery_wiring_method_id: UUID | null;
  delivery_wiring_method_label: string | null;
  debug_wiring_method_id: UUID | null;
  debug_wiring_method_label: string | null;
  injection_machine_model: string | null;
  injection_machine_tonnage: number | null;
  barrel_sphere_radius: string | null;
  barrel_orifice: string | null;
  created_at: string;
  updated_at: string;
  material_id: UUID | null;
  /** 详情/编辑加载时嵌套；列表接口常为 null */
  material: SelMaterialRead | null;
  product: SelProductInfoRead | null;
  hot_runner: SelHotRunnerRead | null;
}

/** GET /selection-catalog/dict/mold-options 与 dict/hot-runner-spec-options（结构相同） */
export interface MoldDictBundleResponse {
  categories: Record<string, { id: UUID; label: string; sort_order: number }[]>;
}

export interface SelDictCategoryRead {
  id: UUID;
  code: string;
  label: string;
  sort_order: number;
}

/** POST /selection-catalog/dict/categories */
export interface SelDictCategoryCreateBody {
  code: string;
  label: string;
  sort_order: number;
}

/** PATCH /selection-catalog/dict/categories/{id} */
export interface SelDictCategoryPatchBody {
  code?: string;
  label?: string;
  sort_order?: number;
}

export interface SelDictItemRead {
  id: UUID;
  category_id: UUID;
  label: string;
  sort_order: number;
  is_active: boolean;
  created_at: string;
}
