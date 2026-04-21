import { useEffect, useMemo, useState } from "react";
import { Alert, Checkbox, Divider, Input, Select, Typography } from "antd";

import { ApiError, formatApiDetail } from "@/lib/api";
import { fetchMoldDictBundle } from "@/lib/selectionCatalogDictApi";
import {
  moldDictCategoryCode,
  type TriBool,
  type WizardMoldForm,
  wizardMoldFieldLabel,
} from "@/lib/selectionCatalogMoldPayload";
import type { MoldDictBundleResponse } from "@/lib/selectionCatalogTypes";

const inputBaseClass = "mt-1 w-full rounded border border-slate-200 px-2 py-1.5 text-sm";

type Props = {
  value: WizardMoldForm;
  onChange: (next: WizardMoldForm) => void;
  disabled: boolean;
};

function TriYesNo({
  value,
  onChange,
  disabled,
}: {
  value: TriBool;
  onChange: (v: TriBool) => void;
  disabled: boolean;
}) {
  return (
    <Select<TriBool>
      allowClear
      disabled={disabled}
      className={`${inputBaseClass} [&_.ant-select-selector]:rounded [&_.ant-select-selector]:border-slate-200`}
      value={value || undefined}
      onChange={(nv) => onChange((nv ?? "") as TriBool)}
      options={[
        { value: "true", label: "是" },
        { value: "false", label: "否" },
      ]}
      popupMatchSelectWidth={false}
    />
  );
}

function TriHasNot({
  value,
  onChange,
  disabled,
}: {
  value: TriBool;
  onChange: (v: TriBool) => void;
  disabled: boolean;
}) {
  return (
    <Select<TriBool>
      allowClear
      disabled={disabled}
      className={`${inputBaseClass} [&_.ant-select-selector]:rounded [&_.ant-select-selector]:border-slate-200`}
      value={value || undefined}
      onChange={(nv) => onChange((nv ?? "") as TriBool)}
      options={[
        { value: "true", label: "有" },
        { value: "false", label: "没有" },
      ]}
      popupMatchSelectWidth={false}
    />
  );
}

/**
 * 选型向导第 3 步：模具编号、状态、类型、冷却等，与「模具档案」根部字段及 mold-options 字典一致。
 */
