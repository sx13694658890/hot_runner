/**
 * SelMoldInfoCreate / PATCH 请求体拼装（对齐 backend SelMoldInfoWrite + 嵌套）
 */
import type { SelMoldInfoRead, SelProductInfoRead } from "@/lib/selectionCatalogTypes";

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
];

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
  ["injection_machine_model", "注塑机型号", "text"],
  ["injection_machine_tonnage", "注塑机吨位(t)", "int"],
  ["barrel_sphere_radius", "炮筒球半径(mm)", "dec"],
  ["barrel_orifice", "炮筒出胶孔(mm)", "dec"],
].map(([key, label, kind]) => ({
  key,
  label,
  kind: kind as "text" | "int" | "dec" | "tri",
}));

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
