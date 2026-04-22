import type { SelDictCategoryRead } from "@/lib/selectionCatalogTypes";

/** 与 backend sel_hot_nozzle_detail_dict、热咀大类字典页顺序一致 */
export const HNZ_CATEGORY_ORDER: readonly string[] = [
  "hrspec_hnz_body_base_type",
  "hrspec_hnz_heaters_per_body",
  "hrspec_hnz_body_heater",
  "hrspec_hnz_body_material",
  "hrspec_hnz_section_coiled",
  "hrspec_hnz_section_beryllium",
  "hrspec_hnz_body_length",
  "hrspec_hnz_structure_open_large",
  "hrspec_hnz_structure_open_dot",
  "hrspec_hnz_structure_valve_large",
  "hrspec_hnz_structure_valve_dot",
  "hrspec_hnz_gate_diameter",
  "hrspec_hnz_core_material",
  "hrspec_hnz_core_coating",
  "hrspec_hnz_nozzle_cap",
  "hrspec_hnz_insulation_ring",
  "hrspec_hnz_valve_bushing",
  "hrspec_hnz_outer_circlip",
  "hrspec_hnz_bushing",
  "hrspec_hnz_water_jacket",
] as const;

export const HNZ_PREFIX = "hrspec_hnz_";

/** 热咀结构代码子类（开放式/针阀式 × 大水口/点胶口），向导中可单独成组展示 */
export const HNZ_STRUCTURE_CODE_PREFIX = "hrspec_hnz_structure_";

export function splitHnzWizardStructureBlock(
  order: readonly string[] = HNZ_CATEGORY_ORDER,
): { beforeCodes: string[]; structureCodes: string[]; afterCodes: string[] } {
  const idxs = order.map((c, i) => (c.startsWith(HNZ_STRUCTURE_CODE_PREFIX) ? i : -1)).filter((i) => i >= 0);
  if (idxs.length === 0) {
    return { beforeCodes: [...order], structureCodes: [], afterCodes: [] };
  }
  const lo = Math.min(...idxs);
  const hi = Math.max(...idxs);
  return {
    beforeCodes: [...order.slice(0, lo)],
    structureCodes: [...order.slice(lo, hi + 1)],
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
  hrspec_hnz_structure_open_large: "热咀咀头-结构代码-开放式-大水口",
  hrspec_hnz_structure_open_dot: "热咀咀头-结构代码-开放式-点胶口",
  hrspec_hnz_structure_valve_large: "热咀咀头-结构代码-针阀式-大水口",
  hrspec_hnz_structure_valve_dot: "热咀咀头-结构代码-针阀式-点胶口",
  hrspec_hnz_gate_diameter: "热咀咀头-胶口直径",
  hrspec_hnz_core_material: "热咀咀头-咀芯材质",
  hrspec_hnz_core_coating: "热咀咀头-咀芯涂层工艺",
  hrspec_hnz_nozzle_cap: "热咀咀头-咀帽",
  hrspec_hnz_insulation_ring: "热咀咀头-隔热圈",
  hrspec_hnz_valve_bushing: "热咀咀头-阀口套",
  hrspec_hnz_outer_circlip: "热咀咀头-外卡簧",
  hrspec_hnz_bushing: "衬套",
  hrspec_hnz_water_jacket: "运水套",
};