export function WizardMoldInfoFields({ value, onChange, disabled }: Props) {
  const [dictBundle, setDictBundle] = useState<MoldDictBundleResponse["categories"] | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      setErr(null);
      try {
        const categories = await fetchMoldDictBundle();
        if (!cancelled) setDictBundle(categories);
      } catch (e) {
        if (!cancelled) {
          setErr(e instanceof ApiError ? formatApiDetail(e.detail) : "加载选型字典失败");
          setDictBundle({});
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const setRoot = (key: string, v: string) => {
    onChange({ ...value, root: { ...value.root, [key]: v } });
  };

  const setRootBool = (key: string, v: TriBool) => {
    onChange({ ...value, rootBool: { ...value.rootBool, [key]: v } });
  };

  const moldStatusLabel = useMemo(() => {
    const id = value.root.mold_status_id?.trim();
    if (!id || !dictBundle?.mold_status) return null;
    return dictBundle.mold_status.find((o) => o.id === id)?.label ?? null;
  }, [dictBundle, value.root.mold_status_id]);

  const isOldRefurbish = moldStatusLabel === "旧模改制";

  const onMoldStatusChange = (nv: string) => {
    const nextId = nv ?? "";
    const nextLabel =
      nextId && dictBundle?.mold_status
        ? dictBundle.mold_status.find((o) => o.id === nextId)?.label
        : null;
    const nextRoot: WizardMoldForm["root"] = { ...value.root, mold_status_id: nextId };
    if (nextLabel !== "旧模改制") {
      nextRoot.wizard_disallow_add_iron = "";
      nextRoot.wizard_disallow_reduce_iron = "";
    }
    onChange({ ...value, root: nextRoot });
  };

  const dictSelect = (key: string, onChangeId?: (v: string) => void) => {
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
        onChange={(nv) => (onChangeId ? onChangeId(nv ?? "") : setRoot(key, nv ?? ""))}
        options={opts.map((o) => ({ value: o.id, label: o.label }))}
        popupMatchSelectWidth={false}
      />
    );
  };

  return (
    <div className="space-y-4">
      <Typography.Text type="secondary" className="text-xs">
        字段与 <Typography.Text code>sel_mold_info</Typography.Text>、
        <Typography.Text code>GET …/dict/mold-options</Typography.Text> 一致；板厚与「旧模改制」勾选项为向导扩展字段，提交模具时可一并映射。
      </Typography.Text>

      {err ? <Alert type="error" showIcon message={err} /> : null}

      <div>
        <Typography.Title level={5} className="!mb-3 !mt-0 text-slate-800">
          基本信息
        </Typography.Title>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block text-sm">
            <span className="text-slate-700">{wizardMoldFieldLabel("mold_id")}</span>
            <Input
              className={inputBaseClass}
              disabled={disabled}
              value={value.root.mold_id ?? ""}
              onChange={(e) => setRoot("mold_id", e.target.value)}
              placeholder="模具编号"
            />
          </label>
          <label className="block text-sm">
            <span className="text-slate-700">{wizardMoldFieldLabel("mold_status_id")}</span>
            {dictSelect("mold_status_id", onMoldStatusChange)}
          </label>
        </div>
        {isOldRefurbish ? (
          <div className="mt-3 flex flex-wrap gap-6">
            <Checkbox
              disabled={disabled}
              checked={value.root.wizard_disallow_add_iron === "true"}
              onChange={(e) => setRoot("wizard_disallow_add_iron", e.target.checked ? "true" : "")}
            >
              不允许加铁
            </Checkbox>
            <Checkbox
              disabled={disabled}
              checked={value.root.wizard_disallow_reduce_iron === "true"}
              onChange={(e) => setRoot("wizard_disallow_reduce_iron", e.target.checked ? "true" : "")}
            >
              不允许减铁
            </Checkbox>
          </div>
        ) : null}
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <label className="block text-sm">
            <span className="text-slate-700">{wizardMoldFieldLabel("mold_type_id")}</span>
            {dictSelect("mold_type_id")}
          </label>
          <label className="block text-sm">
            <span className="text-slate-700">{wizardMoldFieldLabel("locating_ring_eccentric_id")}</span>
            {dictSelect("locating_ring_eccentric_id")}
          </label>
          <label className="block text-sm">
            <span className="text-slate-700">{wizardMoldFieldLabel("mold_core_eject")}</span>
            <TriYesNo
              value={value.rootBool.mold_core_eject ?? ""}
              onChange={(v) => setRootBool("mold_core_eject", v)}
              disabled={disabled}
            />
          </label>
        </div>
      </div>

      <Divider className="!my-2" />

      <div>
        <Typography.Title level={5} className="!mb-3 !mt-0 text-slate-800">
          板厚
        </Typography.Title>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block text-sm">
            <span className="text-slate-700">{wizardMoldFieldLabel("wizard_cylinder_plate_thickness")}</span>
            <Input
              type="text"
              className={inputBaseClass}
              disabled={disabled}
              value={value.root.wizard_cylinder_plate_thickness ?? ""}
              onChange={(e) => setRoot("wizard_cylinder_plate_thickness", e.target.value)}
              placeholder="如 mm"
            />
          </label>
          <label className="block text-sm">
            <span className="text-slate-700">{wizardMoldFieldLabel("wizard_hot_runner_plate_thickness")}</span>
            <Input
              type="text"
              className={inputBaseClass}
              disabled={disabled}
              value={value.root.wizard_hot_runner_plate_thickness ?? ""}
              onChange={(e) => setRoot("wizard_hot_runner_plate_thickness", e.target.value)}
              placeholder="如 mm"
            />
          </label>
        </div>
      </div>

      <Divider className="!my-2" />

      <div>
        <Typography.Title level={5} className="!mb-3 !mt-0 text-slate-800">
          结构与调节
        </Typography.Title>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block text-sm">
            <span className="text-slate-700">{wizardMoldFieldLabel("runner_plate_style_id")}</span>
            {dictSelect("runner_plate_style_id")}
          </label>
          <label className="block text-sm">
            <span className="text-slate-700">{wizardMoldFieldLabel("plate_thickness_adjustable")}</span>
            <TriYesNo
              value={value.rootBool.plate_thickness_adjustable ?? ""}
              onChange={(v) => setRootBool("plate_thickness_adjustable", v)}
              disabled={disabled}
            />
          </label>
        </div>
      </div>

      <Divider className="!my-2" />

      <div>
        <Typography.Title level={5} className="!mb-3 !mt-0 text-slate-800">
          冷却与客户设备
        </Typography.Title>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block text-sm">
            <span className="text-slate-700">{wizardMoldFieldLabel("cooling_medium_id")}</span>
            {dictSelect("cooling_medium_id")}
          </label>
          <label className="block text-sm">
            <span className="text-slate-700">{wizardMoldFieldLabel("water_oil_connector_position_id")}</span>
            {dictSelect("water_oil_connector_position_id")}
          </label>
          <label className="block text-sm">
            <span className="text-slate-700">{wizardMoldFieldLabel("has_mold_temp_controller")}</span>
            <TriHasNot
              value={value.rootBool.has_mold_temp_controller ?? ""}
              onChange={(v) => setRootBool("has_mold_temp_controller", v)}
              disabled={disabled}
            />
          </label>
          <label className="block text-sm">
            <span className="text-slate-700">{wizardMoldFieldLabel("has_temp_controller_id")}</span>
            {dictSelect("has_temp_controller_id")}
          </label>
          <label className="block text-sm">
            <span className="text-slate-700">{wizardMoldFieldLabel("has_sequence_controller_id")}</span>
            {dictSelect("has_sequence_controller_id")}
          </label>
          <label className="block text-sm">
            <span className="text-slate-700">{wizardMoldFieldLabel("has_booster_pump_id")}</span>
            {dictSelect("has_booster_pump_id")}
          </label>
          <label className="block text-sm">
            <span className="text-slate-700">{wizardMoldFieldLabel("has_multiple_oil_pumps_id")}</span>
            {dictSelect("has_multiple_oil_pumps_id")}
          </label>
        </div>
      </div>
    </div>
  );
}
