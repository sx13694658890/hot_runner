/**
 * SelMoldInfoCreate / PATCH 请求体拼装（对齐 backend SelMoldInfoWrite + 嵌套）
 */
import {
  DRV_CATEGORY_FALLBACK_LABELS,
  DRV_CATEGORY_ORDER,
  drvCategoryCodeToWizardRootKey,
  DRV_WIZARD_ROOT_ID_KEYS,
} from "@/features/selection-catalog/driveSystemDetailDictMeta";
import {
  HNZ_CATEGORY_FALLBACK_LABELS,
  HNZ_CATEGORY_ORDER,
  hnzCategoryCodeToWizardRootKey,
  HNZ_WIZARD_ROOT_ID_KEYS,
} from "@/features/selection-catalog/hotNozzleDetailDictMeta";
import {
  MFLD_CATEGORY_FALLBACK_LABELS,
  MFLD_MANIFOLD_BODY_CATEGORY_ORDER,
  MFLD_MANIFOLD_BODY_TEXT_PARTS,
  MFLD_MANIFOLD_MAIN_BODY_TEXT_KEYS,
  MFLD_MANIFOLD_NORMAL_BODY_TEXT_KEYS,
  MFLD_MANIFOLD_NORMAL_ROOT_ID_KEYS,
  mfldBodyTextFieldKey,
  mfldCategoryCodeToWizardNormalRootKey,
} from "@/features/selection-catalog/manifoldDetailDictMeta";
import type { SelMoldInfoRead, SelProductInfoRead } from "@/lib/selectionCatalogTypes";

const WIZARD_MFLD_NORMAL_ID_LABEL_OVERRIDES: Partial<Record<string, string>> = Object.fromEntries(
  MFLD_MANIFOLD_BODY_CATEGORY_ORDER.map((code) => [
    mfldCategoryCodeToWizardNormalRootKey(code),
    MFLD_CATEGORY_FALLBACK_LABELS[code] ?? code,
  ]),
);

const WIZARD_MFLD_BODY_TEXT_LABEL_OVERRIDES: Partial<Record<string, string>> = Object.fromEntries(
  MFLD_MANIFOLD_BODY_TEXT_PARTS.flatMap(({ part, label }) => [
    [mfldBodyTextFieldKey(part, "main"), label],
    [mfldBodyTextFieldKey(part, "normal"), label],
  ]),
);

const WIZARD_HNZ_ID_LABEL_OVERRIDES: Partial<Record<string, string>> = Object.fromEntries(
  HNZ_CATEGORY_ORDER.map((code) => [
    hnzCategoryCodeToWizardRootKey(code),
    HNZ_CATEGORY_FALLBACK_LABELS[code] ?? code,
  ]),
);

const WIZARD_DRV_ID_LABEL_OVERRIDES: Partial<Record<string, string>> = Object.fromEntries(
  DRV_CATEGORY_ORDER.map((code) => [
    drvCategoryCodeToWizardRootKey(code),
    DRV_CATEGORY_FALLBACK_LABELS[code] ?? code,
  ]),
);

export type TriBool = "" | "true" | "false";

export interface MoldAggregateFormState {
  /** 根部文本 / 数字（输入框一律 string） */
  root: Record<string, string>;
  /** 根部可选布尔（null = 未选） */
  rootBool: Record<string, TriBool>;
  /** 关联材料 UUID（POST 可省略；PATCH 空字符串表示清空为 null） */
  materialId: string;
  includeProduct: boolean;
  product: Record<string, string>;
}

/** 自由文本 / 数字（非字典 UUID） */
const ROOT_KEYS_FREE_TEXT: (keyof SelMoldInfoRead)[] = [
  "manufacturer",
  "manager",
  "manager_phone",
  "mold_id",
  "hot_runner_id",
  "injection_machine_model",
];

