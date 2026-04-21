import { useEffect, useState } from "react";
import { Alert, Input, Select, Typography } from "antd";

import { ApiError, apiFetch, formatApiDetail } from "@/lib/api";
import { fetchMoldDictBundle } from "@/lib/selectionCatalogDictApi";
import type { MoldDictBundleResponse, SelDictItemRead } from "@/lib/selectionCatalogTypes";
import {
  moldDictCategoryCode,
  type TriBool,
  type WizardMoldForm,
  wizardMoldFieldLabel,
} from "@/lib/selectionCatalogMoldPayload";

const VALVE_PIN_STYLE_CATEGORY = "hrspec_valve_pin_style";
const inputBaseClass = "mt-1 w-full rounded border border-slate-200 px-2 py-1.5 text-sm";

type Props = {
  value: WizardMoldForm;
  onChange: (next: WizardMoldForm | ((prev: WizardMoldForm) => WizardMoldForm)) => void;
  disabled: boolean;
};

/**
 * 选型向导第 6 步：热流道编号、咀数、类型、进胶/分流板、所有权、编号规则、驱动与阀、线架、插座与接线等；
 * 与 sel_mold_info 根部字段及 GET …/dict/mold-options 一致；阀针样式来自扁平行规格字典 hrspec_valve_pin_style（仅存向导键 wizard_valve_pin_style_id）。
 */
