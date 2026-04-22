import type { SelDictCategoryRead } from "@/lib/selectionCatalogTypes";

/** 与 backend sel_manifold_detail_dict、分流板大类字典页顺序一致 */
export const MFLD_CATEGORY_ORDER: readonly string[] = [
  "hrspec_mfld_process",
  "hrspec_mfld_bridge_material",
  "hrspec_mfld_bridge_style",
  "hrspec_mfld_bridge_channel_diameter",
  "hrspec_mfld_manifold_thickness",
  "hrspec_mfld_runner_layout",
  "hrspec_mfld_point_coding",
  "hrspec_mfld_manifold_runner_diameter",
  "hrspec_mfld_runner_layers",
  "hrspec_mfld_spacer_block",
  "hrspec_mfld_plate_disc_spring",
  "hrspec_mfld_center_locating_pin",
  "hrspec_mfld_anti_rotation_pin",
  "hrspec_mfld_plug_regular",
  "hrspec_mfld_plug_flat",
  "hrspec_mfld_plug_insert_basic",
  "hrspec_mfld_plug_insert_t",
  "hrspec_mfld_plug_insert_i",
  "hrspec_mfld_plug_insert_l",
  "hrspec_mfld_water_connector",
  "hrspec_mfld_oil_connector",
  "hrspec_mfld_rule_label",
  "hrspec_mfld_water_page",
] as const;

export const MFLD_PREFIX = "hrspec_mfld_";

/** 向导 UI 中归入「分流板主体」「法向分流板」分组的字典分类（展示顺序与业务表述一致） */
export const MFLD_MANIFOLD_BODY_CATEGORY_ORDER: readonly string[] = [
  "hrspec_mfld_manifold_thickness",
  "hrspec_mfld_runner_layout",
  "hrspec_mfld_manifold_runner_diameter",
  "hrspec_mfld_point_coding",
  "hrspec_mfld_runner_layers",
  "hrspec_mfld_spacer_block",
  "hrspec_mfld_plate_disc_spring",
  "hrspec_mfld_center_locating_pin",
  "hrspec_mfld_anti_rotation_pin",
  "hrspec_mfld_plug_regular",
  "hrspec_mfld_plug_flat",
  "hrspec_mfld_plug_insert_basic",
  "hrspec_mfld_plug_insert_t",
  "hrspec_mfld_plug_insert_i",
  "hrspec_mfld_plug_insert_l",
] as const;

/** 分流板主体 / 法向分流板 下自由文本片段（非字典 UUID，仅存向导草稿） */
export const MFLD_MANIFOLD_BODY_TEXT_PARTS: readonly { part: string; label: string; placeholder: string }[] = [
  { part: "runner_hole_pre_expansion", label: "流道孔预膨胀", placeholder: "选填，如预膨胀量或工艺说明" },
  { part: "strip", label: "盘条", placeholder: "选填，如规格/型号说明" },
  { part: "ceramic_interface", label: "陶瓷接口", placeholder: "选填" },
  { part: "lead_wire", label: "引线", placeholder: "选填" },
  { part: "sense_wire", label: "感温线", placeholder: "选填（与「感温线样式」字典项互补）" },
  { part: "copper_bar", label: "铜条", placeholder: "选填" },
] as const;

export type MfldBodyTextVariant = "main" | "normal";

export function mfldBodyTextFieldKey(part: string, variant: MfldBodyTextVariant): string {
  return variant === "main"
    ? `wizard_mfld_body_${part}_text`
    : `wizard_mfld_normal_body_${part}_text`;
}

/** 全量顺序中「分流板主体」块前后的 code 列表（主体块内顺序用 MFLD_MANIFOLD_BODY_CATEGORY_ORDER） */
export function splitMfldWizardSections(): { prefixCodes: string[]; suffixCodes: string[] } {
  const indices = MFLD_MANIFOLD_BODY_CATEGORY_ORDER.map((c) => MFLD_CATEGORY_ORDER.indexOf(c));
  const min = Math.min(...indices);
  const max = Math.max(...indices);
  return {
    prefixCodes: [...MFLD_CATEGORY_ORDER.slice(0, min)],
    suffixCodes: [...MFLD_CATEGORY_ORDER.slice(max + 1)],
  };
}