/** 根部字典字段：提交为 UUID 字符串，对应后端 *_id 列 */
const ROOT_KEYS_DICT_UUID: (keyof SelMoldInfoRead)[] = [
  "mold_status_id",
  "mold_type_id",
  "locating_ring_eccentric_id",
  "order_requirement_id",
  "hot_runner_type_id",
  "hot_runner_system_ownership_id",
  "point_numbering_rule_id",
  "driver_type_id",
  "solenoid_valve_id",
  "solenoid_valve_position_id",
  "gate_system_desc_id",
  "balance_requirement_id",
  "runner_plate_style_id",
  "solenoid_valve_socket_id",
  "signal_wiring_method_id",
  "cooling_medium_id",
  "water_oil_connector_position_id",
  "has_temp_controller_id",
  "has_sequence_controller_id",
  "has_booster_pump_id",
  "has_multiple_oil_pumps_id",
  "junction_box_position_id",
  "socket_type_id",
  "socket_pin_count_id",
  "thermocouple_type_id",
  "delivery_wiring_method_id",
  "debug_wiring_method_id",
  "injection_machine_brand_id",
  "customer_equipment_library_id",
];

/** 注塑机型号目录 UUID（非 mold-options，见 GET …/injection-machine-models） */
const ROOT_KEYS_INJECTION_CATALOG_UUID: (keyof SelMoldInfoRead)[] = ["injection_machine_model_id"];

export const MOLD_ROOT_DICT_FIELD_KEYS = new Set<string>(
  ROOT_KEYS_DICT_UUID as unknown as string[],
);

const ROOT_KEYS_INT: (keyof SelMoldInfoRead)[] = ["nozzle_count", "cavity_count", "injection_machine_tonnage"];

const ROOT_KEYS_DEC: (keyof SelMoldInfoRead)[] = ["barrel_sphere_radius", "barrel_orifice"];

const ROOT_KEYS_BOOL: (keyof SelMoldInfoRead)[] = [
  "mold_core_eject",
  "plate_thickness_adjustable",
  "wire_frame_needed",
  "has_mold_temp_controller",
];

/** 自由文本（截图中带冒号项） */
const PRODUCT_KEYS_FREE_TEXT = ["product_name", "color_remark"] as const;

const PRODUCT_KEYS_DEC = ["weight"] as const;

/** 选型字典 UUID，对应 mold-options 中 product_* 分类 */
const PRODUCT_KEYS_DICT_UUID: (keyof SelProductInfoRead)[] = [
  "application_field_id",
  "wall_thickness_id",
  "color_id",
  "surface_finish_id",
  "precision_level_id",
  "mechanical_requirement_id",
  "efficiency_requirement_id",
  "production_batch_id",
];

export const PRODUCT_DICT_FIELD_KEYS = new Set<string>(
  PRODUCT_KEYS_DICT_UUID as unknown as string[],
);

function s(v: unknown): string {
  if (v === null || v === undefined) return "";
  return String(v);
}

function triFromBool(v: boolean | null | undefined): TriBool {
  if (v === null || v === undefined) return "";
  return v ? "true" : "false";
}

function parseTriBool(t: TriBool): boolean | null {
  if (t === "") return null;
  return t === "true";
}

function parseOptionalInt(raw: string): number | undefined {
  const t = raw.trim();
  if (t === "") return undefined;
  const n = Number.parseInt(t, 10);
  return Number.isFinite(n) ? n : undefined;
}

function parseOptionalFloat(raw: string): number | undefined {
  const t = raw.trim();
  if (t === "") return undefined;
  const n = Number.parseFloat(t);
  return Number.isFinite(n) ? n : undefined;
}