export function WizardHotRunnerInfoFields({ value, onChange, disabled }: Props) {
  const [dictBundle, setDictBundle] = useState<MoldDictBundleResponse["categories"] | null>(null);
  const [dictErr, setDictErr] = useState<string | null>(null);
  const [valvePinItems, setValvePinItems] = useState<SelDictItemRead[]>([]);
  const [loadingValvePin, setLoadingValvePin] = useState(true);
  const [valvePinErr, setValvePinErr] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      setDictErr(null);
      try {
        const b = await fetchMoldDictBundle();
        if (!cancelled) setDictBundle(b);
      } catch (e) {
        if (!cancelled) {
          setDictErr(e instanceof ApiError ? formatApiDetail(e.detail) : "加载 mold-options 失败");
          setDictBundle({});
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      setValvePinErr(null);
      setLoadingValvePin(true);
      try {
        const q = new URLSearchParams({
          category_code: VALVE_PIN_STYLE_CATEGORY,
          include_inactive: "true",
        });
        const rows = await apiFetch<SelDictItemRead[]>(`/selection-catalog/dict/items?${q.toString()}`);
        if (!cancelled) setValvePinItems(rows.filter((r) => r.is_active));
      } catch (e) {
        if (!cancelled) {
          setValvePinErr(e instanceof ApiError ? formatApiDetail(e.detail) : "加载阀针样式字典失败");
          setValvePinItems([]);
        }
      } finally {
        if (!cancelled) setLoadingValvePin(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const setRoot = (key: string, v: string) => {
    onChange((prev) => ({ ...prev, root: { ...prev.root, [key]: v } }));
  };

  const setRootBool = (key: string, v: TriBool) => {
    onChange((prev) => ({ ...prev, rootBool: { ...prev.rootBool, [key]: v } }));
  };

  const dictSelect = (key: string) => {
    const cat = moldDictCategoryCode(key);
    const opts = dictBundle?.[cat] ?? [];
    return (
      <Select<string>
        allowClear
        showSearch
        optionFilterProp="label"
        placeholder={dictBundle === null ? "字典加载中…" : undefined}
        disabled={disabled || dictBundle === null}
        loading={dictBundle === null}
        className={`${inputBaseClass} [&_.ant-select-selector]:rounded [&_.ant-select-selector]:border-slate-200`}
        value={value.root[key] || undefined}
        onChange={(nv) => setRoot(key, nv ?? "")}
        options={opts.map((o) => ({ value: o.id, label: o.label }))}
        popupMatchSelectWidth={false}
      />
    );
  };

  const wireTri = value.rootBool.wire_frame_needed ?? "";

  return (
    <div className="space-y-4">
      <Typography.Text type="secondary" className="text-xs">
        与模具档案「选型 / 接线」根部字段一致；阀针样式为扁平行规格字典项，当前仅存入选型向导草稿。
      </Typography.Text>

      {dictErr ? <Alert type="error" showIcon message={dictErr} /> : null}
      {valvePinErr ? <Alert type="error" showIcon message={valvePinErr} /> : null}

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block text-sm">
          <span className="text-slate-700">{wizardMoldFieldLabel("hot_runner_id")}</span>
          <Input
            className={inputBaseClass}
            disabled={disabled}
            value={value.root.hot_runner_id ?? ""}
            onChange={(e) => setRoot("hot_runner_id", e.target.value)}
            placeholder="热流道系统编号"
          />
        </label>
        <label className="block text-sm">
          <span className="text-slate-700">{wizardMoldFieldLabel("nozzle_count")}</span>
          <Input
            type="number"
            min={0}
            step={1}
            className={inputBaseClass}
            disabled={disabled}
            value={value.root.nozzle_count ?? ""}
            onChange={(e) => setRoot("nozzle_count", e.target.value)}
            placeholder="热咀数量"
          />
        </label>
        <label className="block text-sm">
          <span className="text-slate-700">{wizardMoldFieldLabel("hot_runner_type_id")}</span>
          {dictSelect("hot_runner_type_id")}
        </label>
        <label className="block text-sm">
          <span className="text-slate-700">{wizardMoldFieldLabel("gate_system_desc_id")}</span>
          {dictSelect("gate_system_desc_id")}
        </label>
        <label className="block text-sm">
          <span className="text-slate-700">{wizardMoldFieldLabel("runner_plate_style_id")}</span>
          {dictSelect("runner_plate_style_id")}
        </label>
        <label className="block text-sm">
          <span className="text-slate-700">{wizardMoldFieldLabel("hot_runner_system_ownership_id")}</span>
          {dictSelect("hot_runner_system_ownership_id")}
        </label>
        <label className="block text-sm">
          <span className="text-slate-700">{wizardMoldFieldLabel("point_numbering_rule_id")}</span>
          {dictSelect("point_numbering_rule_id")}
        </label>
        <label className="block text-sm">
          <span className="text-slate-700">{wizardMoldFieldLabel("driver_type_id")}</span>
          {dictSelect("driver_type_id")}
        </label>
        <label className="block text-sm">
          <span className="text-slate-700">{wizardMoldFieldLabel("solenoid_valve_id")}</span>
          {dictSelect("solenoid_valve_id")}
        </label>
        <label className="block text-sm">
          <span className="text-slate-700">{wizardMoldFieldLabel("wire_frame_needed")}</span>
          <Select<TriBool>
            allowClear
            disabled={disabled}
            className={`${inputBaseClass} [&_.ant-select-selector]:rounded [&_.ant-select-selector]:border-slate-200`}
            value={wireTri || undefined}
            onChange={(nv) => setRootBool("wire_frame_needed", (nv ?? "") as TriBool)}
            options={[
              { value: "true", label: "需要" },
              { value: "false", label: "不需要" },
            ]}
            popupMatchSelectWidth={false}
          />
        </label>
        <label className="block text-sm">
          <span className="text-slate-700">{wizardMoldFieldLabel("solenoid_valve_socket_id")}</span>
          {dictSelect("solenoid_valve_socket_id")}
        </label>
        <label className="block text-sm">
          <span className="text-slate-700">{wizardMoldFieldLabel("signal_wiring_method_id")}</span>
          {dictSelect("signal_wiring_method_id")}
        </label>
        <label className="block text-sm">
          <span className="text-slate-700">{wizardMoldFieldLabel("wizard_valve_pin_style_id")}</span>
          <Select<string>
            allowClear
            showSearch
            optionFilterProp="label"
            placeholder={loadingValvePin ? "字典加载中…" : "请选择阀针样式"}
            disabled={disabled || loadingValvePin}
            loading={loadingValvePin}
            className={`${inputBaseClass} [&_.ant-select-selector]:rounded [&_.ant-select-selector]:border-slate-200`}
            value={value.root.wizard_valve_pin_style_id || undefined}
            onChange={(nv) => setRoot("wizard_valve_pin_style_id", nv ?? "")}
            options={valvePinItems.map((o) => ({ value: o.id, label: o.label }))}
            popupMatchSelectWidth={false}
          />
        </label>
        <label className="block text-sm">
          <span className="text-slate-700">{wizardMoldFieldLabel("junction_box_position_id")}</span>
          {dictSelect("junction_box_position_id")}
        </label>
        <label className="block text-sm">
          <span className="text-slate-700">{wizardMoldFieldLabel("socket_type_id")}</span>
          {dictSelect("socket_type_id")}
        </label>
        <label className="block text-sm">
          <span className="text-slate-700">{wizardMoldFieldLabel("socket_pin_count_id")}</span>
          {dictSelect("socket_pin_count_id")}
        </label>
        <label className="block text-sm">
          <span className="text-slate-700">{wizardMoldFieldLabel("thermocouple_type_id")}</span>
          {dictSelect("thermocouple_type_id")}
        </label>
        <label className="block text-sm">
          <span className="text-slate-700">{wizardMoldFieldLabel("delivery_wiring_method_id")}</span>
          {dictSelect("delivery_wiring_method_id")}
        </label>
        <label className="block text-sm">
          <span className="text-slate-700">{wizardMoldFieldLabel("debug_wiring_method_id")}</span>
          {dictSelect("debug_wiring_method_id")}
        </label>
      </div>
    </div>
  );
}
