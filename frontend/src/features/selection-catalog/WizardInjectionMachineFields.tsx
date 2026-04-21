import { Typography } from "antd";

import { InjectionMachineCatalogFields } from "@/features/selection-catalog/InjectionMachineCatalogFields";
import { type WizardMoldForm } from "@/lib/selectionCatalogMoldPayload";

type Props = {
  value: WizardMoldForm;
  /** 与 setMoldDraft 一致，支持函数式更新，避免连续 setRoot 时后一次覆盖前一次（如换品牌清空型号）。 */
  onChange: (next: WizardMoldForm | ((prev: WizardMoldForm) => WizardMoldForm)) => void;
  disabled: boolean;
};

/**
 * 选型向导第 4 步：注塑机品牌 → 型号、客户设备库（字典）、机型参数只读；草稿写入 moldDraft.root。
 */
export function WizardInjectionMachineFields({ value, onChange, disabled }: Props) {
  const setRoot = (key: string, v: string) => {
    onChange((prev) => ({ ...prev, root: { ...prev.root, [key]: v } }));
  };

  return (
    <div className="space-y-4">
      <Typography.Text type="secondary" className="text-xs">
        请先选择注塑机品牌，再选择目录型号（更换品牌会清空型号）。「客户设备库」为独立下拉，可选 A/B/C 等预设机器项。
      </Typography.Text>

      <InjectionMachineCatalogFields root={value.root} setRoot={setRoot} disabled={disabled} />
    </div>
  );
}
