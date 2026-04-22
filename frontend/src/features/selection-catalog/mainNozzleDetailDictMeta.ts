import type { SelDictCategoryRead } from "@/lib/selectionCatalogTypes";

/** 与 backend sel_main_nozzle_detail_dict、主射咀大类字典页顺序一致 */
export const MNZ_CATEGORY_ORDER: readonly string[] = [
  "hrspec_mnz_body_heated",
  "hrspec_mnz_body_unheated",
  "hrspec_mnz_other",
  "hrspec_mnz_sr_ball",
  "hrspec_mnz_main_heater",
  "hrspec_mnz_thermocouple_style",
  "hrspec_mnz_body_material",
] as const;

export const MNZ_PREFIX = "hrspec_mnz_";

export function isMnzCategory(code: string): boolean {
  return code.startsWith(MNZ_PREFIX);
}

export function sortMnzCategories(cats: SelDictCategoryRead[]): SelDictCategoryRead[] {
  const idx = new Map(MNZ_CATEGORY_ORDER.map((c, i) => [c, i]));
  return [...cats].sort((a, b) => {
    const ia = idx.get(a.code) ?? 999;
    const ib = idx.get(b.code) ?? 999;
    if (ia !== ib) return ia - ib;
    return a.code.localeCompare(b.code);
  });
}

/** 主射咀大类分类 code → 向导 moldDraft.root 键（与各分类字典项 UUID 对应） */
export function mnzCategoryCodeToWizardRootKey(categoryCode: string): string {
  if (!categoryCode.startsWith(MNZ_PREFIX)) {
    return `wizard_mnz_${categoryCode}_id`;
  }
  return `wizard_mnz_${categoryCode.slice(MNZ_PREFIX.length)}_id`;
}

/** 与 backend sel_main_nozzle_detail_dict 分类显示名一致；接口有分类 label 时优先用接口 */
export const MNZ_CATEGORY_FALLBACK_LABELS: Record<string, string> = {
  hrspec_mnz_body_heated: "主射咀本体-加热型",
  hrspec_mnz_body_unheated: "主射咀本体-不加热型",
  hrspec_mnz_other: "其他配件",
  hrspec_mnz_sr_ball: "SR球头",
  hrspec_mnz_main_heater: "主射咀加热器",
  hrspec_mnz_thermocouple_style: "感温线样式",
  hrspec_mnz_body_material: "主射咀本体材质",
};
