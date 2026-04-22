import type { SelDictCategoryRead } from "@/lib/selectionCatalogTypes";

/** 热咀本体 / 垫圈 / 碟簧（咀头分组之上） */
export const HNZ_BEFORE_NOZZLE_HEAD: readonly string[] = [
  "hrspec_hnz_body_base_type",
  "hrspec_hnz_heaters_per_body",
  "hrspec_hnz_body_heater",
  "hrspec_hnz_body_material",
  "hrspec_hnz_section_coiled",
  "hrspec_hnz_section_beryllium",
  "hrspec_hnz_body_length",
] as const;

/**
 * 向导「热咀咀头」分组：结构代号四类 + 胶口套、咀芯、咀帽、阀口套、外卡簧、隔热帽
 * （与 backend 种子顺序一致）
 */
export const HNZ_WIZARD_NOZZLE_HEAD_BLOCK_CODES: readonly string[] = [
  "hrspec_hnz_structure_open_large",
  "hrspec_hnz_structure_open_dot",
  "hrspec_hnz_structure_valve_large",
  "hrspec_hnz_structure_valve_dot",
  "hrspec_hnz_gate_diameter",
  "hrspec_hnz_core_material",
  "hrspec_hnz_core_coating",
  "hrspec_hnz_nozzle_cap",
  "hrspec_hnz_valve_bushing",
  "hrspec_hnz_outer_circlip",
  "hrspec_hnz_insulation_ring",
] as const;

export const HNZ_AFTER_NOZZLE_HEAD: readonly string[] = [
  "hrspec_hnz_bushing",
  "hrspec_hnz_water_jacket",
] as const;

/** 与 backend sel_hot_nozzle_detail_dict、热咀大类字典页顺序一致 */
export const HNZ_CATEGORY_ORDER: readonly string[] = [
  ...HNZ_BEFORE_NOZZLE_HEAD,
  ...HNZ_WIZARD_NOZZLE_HEAD_BLOCK_CODES,
  ...HNZ_AFTER_NOZZLE_HEAD,
] as const;

export const HNZ_PREFIX = "hrspec_hnz_";

const _nozzleHeadSet = new Set<string>(HNZ_WIZARD_NOZZLE_HEAD_BLOCK_CODES);

/** 将顺序拆为：咀头分组之上 | 「热咀咀头」块 | 衬套与运水套 */
export function splitHnzWizardNozzleHeadLayout(
  order: readonly string[] = HNZ_CATEGORY_ORDER,
): { beforeCodes: string[]; nozzleHeadCodes: string[]; afterCodes: string[] } {
  let lo = -1;
  let hi = -1;
  order.forEach((c, i) => {
    if (_nozzleHeadSet.has(c)) {
      if (lo < 0) lo = i;
      hi = i;
    }
  });
  if (lo < 0) {
    return { beforeCodes: [...order], nozzleHeadCodes: [], afterCodes: [] };
  }
  return {
    beforeCodes: [...order.slice(0, lo)],
    nozzleHeadCodes: [...order.slice(lo, hi + 1)],
    afterCodes: [...order.slice(hi + 1)],
  };
}

export function isHnzCategory(code: string): boolean {
  return code.startsWith(HNZ_PREFIX);
}

export function sortHnzCategories(cats: SelDictCategoryRead[]): SelDictCategoryRead[] {
  const idx = new Map(HNZ_CATEGORY_ORDER.map((c, i) => [c, i]));
  return [...cats].sort((a, b) => {
    const ia = idx.get(a.code) ?? 999;
    const ib = idx.get(b.code) ?? 999;
    if (ia !== ib) return ia - ib;
    return a.code.localeCompare(b.code);
  });
}

/** 热咀大类分类 code → 向导 moldDraft.root 键（与各分类字典项 UUID 对应） */
export function hnzCategoryCodeToWizardRootKey(categoryCode: string): string {
  if (!categoryCode.startsWith(HNZ_PREFIX)) {
    return `wizard_hnz_${categoryCode}_id`;
  }
  return `wizard_hnz_${categoryCode.slice(HNZ_PREFIX.length)}_id`;
}

export const HNZ_WIZARD_ROOT_ID_KEYS: readonly string[] = HNZ_CATEGORY_ORDER.map((c) =>
  hnzCategoryCodeToWizardRootKey(c),
);

/** 与 backend SEL_HOT_NOZZLE_DICT_SEED 分类显示名一致；接口有分类 label 时优先用接口 */
export const HNZ_CATEGORY_FALLBACK_LABELS: Record<string, string> = {
  hrspec_hnz_body_base_type: "热咀本体-底座类型",
  hrspec_hnz_heaters_per_body: "热咀本体-单个本体加热器数",
  hrspec_hnz_body_heater: "热咀本体-热咀加热器",
  hrspec_hnz_body_material: "热咀本体-热咀本体材质",
  hrspec_hnz_section_coiled: "垫圈-镶嵌用",
  hrspec_hnz_section_beryllium: "垫圈-铜套用",
  hrspec_hnz_body_length: "本体碟簧",
  hrspec_hnz_structure_open_large: "热咀咀头-开放式-大水口",
  hrspec_hnz_structure_open_dot: "热咀咀头-开放式-点胶口",
  hrspec_hnz_structure_valve_large: "热咀咀头-针阀式-大水口",
  hrspec_hnz_structure_valve_dot: "热咀咀头-针阀式-点胶口",
  hrspec_hnz_gate_diameter: "热咀咀头-胶口套",
  hrspec_hnz_core_material: "热咀咀头-咀芯材质",
  hrspec_hnz_core_coating: "热咀咀头-咀芯涂层工艺",
  hrspec_hnz_nozzle_cap: "热咀咀头-咀帽",
  hrspec_hnz_insulation_ring: "热咀咀头-隔热帽",
  hrspec_hnz_valve_bushing: "热咀咀头-阀口套",
  hrspec_hnz_outer_circlip: "热咀咀头-外卡簧",
  hrspec_hnz_bushing: "衬套",
  hrspec_hnz_water_jacket: "运水套",
};
