import { useEffect, useMemo, useState } from "react";
import { Alert, Select, Typography } from "antd";

import { ApiError, apiFetch, formatApiDetail } from "@/lib/api";
import { fetchMainNozzleDetailDictBundle } from "@/lib/selectionCatalogDictApi";
import {
  isMnzCategory,
  MNZ_CATEGORY_FALLBACK_LABELS,
  MNZ_CATEGORY_ORDER,
  mnzCategoryCodeToWizardRootKey,
  sortMnzCategories,
} from "@/features/selection-catalog/mainNozzleDetailDictMeta";
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
 * 选型向导第 7 步：主射咀大类 — 按 `hrspec_mnz_*` 各分类分别一个可搜索下拉（与前几步字典字段一致），
 * 选中值写入 `moldDraft.root.wizard_mnz_<后缀>_id`。
 */
export function WizardMainNozzleCategoryFields({ value, onChange, disabled }: Props) {
  const [bundle, setBundle] = useState<MoldDictBundleResponse["categories"] | null>(null);
  const [categories, setCategories] = useState<SelDictCategoryRead[]>([]);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      setErr(null);
      try {
        const [b, cats] = await Promise.all([
          fetchMainNozzleDetailDictBundle(),
          apiFetch<SelDictCategoryRead[]>("/selection-catalog/dict/categories"),
        ]);
        if (cancelled) return;
        setBundle(b);
        setCategories(sortMnzCategories(cats.filter((c) => isMnzCategory(c.code))));
      } catch (e) {
        if (!cancelled) {
          setErr(e instanceof ApiError ? formatApiDetail(e.detail) : "加载主射咀大类字典失败");
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

  return (
    <div className="space-y-4">
      <Typography.Text type="secondary" className="text-xs">
        数据来自「主射咀大类」扩展字典（<Typography.Text code>hrspec_mnz_*</Typography.Text>
        ）；与热流道规格扁平行主射咀字段独立。每一分类对应一个下拉，选项为该分类下字典项。
      </Typography.Text>

      {err ? <Alert type="error" showIcon message={err} /> : null}

      <div className="grid gap-3 sm:grid-cols-2">
        {MNZ_CATEGORY_ORDER.map((catCode) => {
          const fieldKey = mnzCategoryCodeToWizardRootKey(catCode);
          const rowLabel =
            categoryLabelByCode.get(catCode) ?? MNZ_CATEGORY_FALLBACK_LABELS[catCode] ?? catCode;
          const items = bundle?.[catCode] ?? [];
          const opts = sortDictItems(items).map((o) => ({ value: o.id, label: o.label }));
          const rawVal = value.root[fieldKey]?.trim() ?? "";
          const selectValue =
            rawVal && opts.some((o) => o.value === rawVal) ? rawVal : undefined;
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
        })}
      </div>
    </div>
  );
}
