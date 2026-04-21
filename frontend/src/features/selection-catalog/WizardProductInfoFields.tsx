import { useEffect, useState } from "react";
import { Alert, Input, Select, Typography } from "antd";

import { ApiError, apiFetch, formatApiDetail } from "@/lib/api";
import { fetchMoldDictBundle } from "@/lib/selectionCatalogDictApi";
import {
  PRODUCT_FIELD_META,
  productDictCategoryCode,
} from "@/lib/selectionCatalogMoldPayload";
import type {
  MoldDictBundleResponse,
  SelMaterialMasterRead,
  SelMaterialPropertyFlatRead,
  SelPlasticGradeRead,
} from "@/lib/selectionCatalogTypes";
import {
  type WizardProductForm,
  WIZARD_PRODUCT_MATERIAL_ID_KEY,
  WIZARD_PRODUCT_PLASTIC_GRADE_ID_KEY,
} from "@/features/selection-catalog/wizardDraftStorage";

const inputBaseClass = "mt-1 w-full rounded border border-slate-200 px-2 py-1.5 text-sm";

/** 选型向导：牌号选定后展示的工艺属性（与领域表维护一致，只读） */
const WIZARD_PLASTIC_GRADE_PROP_CELLS: {
  key: keyof Pick<
    SelMaterialPropertyFlatRead,
    | "mold_temp"
    | "melt_temp"
    | "degradation_temp"
    | "molding_window"
    | "viscosity"
    | "metal_corrosion"
  >;
  label: string;
}[] = [
  { key: "mold_temp", label: "模温℃" },
  { key: "melt_temp", label: "熔融℃" },
  { key: "degradation_temp", label: "降解℃" },
  { key: "molding_window", label: "成型窗口δ" },
  { key: "viscosity", label: "粘度" },
  { key: "metal_corrosion", label: "腐蚀性" },
];

function fmtPropCell(v: string | number | null | undefined): string {
  if (v === null || v === undefined || v === "") return "—";
  return String(v);
}

type Props = {
  value: WizardProductForm;
  onChange: (next: WizardProductForm) => void;
  disabled: boolean;
};

/**
 * 与 {@link SelectionCatalogMoldFormPage} 中「填写产品信息」勾选后的网格一致：PRODUCT_FIELD_META + mold-options 字典。
 */
