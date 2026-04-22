import type { ReactNode } from "react";
import { useShallow } from "zustand/react/shallow";

import type { WizardDraftV1, WizardProductForm, WizardProjectInfo } from "@/features/selection-catalog/wizardDraftStorage";
import type { WizardMoldForm } from "@/lib/selectionCatalogMoldPayload";
import {
  selectionWizardHasDraftData,
  selectionWizardHasMoldData,
  selectionWizardHasProductData,
  selectionWizardHasProjectData,
  useSelectionWizardStore,
} from "@/stores/selectionWizardStore";

export type SelectionWizardContextValue = {
  /** 完整草稿（后续可扩展 mold 等） */
  draft: WizardDraftV1;
  projectInfo: WizardProjectInfo;
  setProjectInfo: (next: WizardProjectInfo | ((prev: WizardProjectInfo) => WizardProjectInfo)) => void;
  /** 与模具档案「填写产品信息」同结构 */
  productDraft: WizardProductForm;
  setProductDraft: (next: WizardProductForm | ((prev: WizardProductForm) => WizardProductForm)) => void;
  /** 第 3 步模具根字段草稿 */
  moldDraft: WizardMoldForm;
  setMoldDraft: (next: WizardMoldForm | ((prev: WizardMoldForm) => WizardMoldForm)) => void;
  /** 替换整份草稿并写入 sessionStorage */
  replaceDraft: (draft: WizardDraftV1) => void;
  /** 清空项目与产品草稿 */
  resetWizard: () => void;
  hasProjectData: boolean;
  hasProductData: boolean;
  hasMoldData: boolean;
  /** 项目 / 产品 / 模具任一有填写，用于跨页提示 */
  hasWizardDraftData: boolean;
};

function buildWizardValue(s: ReturnType<typeof useSelectionWizardStore.getState>): SelectionWizardContextValue {
  const { draft } = s;
  return {
    draft,
    projectInfo: draft.project,
    setProjectInfo: s.setProjectInfo,
    productDraft: draft.product,
    setProductDraft: s.setProductDraft,
    moldDraft: draft.mold,
    setMoldDraft: s.setMoldDraft,
    replaceDraft: s.replaceDraft,
    resetWizard: s.resetWizard,
    hasProjectData: selectionWizardHasProjectData(draft),
    hasProductData: selectionWizardHasProductData(draft),
    hasMoldData: selectionWizardHasMoldData(draft),
    hasWizardDraftData: selectionWizardHasDraftData(draft),
  };
}

/**
 * 界定选型向导数据在应用树中的挂载点；**状态由 Zustand** `useSelectionWizardStore` 持有，
 * 每次变更仍经 `saveWizardDraftPartial` 写入 **sessionStorage**（`wizardDraftStorage`）。
 */
export function SelectionWizardProvider({ children }: { children: ReactNode }) {
  return children;
}

export function useSelectionWizard(): SelectionWizardContextValue {
  return useSelectionWizardStore(useShallow((s) => buildWizardValue(s)));
}

/** 与 `useSelectionWizard` 相同；草稿为全局 store。 */
export function useSelectionWizardOptional(): SelectionWizardContextValue {
  return useSelectionWizard();
}