export function emptyMoldForm(): MoldAggregateFormState {
  const root: Record<string, string> = {};
  for (const k of ROOT_KEYS_FREE_TEXT) root[k as string] = "";
  for (const k of ROOT_KEYS_DICT_UUID) root[k as string] = "";
  for (const k of ROOT_KEYS_INJECTION_CATALOG_UUID) root[k as string] = "";
  for (const k of ROOT_KEYS_INT) root[k as string] = "";
  for (const k of ROOT_KEYS_DEC) root[k as string] = "";
  const rootBool: Record<string, TriBool> = {};
  for (const k of ROOT_KEYS_BOOL) rootBool[k as string] = "";

  const product: Record<string, string> = {};
  for (const k of PRODUCT_KEYS_FREE_TEXT) product[k as string] = "";
  for (const k of PRODUCT_KEYS_DEC) product[k as string] = "";
  for (const k of PRODUCT_KEYS_DICT_UUID) product[k as string] = "";

  return {
    root,
    rootBool,
    materialId: "",
    includeProduct: false,
    product,
  };
}

export function moldReadToForm(m: SelMoldInfoRead): MoldAggregateFormState {
  const base = emptyMoldForm();
  base.materialId = m.material_id ? String(m.material_id) : "";
  for (const k of ROOT_KEYS_FREE_TEXT) base.root[k as string] = s(m[k]);
  for (const k of ROOT_KEYS_DICT_UUID) base.root[k as string] = s(m[k]);
  for (const k of ROOT_KEYS_INJECTION_CATALOG_UUID) base.root[k as string] = s(m[k]);
  for (const k of ROOT_KEYS_INT) base.root[k as string] = m[k] == null ? "" : String(m[k]);
  for (const k of ROOT_KEYS_DEC) base.root[k as string] = s(m[k]);
  for (const k of ROOT_KEYS_BOOL) base.rootBool[k as string] = triFromBool(m[k] as boolean | null);

  base.includeProduct = !!m.product;
  if (m.product) {
    const p = m.product;
    for (const k of PRODUCT_KEYS_FREE_TEXT) base.product[k as string] = s(p[k]);
    base.product.weight = p.weight == null ? "" : String(p.weight);
    for (const k of PRODUCT_KEYS_DICT_UUID) base.product[k as string] = s(p[k]);
  }

  return base;
}

function buildRootPayload(st: MoldAggregateFormState, forPatch: boolean): Record<string, unknown> {
  const o: Record<string, unknown> = {};
  for (const k of ROOT_KEYS_FREE_TEXT) {
    const v = st.root[k as string]?.trim();
    if (v) o[k as string] = v;
  }
  for (const k of ROOT_KEYS_DICT_UUID) {
    const v = st.root[k as string]?.trim();
    if (v) o[k as string] = v;
  }
  const imCatalog = st.root.injection_machine_model_id?.trim() ?? "";
  if (imCatalog) {
    o.injection_machine_model_id = imCatalog;
  } else if (forPatch) {
    o.injection_machine_model_id = null;
  }
  for (const k of ROOT_KEYS_INT) {
    const n = parseOptionalInt(st.root[k as string] ?? "");
    if (n !== undefined) o[k as string] = n;
  }
  for (const k of ROOT_KEYS_DEC) {
    const n = parseOptionalFloat(st.root[k as string] ?? "");
    if (n !== undefined) o[k as string] = n;
  }
  for (const k of ROOT_KEYS_BOOL) {
    const t = st.rootBool[k as string];
    if (t !== "") o[k as string] = parseTriBool(t);
  }
  const mid = st.materialId?.trim() ?? "";
  if (mid) {
    o.material_id = mid;
  } else if (forPatch) {
    o.material_id = null;
  }
  return o;
}

function buildProductPayload(st: MoldAggregateFormState): Record<string, unknown> | undefined {
  if (!st.includeProduct) return undefined;
  const o: Record<string, unknown> = {};
  for (const k of PRODUCT_KEYS_FREE_TEXT) {
    const v = st.product[k as string]?.trim();
    if (v) o[k as string] = v;
  }
  const w = parseOptionalFloat(st.product.weight ?? "");
  if (w !== undefined) o.weight = w;
  for (const k of PRODUCT_KEYS_DICT_UUID) {
    const v = st.product[k as string]?.trim();
    if (v) o[k as string] = v;
  }
  return Object.keys(o).length ? o : {};
}