export function isMfldCategory(code: string): boolean {
  return code.startsWith(MFLD_PREFIX);
}

export function sortMfldCategories(cats: SelDictCategoryRead[]): SelDictCategoryRead[] {
  const idx = new Map(MFLD_CATEGORY_ORDER.map((c, i) => [c, i]));
  return [...cats].sort((a, b) => {
    const ia = idx.get(a.code) ?? 999;
    const ib = idx.get(b.code) ?? 999;
    if (ia !== ib) return ia - ib;
    return a.code.localeCompare(b.code);
  });
}

/** 分流板大类分类 code → 向导 moldDraft.root 键 */
export function mfldCategoryCodeToWizardRootKey(categoryCode: string): string {
  if (!categoryCode.startsWith(MFLD_PREFIX)) {
    return `wizard_mfld_${categoryCode}_id`;
  }
  return `wizard_mfld_${categoryCode.slice(MFLD_PREFIX.length)}_id`;
}

/** 法向分流板：复用同一 hrspec_mfld_* 字典选项，草稿键独立 */
export function mfldCategoryCodeToWizardNormalRootKey(categoryCode: string): string {
  const short = categoryCode.startsWith(MFLD_PREFIX)
    ? categoryCode.slice(MFLD_PREFIX.length)
    : categoryCode;
  return `wizard_mfld_normal_${short}_id`;
}

export const MFLD_MANIFOLD_NORMAL_ROOT_ID_KEYS: readonly string[] = MFLD_MANIFOLD_BODY_CATEGORY_ORDER.map((c) =>
  mfldCategoryCodeToWizardNormalRootKey(c),
);

export const MFLD_MANIFOLD_MAIN_BODY_TEXT_KEYS: readonly string[] = MFLD_MANIFOLD_BODY_TEXT_PARTS.map((p) =>
  mfldBodyTextFieldKey(p.part, "main"),
);

export const MFLD_MANIFOLD_NORMAL_BODY_TEXT_KEYS: readonly string[] = MFLD_MANIFOLD_BODY_TEXT_PARTS.map((p) =>
  mfldBodyTextFieldKey(p.part, "normal"),
);

/** 与 backend SEL_MANIFOLD_DICT_SEED 分类显示名一致；接口有分类 label 时优先用接口 */
export const MFLD_CATEGORY_FALLBACK_LABELS: Record<string, string> = {
  hrspec_mfld_process: "属性类-工艺",
  hrspec_mfld_bridge_material: "属性类-分流板材质",
  hrspec_mfld_bridge_style: "桥板-分流板搭桥样式",
  hrspec_mfld_bridge_channel_diameter: "桥板-桥流道直径",
  hrspec_mfld_manifold_thickness: "分流板厚度",
  hrspec_mfld_runner_layout: "流道走向示意图（分流板主体）",
  hrspec_mfld_point_coding: "点位编码",
  hrspec_mfld_manifold_runner_diameter: "分流板流道直径（分流板主体）",
  hrspec_mfld_runner_layers: "流道层数",
  hrspec_mfld_spacer_block: "垫块",
  hrspec_mfld_plate_disc_spring: "板上碟簧",
  hrspec_mfld_center_locating_pin: "中心定位销",
  hrspec_mfld_anti_rotation_pin: "防转销",
  hrspec_mfld_plug_regular: "堵头-常规堵头",
  hrspec_mfld_plug_flat: "堵头-平面堵头",
  hrspec_mfld_plug_insert_basic: "堵头-镶件堵头-基本型",
  hrspec_mfld_plug_insert_t: "堵头-镶件堵头-T型",
  hrspec_mfld_plug_insert_i: "堵头-镶件堵头-I型",
  hrspec_mfld_plug_insert_l: "堵头-镶件堵头-L型",
  hrspec_mfld_water_connector: "线架-水接头",
  hrspec_mfld_oil_connector: "线架-油接头",
  hrspec_mfld_rule_label: "线架-规格标牌",
  hrspec_mfld_water_page: "线架-水路版",
};
