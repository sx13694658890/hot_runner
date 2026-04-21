import { useEffect, useState } from "react";
import { Alert, Select, Typography } from "antd";

import { ApiError, apiFetch, formatApiDetail } from "@/lib/api";
import { wizardMoldFieldLabel } from "@/lib/selectionCatalogMoldPayload";
import type {
  SelDictItemRead,
  SelInjectionMachineModelRead,
  SelInjectionMachineModelSpecFlatRead,
} from "@/lib/selectionCatalogTypes";

/** 与 sel_mold_dict、向导第 1 步 dict/items 用法一致（便于网络面板可见） */
const INJECTION_MACHINE_BRAND_CATEGORY = "injection_machine_brand";
const CUSTOMER_EQUIPMENT_LIBRARY_CATEGORY = "customer_equipment_library";

const inputBaseClass = "mt-1 w-full rounded border border-slate-200 px-2 py-1.5 text-sm";

/** 与产品步「材料工艺属性」展示风格一致：机型参数只读网格（详情页可复用） */
export const IM_SPEC_DISPLAY_CELLS: {
  key: keyof Pick<
    SelInjectionMachineModelSpecFlatRead,
    | "clamp_force_ton"
    | "screw_diameter_mm"
    | "tie_bar_horizontal_mm"
    | "tie_bar_vertical_mm"
    | "min_mold_thickness_mm"
    | "max_mold_thickness_mm"
    | "max_opening_stroke_mm"
    | "max_injection_pressure_mpa"
    | "nozzle_sphere_radius_mm"
  >;
  label: string;
}[] = [
  { key: "clamp_force_ton", label: "锁模力(t)" },
  { key: "screw_diameter_mm", label: "螺杆直径(mm)" },
  { key: "tie_bar_horizontal_mm", label: "格林柱距横(mm)" },
  { key: "tie_bar_vertical_mm", label: "格林柱距纵(mm)" },
  { key: "min_mold_thickness_mm", label: "最薄模厚(mm)" },
  { key: "max_mold_thickness_mm", label: "最大模厚(mm)" },
  { key: "max_opening_stroke_mm", label: "最大开模行程(mm)" },
  { key: "max_injection_pressure_mpa", label: "最大射压(MPa)" },
  { key: "nozzle_sphere_radius_mm", label: "喷嘴球头半径(mm)" },
];

function fmtCell(v: string | number | null | undefined): string {
  if (v === null || v === undefined || v === "") return "—";
  return String(v);
}

type Props = {
  root: Record<string, string>;
  setRoot: (key: string, v: string) => void;
  disabled: boolean;
};

/**
 * 注塑机品牌（字典）→ 型号（sel_injection_machine_model）→ 参数（sel_injection_machine_model_spec）；
 * 客户设备库（字典 customer_equipment_library）独立可选。
 */