/** POST /mold-infos（不含 hot_runner：热流道由档案映射或其它流程生成） */
export function formToCreateBody(st: MoldAggregateFormState): Record<string, unknown> {
  const body: Record<string, unknown> = buildRootPayload(st, false);
  const product = buildProductPayload(st);
  if (product && Object.keys(product).length > 0) body.product = product;
  return body;
}

/** PATCH：提交当前表单中非空字段；嵌套 product 若勾选则整体发送 */
export function formToPatchBody(st: MoldAggregateFormState): Record<string, unknown> {
  const body: Record<string, unknown> = buildRootPayload(st, true);
  if (st.includeProduct) {
    body.product = buildProductPayload(st) ?? {};
  }
  return body;
}

/** 截图约定：带冒号为自由输入；其余为下拉（或布尔三态） */
export const MOLD_ROOT_FREE_INPUT_KEYS = new Set<string>([
  "manufacturer",
  "manager",
  "manager_phone",
  "mold_id",
  "hot_runner_id",
  "nozzle_count",
  "cavity_count",
  "injection_machine_model",
  "injection_machine_tonnage",
  "barrel_sphere_radius",
  "barrel_orifice",
]);

/** 表单渲染顺序与文案（字典字段 key 与 API 字段一致，选项来自后端 mold-options） */
export const MOLD_ROOT_FIELD_META: {
  key: string;
  label: string;
  kind: "text" | "int" | "dec" | "tri";
}[] = [
  ["manufacturer", "模具制造商", "text"],
  ["manager", "负责人", "text"],
  ["manager_phone", "负责人电话", "text"],
  ["mold_id", "模具编号", "text"],
  ["hot_runner_id", "热流道系统编号", "text"],
  ["nozzle_count", "热咀数量", "int"],
  ["cavity_count", "产品腔数", "int"],
  ["mold_status_id", "模具状态", "text"],
  ["mold_type_id", "模具类型", "text"],
  ["locating_ring_eccentric_id", "定位环偏心", "text"],
  ["order_requirement_id", "订单需求", "text"],
  ["hot_runner_type_id", "热流道类型", "text"],
  ["point_numbering_rule_id", "点位编号规则", "text"],
  ["driver_type_id", "驱动器", "text"],
  ["solenoid_valve_id", "电磁阀", "text"],
  ["solenoid_valve_position_id", "电磁阀位置", "text"],
  ["gate_system_desc_id", "进胶系统描述", "text"],
  ["mold_core_eject", "模仁是否需要弹开", "tri"],
  ["balance_requirement_id", "平衡性要求", "text"],
  ["plate_thickness_adjustable", "模板厚度可调", "tri"],
  ["runner_plate_style_id", "流道板样式", "text"],
  ["wire_frame_needed", "线架", "tri"],
  ["solenoid_valve_socket_id", "电磁阀插座型号", "text"],
  ["signal_wiring_method_id", "信号线接线方式", "text"],
  ["cooling_medium_id", "模具冷却介质", "text"],
  ["water_oil_connector_position_id", "水路油路接头位置", "text"],
  ["has_mold_temp_controller", "客户是否有模温机", "tri"],
  ["has_temp_controller_id", "客户是否有温控器", "text"],
  ["has_sequence_controller_id", "客户是否有时序控制器", "text"],
  ["has_booster_pump_id", "客户是否有增压泵", "text"],
  ["has_multiple_oil_pumps_id", "客户是否有多个油压泵", "text"],
  ["junction_box_position_id", "接线盒位置", "text"],
  ["socket_type_id", "插座类型", "text"],
  ["socket_pin_count_id", "插座芯数", "text"],
  ["thermocouple_type_id", "感温线型号", "text"],
  ["delivery_wiring_method_id", "交付接线方式", "text"],
  ["debug_wiring_method_id", "调机接线方式", "text"],
  ["injection_machine_tonnage", "注塑机吨位(t)", "int"],
  ["barrel_sphere_radius", "炮筒球半径(mm)", "dec"],
  ["barrel_orifice", "炮筒出胶孔(mm)", "dec"],
].map(([key, label, kind]) => ({
  key,
  label,
  kind: kind as "text" | "int" | "dec" | "tri",
}));

