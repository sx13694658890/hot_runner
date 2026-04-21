import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import {
  emptyProjectInfo,
  emptyWizardProduct,
  hasWizardMoldFilled,
  hasWizardProductFilled,
  hasWizardProjectFilled,
  loadWizardDraft,
  saveWizardDraftPartial,
  type WizardDraftV1,
  type WizardProductForm,
  type WizardProjectInfo,
} from "@/features/selection-catalog/wizardDraftStorage";
import { emptyWizardMold, type WizardMoldForm } from "@/lib/selectionCatalogMoldPayload";

type SelectionWizardContextValue = {
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

const SelectionWizardContext = createContext<SelectionWizardContextValue | null>(null);

export function SelectionWizardProvider({ children }: { children: ReactNode }) {
  const [draft, setDraft] = useState<WizardDraftV1>(() => loadWizardDraft());

  const setProjectInfo = useCallback(
    (next: WizardProjectInfo | ((prev: WizardProjectInfo) => WizardProjectInfo)) => {
      setDraft((d) => {
        const project = typeof next === "function" ? next(d.project) : next;
        const newDraft = { ...d, project };
        saveWizardDraftPartial(newDraft);
        return newDraft;
      });
    },
    [],
  );

  const replaceDraft = useCallback((next: WizardDraftV1) => {
    saveWizardDraftPartial(next);
    setDraft(next);
  }, []);

  const setProductDraft = useCallback(
    (next: WizardProductForm | ((prev: WizardProductForm) => WizardProductForm)) => {
      setDraft((d) => {
        const prev = d.product;
        const product = typeof next === "function" ? next(prev) : next;
        const newDraft = { ...d, product };
        saveWizardDraftPartial(newDraft);
        return newDraft;
      });
    },
    [],
  );

  const setMoldDraft = useCallback(
    (next: WizardMoldForm | ((prev: WizardMoldForm) => WizardMoldForm)) => {
      setDraft((d) => {
        const prev = d.mold;
        const mold = typeof next === "function" ? next(prev) : next;
        const newDraft = { ...d, mold };
        saveWizardDraftPartial(newDraft);
        return newDraft;
      });
    },
    [],
  );

  const resetWizard = useCallback(() => {
    const empty: WizardDraftV1 = {
      project: emptyProjectInfo(),
      product: emptyWizardProduct(),
      mold: emptyWizardMold(),
    };
    saveWizardDraftPartial(empty);
    setDraft(empty);
  }, []);

  const hasProjectData = useMemo(() => hasWizardProjectFilled(draft.project), [draft.project]);
  const hasProductData = useMemo(() => hasWizardProductFilled(draft.product), [draft.product]);
  const hasMoldData = useMemo(() => hasWizardMoldFilled(draft.mold), [draft.mold]);

  const hasWizardDraftData = useMemo(
    () => hasProjectData || hasProductData || hasMoldData,
    [hasProjectData, hasProductData, hasMoldData],
  );

  const value = useMemo<SelectionWizardContextValue>(
    () => ({
      draft,
      projectInfo: draft.project,
      setProjectInfo,
      productDraft: draft.product,
      setProductDraft,
      moldDraft: draft.mold,
      setMoldDraft,
      replaceDraft,
      resetWizard,
      hasProjectData,
      hasProductData,
      hasMoldData,
      hasWizardDraftData,
    }),
    [
      draft,
      setProjectInfo,
      setProductDraft,
      setMoldDraft,
      replaceDraft,
      resetWizard,
      hasProjectData,
      hasProductData,
      hasMoldData,
      hasWizardDraftData,
    ],
  );

  return <SelectionWizardContext.Provider value={value}>{children}</SelectionWizardContext.Provider>;
}

export function useSelectionWizard(): SelectionWizardContextValue {
  const ctx = useContext(SelectionWizardContext);
  if (ctx == null) {
    throw new Error("useSelectionWizard 必须在 SelectionWizardProvider 内使用");
  }
  return ctx;
}

/** 可选：未包裹 Provider 时不抛错（如单测），返回 null */
export function useSelectionWizardOptional(): SelectionWizardContextValue | null {
  return useContext(SelectionWizardContext);
}
