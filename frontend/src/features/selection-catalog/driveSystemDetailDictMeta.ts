import type { SelDictCategoryRead } from "@/lib/selectionCatalogTypes";

/** 阀针、阀套（「气缸板上开孔的驱动器」分组之上） */
export const DRV_BEFORE_PLATE_ACTUATOR: readonly string[] = [
  "hrspec_drv_valve_pin_spec",
  "hrspec_drv_valve_pin_material",
  "hrspec_drv_valve_pin_coating",
  "hrspec_drv_sleeve_regular",
  "hrspec_drv_sleeve_color_change",
] as const;

/** 气缸板上开孔的驱动器 — 按型号分 BOM 零件选项 */
export const DRV_PLATE_ACTUATOR_CODES: readonly string[] = [
  "hrspec_drv_plate_actuator_hs40",
  "hrspec_drv_plate_actuator_fep30",
  "hrspec_drv_plate_actuator_vc58",
  "hrspec_drv_plate_actuator_vc68",
  "hrspec_drv_plate_actuator_vc78",
  "hrspec_drv_plate_actuator_vc88",
] as const;

export const DRV_AFTER_PLATE_ACTUATOR: readonly string[] = [
  "hrspec_drv_manifold_pneumatic_connector",
  "hrspec_drv_manifold_hydraulic_connector",
  "hrspec_drv_manifold_tubing",
  "hrspec_drv_single_point_base_parts",
  "hrspec_drv_guide_sleeve",
] as const;

/** 与 backend sel_drive_system_detail_dict、驱动系统字典页顺序一致 */
export const DRV_CATEGORY_ORDER: readonly string[] = [
  ...DRV_BEFORE_PLATE_ACTUATOR,
  ...DRV_PLATE_ACTUATOR_CODES,
  ...DRV_AFTER_PLATE_ACTUATOR,
] as const;

export const DRV_PREFIX = "hrspec_drv_";

const _plateActuatorSet = new Set<string>(DRV_PLATE_ACTUATOR_CODES);

export function splitDrvWizardPlateActuatorBlock(
  order: readonly string[] = DRV_CATEGORY_ORDER,
): { beforeCodes: string[]; plateActuatorCodes: string[]; afterCodes: string[] } {
  let lo = -1;
  let hi = -1;
  order.forEach((c, i) => {
    if (_plateActuatorSet.has(c)) {
      if (lo < 0) lo = i;
      hi = i;
    }
  });
  if (lo < 0) {
    return { beforeCodes: [...order], plateActuatorCodes: [], afterCodes: [] };
  }
  return {
    beforeCodes: [...order.slice(0, lo)],
    plateActuatorCodes: [...order.slice(lo, hi + 1)],
    afterCodes: [...order.slice(hi + 1)],
  };
}

export function isDrvCategory(code: string): boolean {
  return code.startsWith(DRV_PREFIX);
}

export function sortDrvCategories(cats: SelDictCategoryRead[]): SelDictCategoryRead[] {
  const idx = new Map(DRV_CATEGORY_ORDER.map((c, i) => [c, i]));
  return [...cats].sort((a, b) => {
    const ia = idx.get(a.code) ?? 999;
    const ib = idx.get(b.code) ?? 999;
    if (ia !== ib) return ia - ib;
    return a.code.localeCompare(b.code);
  });
}

export function drvCategoryCodeToWizardRootKey(categoryCode: string): string {
  if (!categoryCode.startsWith(DRV_PREFIX)) {
    return `wizard_drv_${categoryCode}_id`;
  }
  return `wizard_drv_${categoryCode.slice(DRV_PREFIX.length)}_id`;
}

export const DRV_WIZARD_ROOT_ID_KEYS: readonly string[] = DRV_CATEGORY_ORDER.map((c) =>
  drvCategoryCodeToWizardRootKey(c),
);

/** 与 backend SEL_DRIVE_SYSTEM_DICT_SEED 分类显示名一致；接口有分类 label 时优先用接口 */
export const DRV_CATEGORY_FALLBACK_LABELS: Record<string, string> = {
  hrspec_drv_valve_pin_spec: "阀针-阀针规格",
  hrspec_drv_valve_pin_material: "阀针-阀针材质",
  hrspec_drv_valve_pin_coating: "阀针-阀针镀层工艺",
  hrspec_drv_sleeve_regular: "阀套-常规阀套",
  hrspec_drv_sleeve_color_change: "阀套-换色阀套",
  hrspec_drv_plate_actuator_hs40: "HS40",
  hrspec_drv_plate_actuator_fep30: "FEP30",
  hrspec_drv_plate_actuator_vc58: "VC58",
  hrspec_drv_plate_actuator_vc68: "VC68",
  hrspec_drv_plate_actuator_vc78: "VC78",
  hrspec_drv_plate_actuator_vc88: "VC88",
  hrspec_drv_manifold_pneumatic_connector: "固定在分流板上-整体式气缸-接头",
  hrspec_drv_manifold_hydraulic_connector: "固定在分流板上-整体式油缸-接头",
  hrspec_drv_manifold_tubing: "固定在分流板上-管材类型",
  hrspec_drv_single_point_base_parts: "单点针阀补充零件",
  hrspec_drv_guide_sleeve: "导向套-规格",
};
