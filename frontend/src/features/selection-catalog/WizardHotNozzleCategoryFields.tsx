import { useEffect, useMemo, useState } from "react";
import { Alert, Select, Typography } from "antd";

import { ApiError, apiFetch, formatApiDetail } from "@/lib/api";
import { fetchHotNozzleDetailDictBundle } from "@/lib/selectionCatalogDictApi";
import {
  HNZ_CATEGORY_FALLBACK_LABELS,
  HNZ_CATEGORY_ORDER,
  hnzCategoryCodeToWizardRootKey,
  isHnzCategory,
  sortHnzCategories,
  splitHnzWizardStructureBlock,
} from "@/features/selection-catalog/hotNozzleDetailDictMeta";
import type { MoldDictBundleResponse, SelDictCategoryRead } from "@/lib/selectionCatalogTypes";
import { type WizardMoldForm, wizardMoldFieldLabel } from "@/lib/selectionCatalogMoldPayload";

const inputBaseClass = "mt-1 w-full rounded border border-slate-200 px-2 py-1.5 text-sm";

type Props = {
  value: WizardMoldForm;
  onChange: (next: WizardMoldForm | ((prev: WizardMoldForm) => WizardMoldForm)) => void;
  disabled: boolean;
};

function sortDictItems(items: { id: string; label: string; sort_order: number }[]) {
  return [...items].sort((a, b) => {
    if (a.sort_order !== b.sort_order) return a.sort_order - b.sort_order;
    return a.label.localeCompare(b.label);
  });
}

/**
 * 选型向导第 9 步：热咀大类 — 按 `hrspec_hnz_*` 各分类分别一个可搜索下拉；
 * 「热咀结构代码」下分开放式/针阀式 × 大水口/点胶口四个子类。选中值写入 `moldDraft.root.wizard_hnz_<后缀>_id`。
 */
export function WizardHotNozzleCategoryFields({ value, onChange, disabled }: Props) {
  const [bundle, setBundle] = useState<MoldDictBundleResponse["categories"] | null>(null);
  const [categories, setCategories] = useState<SelDictCategoryRead[]>([]);
  const [err, setErr] = useState<string | null>(null);

  const { beforeCodes, structureCodes, afterCodes } = useMemo(
    () => splitHnzWizardStructureBlock(HNZ_CATEGORY_ORDER),
    [],
  );

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      setErr(null);
      try {
        const [b, cats] = await Promise.all([
          fetchHotNozzleDetailDictBundle(),
          apiFetch<SelDictCategoryRead[]>("/selection-catalog/dict/categories"),
        ]);
        if (cancelled) return;
        setBundle(b);
        setCategories(sortHnzCategories(cats.filter((c) => isHnzCategory(c.code))));
      } catch (e) {
        if (!cancelled) {
          setErr(e instanceof ApiError ? formatApiDetail(e.detail) : "加载热咀大类字典失败");
          setBundle({});
          setCategories([]);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const categoryLabelByCode = useMemo(() => {
    const m = new Map<string, string>();
    for (const c of categories) {
      m.set(c.code, c.label);
    }
    return m;
  }, [categories]);

  const setRootField = (fieldKey: string, v: string) => {
    onChange((prev) => ({ ...prev, root: { ...prev.root, [fieldKey]: v } }));
  };

  const renderSelect = (catCode: string) => {
    const fieldKey = hnzCategoryCodeToWizardRootKey(catCode);
    const rowLabel =
      categoryLabelByCode.get(catCode) ?? HNZ_CATEGORY_FALLBACK_LABELS[catCode] ?? catCode;
    const items = bundle?.[catCode] ?? [];
    const opts = sortDictItems(items).map((o) => ({ value: o.id, label: o.label }));
    const rawVal = value.root[fieldKey]?.trim() ?? "";
    const selectValue = rawVal && opts.some((o) => o.value === rawVal) ? rawVal : undefined;
    const loading = bundle === null;

    return (
      <label key={catCode} className="block text-sm">
        <span className="text-slate-700">{wizardMoldFieldLabel(fieldKey)}</span>
        <Select<string>
          allowClear
          showSearch
          optionFilterProp="label"
          placeholder={
            loading
              ? "字典加载中…"
              : opts.length === 0
                ? "暂无字典项"
                : `请选择${rowLabel}`
          }
          disabled={disabled || loading || opts.length === 0}
          loading={loading}
          className={`${inputBaseClass} [&_.ant-select-selector]:rounded [&_.ant-select-selector]:border-slate-200`}
          value={selectValue}
          onChange={(nv) => setRootField(fieldKey, nv ?? "")}
          options={opts}
          popupMatchSelectWidth={false}
        />
      </label>
    );
  };

  const renderGrid = (codes: string[]) => (
    <div className="grid gap-3 sm:grid-cols-2">{codes.map(renderSelect)}</div>
  );

  return (
    <div className="space-y-4">
      <Typography.Text type="secondary" className="text-xs">
        数据来自「热咀大类」扩展字典（<Typography.Text code>hrspec_hnz_*</Typography.Text>
        ）；与扁平行热流道规格中热咀相关字段独立。热咀结构代码按开放式/针阀式与大水口/点胶口拆为四个下拉，其余字段各对应一个分类。
      </Typography.Text>

      {err ? <Alert type="error" showIcon message={err} /> : null}

      {renderGrid(beforeCodes)}

      {structureCodes.length > 0 ? (
        <section className="rounded-lg border border-slate-200 bg-slate-50/70 p-4 shadow-sm">
          <Typography.Title level={5} className="!mb-2 !mt-0 text-slate-800">
            热咀结构代码
          </Typography.Title>
          <Typography.Paragraph type="secondary" className="!mb-3 !mt-0 text-xs">
            开放式-大水口、开放式-点胶口、针阀式-大水口、针阀式-点胶口；选项为各型式下的结构代号。
          </Typography.Paragraph>
          <div className="grid gap-3 sm:grid-cols-2">{structureCodes.map(renderSelect)}</div>
        </section>
      ) : null}

      {renderGrid(afterCodes)}
    </div>
  );
}