/** 已由「注塑机品牌→型号→参数」卡片单独渲染，勿在大网格重复 */
export const MOLD_ROOT_INJECTION_METAS_EXCLUDED = new Set<string>([
  "injection_machine_brand_id",
  "customer_equipment_library_id",
  "injection_machine_model",
]);

/** 字典字段 meta.key → mold-options 分类 code（去掉末尾 _id） */
export function moldDictCategoryCode(fieldKey: string): string {
  return fieldKey.replace(/_id$/, "");
}

/** 产品信息字典：列名 → mold-options 分类 code（与后端 PRODUCT_DICT_COLUMN_TO_CATEGORY 一致） */
export function productDictCategoryCode(fieldKey: string): string {
  const map: Record<string, string> = {
    application_field_id: "product_application_field",
    wall_thickness_id: "product_wall_thickness",
    color_id: "product_color",
    surface_finish_id: "product_surface_finish",
    precision_level_id: "product_precision_level",
    mechanical_requirement_id: "product_mechanical_requirement",
    efficiency_requirement_id: "product_efficiency_requirement",
    production_batch_id: "product_production_batch",
  };
  return map[fieldKey] ?? moldDictCategoryCode(fieldKey);
}

/** 选型向导第 3 步：与模具根表字段对齐；板厚与旧模改制勾选项为向导扩展键（后续落库可映射） */
export const WIZARD_MOLD_ROOT_STRING_KEYS = [
  "mold_id",
  "mold_status_id",
  "mold_type_id",
  "locating_ring_eccentric_id",
  "runner_plate_style_id",
  "cooling_medium_id",
  "water_oil_connector_position_id",
  "has_temp_controller_id",
  "has_sequence_controller_id",
  "has_booster_pump_id",
  "has_multiple_oil_pumps_id",
  "wizard_cylinder_plate_thickness",
  "wizard_hot_runner_plate_thickness",
  "wizard_disallow_add_iron",
  "wizard_disallow_reduce_iron",
  "injection_machine_brand_id",
  "injection_machine_model_id",
  "customer_equipment_library_id",
  "hot_runner_id",
  "nozzle_count",
  "hot_runner_type_id",
  "gate_system_desc_id",
  "hot_runner_system_ownership_id",
  "point_numbering_rule_id",
  "driver_type_id",
  "solenoid_valve_id",
  "solenoid_valve_socket_id",
  "signal_wiring_method_id",
  "junction_box_position_id",
  "socket_type_id",
  "socket_pin_count_id",
  "thermocouple_type_id",
  "delivery_wiring_method_id",
  "debug_wiring_method_id",
  "wizard_valve_pin_style_id",
  /** 第 5 步模流/流道直径（选型字典 UUID，仅存向导草稿） */
  "wizard_cae_main_nozzle_channel_diameter_id",
  "wizard_cae_bridge_channel_diameter_id",
  "wizard_cae_manifold_runner_diameter_id",
  "wizard_cae_normal_hot_nozzle_structure_id",
  "wizard_cae_hot_nozzle_runner_diameter_id",
  "wizard_cae_gate_diameter_id",
  /** 第 7 步：主射咀各大类字典项 UUID（GET …/dict/main-nozzle-detail-options，每分类一个下拉） */
  "wizard_mnz_body_heated_id",
  "wizard_mnz_body_unheated_id",
  "wizard_mnz_other_id",
  "wizard_mnz_sr_ball_id",
  "wizard_mnz_main_heater_id",
  "wizard_mnz_thermocouple_style_id",
  "wizard_mnz_body_material_id",
  /** 第 8 步：分流板各大类字典项 UUID（GET …/dict/manifold-detail-options，每分类一个下拉） */
  "wizard_mfld_process_id",
  "wizard_mfld_bridge_material_id",
  "wizard_mfld_bridge_style_id",
  "wizard_mfld_bridge_channel_diameter_id",
  "wizard_mfld_manifold_thickness_id",
  "wizard_mfld_runner_layout_id",
  "wizard_mfld_point_coding_id",
  "wizard_mfld_manifold_runner_diameter_id",
  "wizard_mfld_runner_layers_id",
  "wizard_mfld_spacer_block_id",
  "wizard_mfld_plate_disc_spring_id",
  "wizard_mfld_center_locating_pin_id",
  "wizard_mfld_anti_rotation_pin_id",
  "wizard_mfld_plug_regular_id",
  "wizard_mfld_plug_flat_id",
  "wizard_mfld_plug_insert_basic_id",
  "wizard_mfld_plug_insert_t_id",
  "wizard_mfld_plug_insert_i_id",
  "wizard_mfld_plug_insert_l_id",
  "wizard_mfld_water_connector_id",
  "wizard_mfld_oil_connector_id",
  "wizard_mfld_rule_label_id",
  "wizard_mfld_water_page_id",
  /** 第 8 步法向分流板：与主体同构，复用 hrspec_mfld_* 选项，独立 UUID 草稿键 */
  ...MFLD_MANIFOLD_NORMAL_ROOT_ID_KEYS,
  /** 第 8 步分流板主体 / 法向分流板：补充文本（非字典） */
  ...MFLD_MANIFOLD_MAIN_BODY_TEXT_KEYS,
  ...MFLD_MANIFOLD_NORMAL_BODY_TEXT_KEYS,
  /** 第 9 步：热咀各大类字典项 UUID（GET …/dict/hot-nozzle-detail-options，每分类一个下拉） */
  ...HNZ_WIZARD_ROOT_ID_KEYS,
  /** 第 9 步：驱动系统字典项 UUID（GET …/dict/drive-system-detail-options） */
  ...DRV_WIZARD_ROOT_ID_KEYS,
] as const;

