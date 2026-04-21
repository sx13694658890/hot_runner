import { useEffect, useState } from "react";
import { Alert, Select, Typography } from "antd";

import { ApiError, formatApiDetail } from "@/lib/api";
import { fetchWizardCaeFlowDictBundle } from "@/lib/selectionCatalogDictApi";
import type { MoldDictBundleResponse } from "@/lib/selectionCatalogTypes";
import { type WizardMoldForm, wizardMoldFieldLabel } from "@/lib/selectionCatalogMoldPayload";

const CAT_MAIN_NOZZLE_CHANNEL = "sel_wizard_cae_main_nozzle_runner_diameter";
const CAT_BRIDGE = "sel_wizard_cae_bridge_runner_diameter";
const CAT_MANIFOLD_RUNNER = "sel_wizard_cae_manifold_runner_diameter";
const CAT_NORMAL_HNZ = "sel_wizard_cae_normal_hot_nozzle";
const CAT_HOT_RUNNER = "sel_wizard_cae_hot_nozzle_runner_diameter";
const CAT_GATE = "sel_wizard_cae_gate_diameter";

const inputBaseClass = "mt-1 w-full rounded border border-slate-200 px-2 py-1.5 text-sm";

const STEP5_FIELD_KEYS = [
  "wizard_cae_main_nozzle_channel_diameter_id",
  "wizard_cae_bridge_channel_diameter_id",
  "wizard_cae_manifold_runner_diameter_id",
  "wizard_cae_normal_hot_nozzle_structure_id",
  "wizard_cae_hot_nozzle_runner_diameter_id",
  "wizard_cae_gate_diameter_id",
] as const;

const FIELD_CATEGORY: Record<(typeof STEP5_FIELD_KEYS)[number], string> = {
  wizard_cae_main_nozzle_channel_diameter_id: CAT_MAIN_NOZZLE_CHANNEL,
  wizard_cae_bridge_channel_diameter_id: CAT_BRIDGE,
  wizard_cae_manifold_runner_diameter_id: CAT_MANIFOLD_RUNNER,
  wizard_cae_normal_hot_nozzle_structure_id: CAT_NORMAL_HNZ,
  wizard_cae_hot_nozzle_runner_diameter_id: CAT_HOT_RUNNER,
  wizard_cae_gate_diameter_id: CAT_GATE,
};

type Props = {
  value: WizardMoldForm;
  onChange: (next: WizardMoldForm | ((prev: WizardMoldForm) => WizardMoldForm)) => void;
  disabled: boolean;
};

type BundleItem = { id: string; label: string; sort_order: number };

function bundleItems(rows: BundleItem[] | undefined): BundleItem[] {
  return rows ?? [];
}

/**
 * 选型向导第 5 步：主射咀/桥/分流板/热咀流道直径、法向热咀、胶口直径；
 * 选项来自后端 GET …/dict/wizard-cae-flow-options（sel_wizard_cae_*，迁移种子补全）。
 */
export function WizardMoldFlowCaeFields({ value, onChange, disabled }: Props) {
  const [bundle, setBundle] = useState<MoldDictBundleResponse["categories"] | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      setErr(null);
      try {
        const b = await fetchWizardCaeFlowDictBundle();
        if (!cancelled) setBundle(b);
      } catch (e) {
        if (!cancelled) {
          setErr(e instanceof ApiError ? formatApiDetail(e.detail) : "加载字典失败");
          setBundle({});
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const setRoot = (key: string, v: string) => {
    onChange((prev) => ({ ...prev, root: { ...prev.root, [key]: v } }));
  };

  const itemsFor = (code: string): BundleItem[] => bundleItems(bundle?.[code]);

  const loading = bundle === null;

  const selectFor = (fieldKey: (typeof STEP5_FIELD_KEYS)[number]) => {
    const cat = FIELD_CATEGORY[fieldKey];
    const opts = itemsFor(cat);
    return (
      <label key={fieldKey} className="block text-sm">
        <span className="text-slate-700">{wizardMoldFieldLabel(fieldKey)}</span>
        <Select<string>
          allowClear
          showSearch
          optionFilterProp="label"
          placeholder={loading ? "字典加载中…" : undefined}
          disabled={disabled || loading}
          loading={loading}
          className={`${inputBaseClass} [&_.ant-select-selector]:rounded [&_.ant-select-selector]:border-slate-200`}
          value={value.root[fieldKey] || undefined}
          onChange={(nv) => setRoot(fieldKey, nv ?? "")}
          options={opts.map((o) => ({ value: o.id, label: o.label }))}
          popupMatchSelectWidth={false}
        />
      </label>
    );
  };

  return (
    <div className="space-y-4">
      <Typography.Text type="secondary" className="text-xs">
        六项选项由字典接口统一下发（分类 code 前缀 sel_wizard_cae_）；库内无分类/项时由迁移种子补全，也可在「字典管理」中增删改项以保持数据驱动。
      </Typography.Text>
      {err ? <Alert type="error" showIcon message={err} /> : null}
      <div className="grid gap-3 sm:grid-cols-2">{STEP5_FIELD_KEYS.map((k) => selectFor(k))}</div>
    </div>
  );
}