export function InjectionMachineCatalogFields({ root, setRoot, disabled }: Props) {
  const [brandItems, setBrandItems] = useState<SelDictItemRead[]>([]);
  const [loadingBrands, setLoadingBrands] = useState(true);
  const [brandDictErr, setBrandDictErr] = useState<string | null>(null);
  const [equipmentItems, setEquipmentItems] = useState<SelDictItemRead[]>([]);
  const [loadingEquipment, setLoadingEquipment] = useState(true);
  const [equipmentDictErr, setEquipmentDictErr] = useState<string | null>(null);
  const [models, setModels] = useState<SelInjectionMachineModelRead[]>([]);
  const [loadingModels, setLoadingModels] = useState(false);
  const [modelsErr, setModelsErr] = useState<string | null>(null);
  const [specRow, setSpecRow] = useState<SelInjectionMachineModelSpecFlatRead | null>(null);
  const [loadingSpec, setLoadingSpec] = useState(false);
  const [specErr, setSpecErr] = useState<string | null>(null);

  const brandKey = "injection_machine_brand_id";
  const equipmentKey = "customer_equipment_library_id";
  const brandId = (root[brandKey] ?? "").trim();
  const modelId = (root.injection_machine_model_id ?? "").trim();

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      setBrandDictErr(null);
      setLoadingBrands(true);
      try {
        const q = new URLSearchParams({
          category_code: INJECTION_MACHINE_BRAND_CATEGORY,
          include_inactive: "true",
        });
        const rows = await apiFetch<SelDictItemRead[]>(`/selection-catalog/dict/items?${q.toString()}`);
        if (!cancelled) setBrandItems(rows.filter((r) => r.is_active));
      } catch (e) {
        if (!cancelled) {
          setBrandDictErr(
            e instanceof ApiError ? formatApiDetail(e.detail) : "加载注塑机品牌字典失败",
          );
          setBrandItems([]);
        }
      } finally {
        if (!cancelled) setLoadingBrands(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      setEquipmentDictErr(null);
      setLoadingEquipment(true);
      try {
        const q = new URLSearchParams({
          category_code: CUSTOMER_EQUIPMENT_LIBRARY_CATEGORY,
          include_inactive: "true",
        });
        const rows = await apiFetch<SelDictItemRead[]>(`/selection-catalog/dict/items?${q.toString()}`);
        if (!cancelled) setEquipmentItems(rows.filter((r) => r.is_active));
      } catch (e) {
        if (!cancelled) {
          setEquipmentDictErr(
            e instanceof ApiError ? formatApiDetail(e.detail) : "加载客户设备库字典失败",
          );
          setEquipmentItems([]);
        }
      } finally {
        if (!cancelled) setLoadingEquipment(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!brandId) {
      setModels([]);
      setModelsErr(null);
      setLoadingModels(false);
      return;
    }
    let cancelled = false;
    void (async () => {
      setLoadingModels(true);
      setModelsErr(null);
      try {
        const q = new URLSearchParams({
          brand_dict_item_id: brandId,
          skip: "0",
          limit: "500",
        });
        const rows = await apiFetch<SelInjectionMachineModelRead[]>(
          `/selection-catalog/injection-machine-models?${q.toString()}`,
        );
        if (!cancelled) setModels(rows.filter((m) => m.is_active));
      } catch (e) {
        if (!cancelled) {
          setModelsErr(e instanceof ApiError ? formatApiDetail(e.detail) : "加载注塑机型号失败");
          setModels([]);
        }
      } finally {
        if (!cancelled) setLoadingModels(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [brandId]);

  useEffect(() => {
    if (!modelId) {
      setSpecRow(null);
      setSpecErr(null);
      setLoadingSpec(false);
      return;
    }
    let cancelled = false;
    void (async () => {
      setLoadingSpec(true);
      setSpecErr(null);
      try {
        const q = new URLSearchParams({ model_id: modelId, skip: "0", limit: "5" });
        const rows = await apiFetch<SelInjectionMachineModelSpecFlatRead[]>(
          `/selection-catalog/injection-machine-model-specs?${q.toString()}`,
        );
        if (!cancelled) setSpecRow(rows[0] ?? null);
      } catch (e) {
        if (!cancelled) {
          setSpecErr(e instanceof ApiError ? formatApiDetail(e.detail) : "加载机型参数失败");
          setSpecRow(null);
        }
      } finally {
        if (!cancelled) setLoadingSpec(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [modelId]);

  const onBrandChange = (nv: string) => {
    const next = nv ?? "";
    setRoot(brandKey, next);
    setRoot("injection_machine_model_id", "");
  };

  return (
    <div className="space-y-4">
      {brandDictErr ? <Alert type="error" showIcon message={brandDictErr} /> : null}
      {equipmentDictErr ? <Alert type="error" showIcon message={equipmentDictErr} /> : null}
      {modelsErr ? <Alert type="error" showIcon message={modelsErr} /> : null}
      {specErr ? <Alert type="error" showIcon message={specErr} /> : null}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <label className="block text-sm">
          <span className="text-slate-700">{wizardMoldFieldLabel(brandKey)}</span>
          <Select<string>
            allowClear
            showSearch
            optionFilterProp="label"
            placeholder={loadingBrands ? "字典加载中…" : "请选择注塑机品牌"}
            disabled={disabled || loadingBrands}
            loading={loadingBrands}
            className={`${inputBaseClass} [&_.ant-select-selector]:rounded [&_.ant-select-selector]:border-slate-200`}
            value={root[brandKey] || undefined}
            onChange={(nv) => onBrandChange(nv ?? "")}
            options={brandItems.map((o) => ({ value: o.id, label: o.label }))}
            popupMatchSelectWidth={false}
          />
        </label>
        <label className="block text-sm">
          <span className="text-slate-700">{wizardMoldFieldLabel("injection_machine_model_id")}</span>
          <Select<string>
            allowClear
            showSearch
            optionFilterProp="label"
            placeholder={
              !brandId ? "请先选择品牌" : loadingModels ? "型号加载中…" : "请选择注塑机型号"
            }
            disabled={disabled || !brandId}
            loading={loadingModels}
            className={`${inputBaseClass} [&_.ant-select-selector]:rounded [&_.ant-select-selector]:border-slate-200`}
            value={root.injection_machine_model_id || undefined}
            onChange={(nv) => setRoot("injection_machine_model_id", nv ?? "")}
            options={models.map((m) => ({ value: m.id, label: m.label }))}
            popupMatchSelectWidth={false}
          />
        </label>
        <label className="block text-sm">
          <span className="text-slate-700">{wizardMoldFieldLabel(equipmentKey)}</span>
          <Select<string>
            allowClear
            showSearch
            optionFilterProp="label"
            placeholder={loadingEquipment ? "字典加载中…" : "请选择客户设备库中的机器"}
            disabled={disabled || loadingEquipment}
            loading={loadingEquipment}
            className={`${inputBaseClass} [&_.ant-select-selector]:rounded [&_.ant-select-selector]:border-slate-200`}
            value={root[equipmentKey] || undefined}
            onChange={(nv) => setRoot(equipmentKey, nv ?? "")}
            options={equipmentItems.map((o) => ({ value: o.id, label: o.label }))}
            popupMatchSelectWidth={false}
          />
        </label>
      </div>

      {modelId ? (
        <div className="rounded-lg border border-slate-200 bg-slate-50/60 px-4 py-3">
          <div className="mb-2 text-sm font-medium text-slate-800">机型技术参数（只读）</div>
          {loadingSpec ? (
            <Typography.Text type="secondary" className="text-xs">
              参数加载中…
            </Typography.Text>
          ) : specRow ? (
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {IM_SPEC_DISPLAY_CELLS.map(({ key, label }) => (
                <div
                  key={key}
                  className="rounded-md border border-slate-100 bg-white px-3 py-2 shadow-sm"
                >
                  <div className="text-xs text-slate-500">{label}</div>
                  <div className="mt-0.5 text-sm font-medium text-slate-800">
                    {fmtCell(specRow[key])}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <Typography.Text type="secondary" className="text-xs">
              该型号暂无参数数据（可在后端表 sel_injection_machine_model_spec 中维护）。
            </Typography.Text>
          )}
        </div>
      ) : null}
    </div>
  );
}
