import {
  PRODUCT_FIELD_META,
  WIZARD_MOLD_ROOT_STRING_KEYS,
  WIZARD_MOLD_TRIBOOL_KEYS,
  emptyWizardMold,
  type WizardMoldForm,
} from "@/lib/selectionCatalogMoldPayload";

/** 选型向导草稿（sessionStorage），与模具根字段命名对齐便于后续提交 */
export type WizardProjectInfo = {
  order_requirement_id: string;
  manufacturer: string;
  manager: string;
  manager_phone: string;
};

/** 与模具档案「填写产品信息」相同键，见 PRODUCT_FIELD_META / sel_product_info */
export type WizardProductForm = Record<string, string>;

/** 向导产品步额外字段：材料主表 UUID，与模具档案「关联材料」material_id 语义一致，便于后续一键带入 */
export const WIZARD_PRODUCT_MATERIAL_ID_KEY = "material_id" as const;

/** 塑料牌号（sel_plastic_grade.id），依赖已选材料 */
export const WIZARD_PRODUCT_PLASTIC_GRADE_ID_KEY = "plastic_grade_id" as const;

export type WizardDraftV1 = {
  project: WizardProjectInfo;
  product: WizardProductForm;
  /** 第 3 步模具根字段草稿（与 MoldAggregateFormState 子集对齐） */
  mold: WizardMoldForm;
};

const KEY = "sel-wizard-draft-v1";

export const emptyProjectInfo = (): WizardProjectInfo => ({
  order_requirement_id: "",
  manufacturer: "",
  manager: "",
  manager_phone: "",
});

/** 与模具新建表单 empty 产品行一致：覆盖 PRODUCT_FIELD_META 全部键 + 向导产品材质 */
export function emptyWizardProduct(): WizardProductForm {
  const r: WizardProductForm = {};
  for (const m of PRODUCT_FIELD_META) {
    r[m.key] = "";
  }
  r[WIZARD_PRODUCT_MATERIAL_ID_KEY] = "";
  r[WIZARD_PRODUCT_PLASTIC_GRADE_ID_KEY] = "";
  return r;
}

export function loadWizardDraft(): WizardDraftV1 {
  try {
    const raw = sessionStorage.getItem(KEY);
    if (!raw) {
      return { project: emptyProjectInfo(), product: emptyWizardProduct(), mold: emptyWizardMold() };
    }
    const parsed = JSON.parse(raw) as Partial<WizardDraftV1>;
    const base = emptyWizardProduct();
    const mergedProduct = { ...base, ...parsed.product };
    for (const m of PRODUCT_FIELD_META) {
      if (mergedProduct[m.key] === undefined) mergedProduct[m.key] = "";
    }
    if (mergedProduct[WIZARD_PRODUCT_MATERIAL_ID_KEY] === undefined) {
      mergedProduct[WIZARD_PRODUCT_MATERIAL_ID_KEY] = "";
    }
    if (mergedProduct[WIZARD_PRODUCT_PLASTIC_GRADE_ID_KEY] === undefined) {
      mergedProduct[WIZARD_PRODUCT_PLASTIC_GRADE_ID_KEY] = "";
    }

    const moldBase = emptyWizardMold();
    const pm = parsed.mold;
    const mergedRoot = { ...moldBase.root, ...pm?.root };
    for (const k of WIZARD_MOLD_ROOT_STRING_KEYS) {
      if (mergedRoot[k] === undefined) mergedRoot[k] = "";
    }
    const mergedRootBool = { ...moldBase.rootBool, ...pm?.rootBool };
    for (const k of WIZARD_MOLD_TRIBOOL_KEYS) {
      if (mergedRootBool[k] === undefined) mergedRootBool[k] = "";
    }
    const mergedMold: WizardMoldForm = { root: mergedRoot, rootBool: mergedRootBool };

    return {
      project: {
        ...emptyProjectInfo(),
        ...parsed.project,
      },
      product: mergedProduct,
      mold: mergedMold,
    };
  } catch {
    return { project: emptyProjectInfo(), product: emptyWizardProduct(), mold: emptyWizardMold() };
  }
}

export function saveWizardDraftPartial(draft: WizardDraftV1): void {
  try {
    sessionStorage.setItem(KEY, JSON.stringify(draft));
  } catch {
    /* 隐私模式等可能失败，忽略 */
  }
}

/** 合并写入项目信息，保留产品等其它步骤 */
export function mergeWizardProject(project: WizardProjectInfo): void {
  const prev = loadWizardDraft();
  saveWizardDraftPartial({ ...prev, project });
}

/** 是否有任意项目信息字段可用于跨页展示提示 */
export function hasWizardProjectFilled(p: WizardProjectInfo): boolean {
  return [p.order_requirement_id, p.manufacturer, p.manager, p.manager_phone].some(
    (x) => String(x ?? "").trim() !== "",
  );
}

export function hasWizardProductFilled(product: WizardProductForm): boolean {
  return Object.values(product).some((x) => String(x ?? "").trim() !== "");
}

export function hasWizardMoldFilled(mold: WizardMoldForm): boolean {
  const rootAny = Object.values(mold.root).some((x) => String(x ?? "").trim() !== "");
  const boolAny = Object.values(mold.rootBool).some((x) => x !== "");
  return rootAny || boolAny;
}

export function clearWizardDraft(): void {
  try {
    sessionStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
}
