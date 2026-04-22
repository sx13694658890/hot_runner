import { Select, Typography } from "antd";

import {
  WIZARD_PARTS_NAMEPLATE_OPTIONS,
  WIZARD_PARTS_WIRE_CLIP_OPTIONS,
} from "@/features/selection-catalog/wizardLateStepsOptions";
import { type WizardMoldForm, wizardMoldFieldLabel } from "@/lib/selectionCatalogMoldPayload";

const inputBaseClass = "mt-1 w-full rounded border border-slate-200 px-2 py-1.5 text-sm";

type Props = {
  value: WizardMoldForm;
  onChange: (next: WizardMoldForm | ((prev: WizardMoldForm) => WizardMoldForm)) => void;
  disabled: boolean;
};

const NAMEPLATE = "wizard_parts_nameplate" as const;
const WIRE_CLIP = "wizard_parts_wire_clip" as const;

/**
 * 选型向导第 11 步：零配件 — 铭牌、压线片内置下拉，值写入 `wizard_parts_*`。
 */
export function WizardPartsFields({ value, onChange, disabled }: Props) {
  const setRoot = (key: string, v: string) => {
    onChange((prev) => ({ ...prev, root: { ...prev.root, [key]: v } }));
  };

  const renderOne = (
    field: typeof NAMEPLATE | typeof WIRE_CLIP,
    opts: readonly { value: string; label: string }[],
    placeholder: string,
  ) => {
    const raw = value.root[field]?.trim() ?? "";
    const selectValue = raw && opts.some((o) => o.value === raw) ? raw : undefined;
    return (
      <label key={field} className="block text-sm">
        <span className="text-slate-700">{wizardMoldFieldLabel(field)}</span>
        <Select<string>
          allowClear
          placeholder={placeholder}
          disabled={disabled}
          className={`${inputBaseClass} [&_.ant-select-selector]:rounded [&_.ant-select-selector]:border-slate-200`}
          value={selectValue}
          onChange={(nv) => setRoot(field, nv ?? "")}
          options={[...opts]}
        />
      </label>
    );
  };

  return (
    <div className="space-y-4">
      <Typography.Text type="secondary" className="text-xs">
        本步为向导内置选项（非选型字典 UUID）；压线片档位可按业务再扩展或改为字典。
      </Typography.Text>
      <div className="grid gap-3 sm:grid-cols-2">
        {renderOne(NAMEPLATE, WIZARD_PARTS_NAMEPLATE_OPTIONS, "请选择铭牌")}
        {renderOne(WIRE_CLIP, WIZARD_PARTS_WIRE_CLIP_OPTIONS, "请选择压线片")}
      </div>
    </div>
  );
}