export function WizardProductInfoFields({ value, onChange, disabled }: Props) {
  const [dictBundle, setDictBundle] = useState<MoldDictBundleResponse["categories"] | null>(null);
  const [materials, setMaterials] = useState<SelMaterialMasterRead[]>([]);
  const [loadingMaterials, setLoadingMaterials] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [materialErr, setMaterialErr] = useState<string | null>(null);
  const [grades, setGrades] = useState<SelPlasticGradeRead[]>([]);
  const [loadingGrades, setLoadingGrades] = useState(false);
  const [gradeErr, setGradeErr] = useState<string | null>(null);
  const [gradeProperty, setGradeProperty] = useState<SelMaterialPropertyFlatRead | null>(null);
  const [loadingGradeProperty, setLoadingGradeProperty] = useState(false);
  const [gradePropertyErr, setGradePropertyErr] = useState<string | null>(null);

  const materialId = (value[WIZARD_PRODUCT_MATERIAL_ID_KEY] ?? "").trim();
  const plasticGradeId = (value[WIZARD_PRODUCT_PLASTIC_GRADE_ID_KEY] ?? "").trim();

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

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      setLoadingMaterials(true);
      try {
        const q = new URLSearchParams({ skip: "0", limit: "500" });
        const rows = await apiFetch<SelMaterialMasterRead[]>(`/selection-catalog/materials-master?${q.toString()}`);
        if (!cancelled) {
          setMaterialErr(null);
          setMaterials(rows.filter((m) => m.is_active));
        }
      } catch (e) {
        if (!cancelled) {
          setMaterialErr(e instanceof ApiError ? formatApiDetail(e.detail) : "加载材料主表失败");
          setMaterials([]);
        }
      } finally {
        if (!cancelled) setLoadingMaterials(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!materialId) {
      setGrades([]);
      setGradeErr(null);
      setLoadingGrades(false);
      return;
    }
    let cancelled = false;
    void (async () => {
      setLoadingGrades(true);
      setGradeErr(null);
      try {
        const q = new URLSearchParams({
          material_id: materialId,
          skip: "0",
          limit: "500",
        });
        const rows = await apiFetch<SelPlasticGradeRead[]>(
          `/selection-catalog/plastic-grades?${q.toString()}`,
        );
        if (!cancelled) {
          setGrades(rows.filter((g) => g.is_active));
        }
      } catch (e) {
        if (!cancelled) {
          setGradeErr(e instanceof ApiError ? formatApiDetail(e.detail) : "加载塑料牌号失败");
          setGrades([]);
        }
      } finally {
        if (!cancelled) setLoadingGrades(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [materialId]);

  useEffect(() => {
    if (!plasticGradeId) {
      setGradeProperty(null);
      setGradePropertyErr(null);
      setLoadingGradeProperty(false);
      return;
    }
    let cancelled = false;
    void (async () => {
      setLoadingGradeProperty(true);
      setGradePropertyErr(null);
      try {
        const q = new URLSearchParams({
          plastic_grade_id: plasticGradeId,
          skip: "0",
          limit: "5",
        });
        const rows = await apiFetch<SelMaterialPropertyFlatRead[]>(
          `/selection-catalog/material-properties?${q.toString()}`,
        );
        if (!cancelled) {
          setGradeProperty(rows[0] ?? null);
        }
      } catch (e) {
        if (!cancelled) {
          setGradePropertyErr(
            e instanceof ApiError ? formatApiDetail(e.detail) : "加载牌号工艺属性失败",
          );
          setGradeProperty(null);
        }
      } finally {
        if (!cancelled) setLoadingGradeProperty(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [plasticGradeId]);

  const patch = (key: string, v: string) => {
    onChange({ ...value, [key]: v });
  };

  return (
    <div className="space-y-4">
      <Typography.Text type="secondary" className="text-xs">
        字段与 <Typography.Text code>sel_product_info</Typography.Text>、
        <Typography.Text code>GET …/dict/mold-options</Typography.Text> 中{" "}
        <Typography.Text code>product_*</Typography.Text> 分类一致；「产品材质」来自{" "}
        <Typography.Text code>GET …/materials-master</Typography.Text>；二级「塑料牌号」来自{" "}
        <Typography.Text code>GET …/plastic-grades?material_id=…</Typography.Text>（材料 1:N）。草稿字段{" "}
        <Typography.Text code>material_id</Typography.Text>、<Typography.Text code>plastic_grade_id</Typography.Text>。
      </Typography.Text>

      {err ? <Alert type="error" showIcon message={err} /> : null}
      {materialErr ? <Alert type="error" showIcon message={materialErr} /> : null}
      {gradeErr ? <Alert type="error" showIcon message={gradeErr} /> : null}
      {gradePropertyErr ? <Alert type="error" showIcon message={gradePropertyErr} /> : null}

      <div className="grid max-w-3xl gap-3 sm:grid-cols-2">
        <label className="block text-sm">
          <span className="text-slate-700">产品材质</span>
          <Select<string>
            allowClear
            showSearch
            optionFilterProp="label"
            placeholder={loadingMaterials ? "材料主表加载中…" : "请选择材料（缩写）"}
            disabled={disabled || loadingMaterials}
            loading={loadingMaterials}
            className={`${inputBaseClass} [&_.ant-select-selector]:rounded [&_.ant-select-selector]:border-slate-200`}
            value={value[WIZARD_PRODUCT_MATERIAL_ID_KEY] || undefined}
            onChange={(nv) => {
              const nextMat = nv ?? "";
              onChange({
                ...value,
                [WIZARD_PRODUCT_MATERIAL_ID_KEY]: nextMat,
                [WIZARD_PRODUCT_PLASTIC_GRADE_ID_KEY]: "",
              });
            }}
            options={materials.map((m) => ({
              value: m.id,
              label: m.abbreviation,
            }))}
            popupMatchSelectWidth={false}
          />
        </label>
        <label className="block text-sm">
          <span className="text-slate-700">塑料牌号</span>
          <Select<string>
            allowClear
            showSearch
            optionFilterProp="label"
            placeholder={
              !materialId
                ? "请先选择产品材质"
                : loadingGrades
                  ? "牌号加载中…"
                  : "请选择塑料牌号"
            }
            disabled={disabled || !materialId || loadingGrades}
            loading={loadingGrades}
            className={`${inputBaseClass} [&_.ant-select-selector]:rounded [&_.ant-select-selector]:border-slate-200`}
            value={value[WIZARD_PRODUCT_PLASTIC_GRADE_ID_KEY] || undefined}
            onChange={(nv) => patch(WIZARD_PRODUCT_PLASTIC_GRADE_ID_KEY, nv ?? "")}
            options={grades.map((g) => ({
              value: g.id,
              label: g.label,
            }))}
            popupMatchSelectWidth={false}
          />
        </label>
      </div>

      {plasticGradeId ? (
        <div className="max-w-3xl rounded-lg border border-slate-200 bg-slate-50/60 px-4 py-3">
          <div className="mb-2 text-sm font-medium text-slate-800">材料工艺属性（只读）</div>
          {loadingGradeProperty ? (
            <Typography.Text type="secondary" className="text-xs">
              属性加载中…
            </Typography.Text>
          ) : gradeProperty ? (
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {WIZARD_PLASTIC_GRADE_PROP_CELLS.map(({ key, label }) => (
                <div
                  key={key}
                  className="rounded-md border border-slate-100 bg-white px-3 py-2 shadow-sm"
                >
                  <div className="text-xs text-slate-500">{label}</div>
                  <div className="mt-0.5 text-sm font-medium text-slate-800">
                    {fmtPropCell(gradeProperty[key])}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <Typography.Text type="secondary" className="text-xs">
              该塑料牌号暂无工艺属性数据（可在领域表「材料属性」中维护）。
            </Typography.Text>
          )}
        </div>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2">
        {PRODUCT_FIELD_META.map((m) => (
          <label key={m.key} className="block text-sm">
            <span className="text-slate-600">{m.label}</span>
            {m.kind === "dict" ? (
              <Select<string>
                allowClear
                placeholder={dictBundle === null ? "字典加载中…" : undefined}
                disabled={disabled || dictBundle === null}
                loading={dictBundle === null}
                className={`${inputBaseClass} [&_.ant-select-selector]:rounded [&_.ant-select-selector]:border-slate-200`}
                value={value[m.key] || undefined}
                onChange={(nv) => patch(m.key, nv ?? "")}
                options={(dictBundle?.[productDictCategoryCode(m.key)] ?? []).map((o) => ({
                  value: o.id,
                  label: o.label,
                }))}
                popupMatchSelectWidth={false}
              />
            ) : m.kind === "dec" ? (
              <Input
                type="number"
                step="any"
                className={inputBaseClass}
                disabled={disabled}
                value={value[m.key] ?? ""}
                onChange={(e) => patch(m.key, e.target.value)}
              />
            ) : (
              <Input
                className={inputBaseClass}
                disabled={disabled}
                value={value[m.key] ?? ""}
                onChange={(e) => patch(m.key, e.target.value)}
              />
            )}
          </label>
        ))}
      </div>
    </div>
  );
}
