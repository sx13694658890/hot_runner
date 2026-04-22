import { create } from "zustand";

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

type SelectionWizardStore = {
  draft: WizardDraftV1;
  setProjectInfo: (next: WizardProjectInfo | ((prev: WizardProjectInfo) => WizardProjectInfo)) => void;
  setProductDraft: (next: WizardProductForm | ((prev: WizardProductForm) => WizardProductForm)) => void;
  setMoldDraft: (next: WizardMoldForm | ((prev: WizardMoldForm) => WizardMoldForm)) => void;
  replaceDraft: (draft: WizardDraftV1) => void;
  resetWizard: () => void;
};

export const useSelectionWizardStore = create<SelectionWizardStore>((set) => ({
  draft: loadWizardDraft(),

  setProjectInfo: (next) => {
    set((s) => {
      const project = typeof next === "function" ? next(s.draft.project) : next;
      const newDraft: WizardDraftV1 = { ...s.draft, project };
      saveWizardDraftPartial(newDraft);
      return { draft: newDraft };
    });
  },

  replaceDraft: (next) => {
    saveWizardDraftPartial(next);
    set({ draft: next });
  },

  setProductDraft: (next) => {
    set((s) => {
      const prev = s.draft.product;
      const product = typeof next === "function" ? next(prev) : next;
      const newDraft: WizardDraftV1 = { ...s.draft, product };
      saveWizardDraftPartial(newDraft);
      return { draft: newDraft };
    });
  },

  setMoldDraft: (next) => {
    set((s) => {
      const prev = s.draft.mold;
      const mold = typeof next === "function" ? next(prev) : next;
      const newDraft: WizardDraftV1 = { ...s.draft, mold };
      saveWizardDraftPartial(newDraft);
      return { draft: newDraft };
    });
  },

  resetWizard: () => {
    const empty: WizardDraftV1 = {
      project: emptyProjectInfo(),
      product: emptyWizardProduct(),
      mold: emptyWizardMold(),
    };
    saveWizardDraftPartial(empty);
    set({ draft: empty });
  },
}));

export function selectionWizardHasProjectData(draft: WizardDraftV1): boolean {
  return hasWizardProjectFilled(draft.project);
}

export function selectionWizardHasProductData(draft: WizardDraftV1): boolean {
  return hasWizardProductFilled(draft.product);
}

export function selectionWizardHasMoldData(draft: WizardDraftV1): boolean {
  return hasWizardMoldFilled(draft.mold);
}

export function selectionWizardHasDraftData(draft: WizardDraftV1): boolean {
  return (
    selectionWizardHasProjectData(draft) ||
    selectionWizardHasProductData(draft) ||
    selectionWizardHasMoldData(draft)
  );
}