export const WIZARD_MOLD_TRIBOOL_KEYS = [
  "mold_core_eject",
  "plate_thickness_adjustable",
  "has_mold_temp_controller",
  "wire_frame_needed",
] as const;

export type WizardMoldForm = {
  root: Record<string, string>;
  rootBool: Record<string, TriBool>;
};

export function emptyWizardMold(): WizardMoldForm {
  const root: Record<string, string> = {};
  for (const k of WIZARD_MOLD_ROOT_STRING_KEYS) root[k] = "";
  const rootBool: Record<string, TriBool> = {};
  for (const k of WIZARD_MOLD_TRIBOOL_KEYS) rootBool[k] = "";
  return { root, rootBool };
}

/** 向导里与模具编辑页文案略有不同的标签 */
export const WIZARD_MOLD_LABEL_OVERRIDES: Partial<Record<string, string>> = {
  wizard_cylinder_plate_thickness: "气缸板厚度",
  wizard_hot_runner_plate_thickness: "热流道板厚度",
  has_temp_controller_id: "客户是否有温控箱",
  injection_machine_brand_id: "注塑机品牌",
  injection_machine_model_id: "注塑机型号",
  customer_equipment_library_id: "客户设备库",
  runner_plate_style_id: "分流板描述",
  hot_runner_system_ownership_id: "热流道系统所有权",
  wizard_valve_pin_style_id: "阀针样式",
  wizard_cae_main_nozzle_channel_diameter_id: "主射咀流道直径",
  wizard_cae_bridge_channel_diameter_id: "桥流道直径",
  wizard_cae_manifold_runner_diameter_id: "主分流板流道直径",
  wizard_cae_normal_hot_nozzle_structure_id: "法向热咀",
  wizard_cae_hot_nozzle_runner_diameter_id: "热咀流道直径",
  wizard_cae_gate_diameter_id: "胶口直径",
  wizard_mnz_body_heated_id: "主射咀本体-加热型",
  wizard_mnz_body_unheated_id: "主射咀本体-不加热型",
  wizard_mnz_other_id: "其他配件",
  wizard_mnz_sr_ball_id: "SR球头",
  wizard_mnz_main_heater_id: "主射咀加热器",
  wizard_mnz_thermocouple_style_id: "感温线样式",
  wizard_mnz_body_material_id: "主射咀本体材质",
  wizard_mfld_process_id: "属性类-工艺",
  wizard_mfld_bridge_material_id: "属性类-分流板材质",
  wizard_mfld_bridge_style_id: "桥板-分流板搭桥样式",
  wizard_mfld_bridge_channel_diameter_id: "桥板-桥流道直径",
  wizard_mfld_manifold_thickness_id: "分流板厚度",
  wizard_mfld_runner_layout_id: "流道走向示意图（分流板主体）",
  wizard_mfld_point_coding_id: "点位编码",
  wizard_mfld_manifold_runner_diameter_id: "分流板流道直径（分流板主体）",
  wizard_mfld_runner_layers_id: "流道层数",
  wizard_mfld_spacer_block_id: "垫块",
  wizard_mfld_plate_disc_spring_id: "板上碟簧",
  wizard_mfld_center_locating_pin_id: "中心定位销",
  wizard_mfld_anti_rotation_pin_id: "防转销",
  wizard_mfld_plug_regular_id: "堵头-常规堵头",
  wizard_mfld_plug_flat_id: "堵头-平面堵头",
  wizard_mfld_plug_insert_basic_id: "堵头-镶件堵头-基本型",
  wizard_mfld_plug_insert_t_id: "堵头-镶件堵头-T型",
  wizard_mfld_plug_insert_i_id: "堵头-镶件堵头-I型",
  wizard_mfld_plug_insert_l_id: "堵头-镶件堵头-L型",
  wizard_mfld_water_connector_id: "线架-水接头",
  wizard_mfld_oil_connector_id: "线架-油接头",
  wizard_mfld_rule_label_id: "线架-规格标牌",
  wizard_mfld_water_page_id: "线架-水路版",
  ...WIZARD_MFLD_NORMAL_ID_LABEL_OVERRIDES,
  ...WIZARD_MFLD_BODY_TEXT_LABEL_OVERRIDES,
  ...WIZARD_HNZ_ID_LABEL_OVERRIDES,
  ...WIZARD_DRV_ID_LABEL_OVERRIDES,
};

export function wizardMoldFieldLabel(key: string): string {
  if (WIZARD_MOLD_LABEL_OVERRIDES[key]) return WIZARD_MOLD_LABEL_OVERRIDES[key]!;
  const fromMeta = MOLD_ROOT_FIELD_META.find((m) => m.key === key);
  return fromMeta?.label ?? key;
}

export const PRODUCT_FIELD_META: { key: string; label: string; kind: "text" | "dec" | "dict" }[] = [
  ["product_name", "产品名", "text"],
  ["application_field_id", "应用领域", "dict"],
  ["weight", "重量(g)", "dec"],
  ["wall_thickness_id", "平均肉厚", "dict"],
  ["color_id", "颜色", "dict"],
  ["color_remark", "换色说明", "text"],
  ["surface_finish_id", "外观要求", "dict"],
  ["precision_level_id", "尺寸精度控制", "dict"],
  ["mechanical_requirement_id", "力学性能要求", "dict"],
  ["efficiency_requirement_id", "生产效率要求", "dict"],
  ["production_batch_id", "生产批量", "dict"],
].map(([key, label, kind]) => ({
  key,
  label,
  kind: kind as "text" | "dec" | "dict",
}));
