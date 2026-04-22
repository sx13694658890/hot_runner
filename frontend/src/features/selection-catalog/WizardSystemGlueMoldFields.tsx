import { Select, Typography } from "antd";

import { WIZARD_SYSTEM_GLUE_MOLD_OPTIONS } from "@/features/selection-catalog/wizardLateStepsOptions";
import { type WizardMoldForm, wizardMoldFieldLabel } from "@/lib/selectionCatalogMoldPayload";

const inputBaseClass = "mt-1 w-full rounded border border-slate-200 px-2 py-1.5 text-sm";

type Props = {
  value: WizardMoldForm;
  onChange: (next: WizardMoldForm | ((prev: WizardMoldForm) => WizardMoldForm)) => void;
  disabled: boolean;
};

const FIELD = "wizard_system_glue_mold_count" as const;

/**
 * 选型向导第 10 步：系统存胶模数 — 内置三档下拉，值写入 `moldDraft.root.wizard_system_glue_mold_count`。
 */
export function WizardSystemGlueMoldFields({ value, onChange, disabled }: Props) {
  const raw = value.root[FIELD]?.trim() ?? "";
  const selectValue =
    raw && WIZARD_SYSTEM_GLUE_MOLD_OPTIONS.some((o) => o.value === raw) ? raw : undefined;

  const setRoot = (v: string) => {
    onChange((prev) => ({ ...prev, root: { ...prev.root, [FIELD]: v } }));
  };

  return (
    <div className="space-y-4">
      <Typography.Text type="secondary" className="text-xs">
        本步为向导内置选项（非选型字典 UUID），便于后续与规格或报价字段映射。
      </Typography.Text>
      <label className="block max-w-md text-sm">
        <span className="text-slate-700">{wizardMoldFieldLabel(FIELD)}</span>
        <Select<string>
          allowClear
          placeholder="请选择存胶模数档位"
          disabled={disabled}
          className={`${inputBaseClass} [&_.ant-select-selector]:rounded [&_.ant-select-selector]:border-slate-200`}
          value={selectValue}
          onChange={(nv) => setRoot(nv ?? "")}
          options={[...WIZARD_SYSTEM_GLUE_MOLD_OPTIONS]}
        />
      </label>
    </div>
  );
}
