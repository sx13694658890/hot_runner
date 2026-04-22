import { useEffect, useMemo, useState } from "react";
import { Alert, Input, Select, Typography } from "antd";

import { ApiError, apiFetch, formatApiDetail } from "@/lib/api";
import { fetchManifoldDetailDictBundle } from "@/lib/selectionCatalogDictApi";
import {
  isMfldCategory,
  MFLD_CATEGORY_FALLBACK_LABELS,
  MFLD_MANIFOLD_BODY_CATEGORY_ORDER,
  MFLD_MANIFOLD_BODY_TEXT_PARTS,
  mfldBodyTextFieldKey,
  mfldCategoryCodeToWizardNormalRootKey,
  mfldCategoryCodeToWizardRootKey,
  type MfldBodyTextVariant,
  sortMfldCategories,
  splitMfldWizardSections,
} from "@/features/selection-catalog/manifoldDetailDictMeta";
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

function wizardRootKeyForMfldCategory(catCode: string, variant: MfldBodyTextVariant): string {
  return variant === "main"
    ? mfldCategoryCodeToWizardRootKey(catCode)
    : mfldCategoryCodeToWizardNormalRootKey(catCode);
}

/**
 * 选型向导第 8 步：分流板大类 — 字典分类下拉 +「分流板主体」「法向分流板」分组（同构）；
 * 字典值写入 `wizard_mfld_*_id` / `wizard_mfld_normal_*_id`，文本写入 `wizard_mfld_body_*_text` /
 * `wizard_mfld_normal_body_*_text`。
 */
export function WizardManifoldCategoryFields({ value, onChange, disabled }: Props) {
  const [bundle, setBundle] = useState<MoldDictBundleResponse["categories"] | null>(null);
  const [categories, setCategories] = useState<SelDictCategoryRead[]>([]);
  const [err, setErr] = useState<string | null>(null);

  const { prefixCodes, suffixCodes } = useMemo(() => splitMfldWizardSections(), []);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      setErr(null);
      try {
        const [b, cats] = await Promise.all([
          fetchManifoldDetailDictBundle(),
          apiFetch<SelDictCategoryRead[]>("/selection-catalog/dict/categories"),
        ]);
        if (cancelled) return;
        setBundle(b);
        setCategories(sortMfldCategories(cats.filter((c) => isMfldCategory(c.code))));
      } catch (e) {
        if (!cancelled) {
          setErr(e instanceof ApiError ? formatApiDetail(e.detail) : "加载分流板大类字典失败");
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

  const renderSelect = (catCode: string, variant: MfldBodyTextVariant) => {
    const fieldKey = wizardRootKeyForMfldCategory(catCode, variant);
    const rowLabel =
      categoryLabelByCode.get(catCode) ?? MFLD_CATEGORY_FALLBACK_LABELS[catCode] ?? catCode;
    const items = bundle?.[catCode] ?? [];
    const opts = sortDictItems(items).map((o) => ({ value: o.id, label: o.label }));
    const rawVal = value.root[fieldKey]?.trim() ?? "";
    const selectValue = rawVal && opts.some((o) => o.value === rawVal) ? rawVal : undefined;
    const loading = bundle === null;

    return (
      <label key={`${variant}-${catCode}`} className="block text-sm">
        <span className="text-slate-700">{wizardMoldFieldLabel(fieldKey)}</span>
        <Select<string>
          allowClear
          showSearch
          optionFilterProp="label"
          placeholder={
            loading
              ? "字典加载中…"
              : opts.length === 0
                ? "暂无字典数据"
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

  const renderBodySection = (variant: MfldBodyTextVariant, title: string, blurb: string) => (
    <section className="rounded-lg border border-slate-200 bg-slate-50/70 p-4 shadow-sm">
      <Typography.Title level={5} className="!mb-1 !mt-0 text-slate-800">
        {title}
      </Typography.Title>
      <Typography.Paragraph type="secondary" className="!mb-3 !mt-0 text-xs">
        {blurb}
      </Typography.Paragraph>
      <div className="grid gap-3 sm:grid-cols-2">
        {MFLD_MANIFOLD_BODY_CATEGORY_ORDER.map((code) => renderSelect(code, variant))}
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {MFLD_MANIFOLD_BODY_TEXT_PARTS.map(({ part, placeholder }) => {
          const key = mfldBodyTextFieldKey(part, variant);
          return (
            <label key={`${variant}-${part}`} className="block text-sm">
              <span className="text-slate-700">{wizardMoldFieldLabel(key)}</span>
              <Input
                allowClear
                disabled={disabled}
                placeholder={placeholder}
                className={inputBaseClass}
                value={value.root[key] ?? ""}
                onChange={(e) => setRootField(key, e.target.value)}
              />
            </label>
          );
        })}
      </div>
    </section>
  );

  return (
    <div className="space-y-6">
      <Typography.Text type="secondary" className="text-xs">
        数据来自「分流板大类」扩展字典（<Typography.Text code>hrspec_mfld_*</Typography.Text>
        ）；与扁平行热流道规格字段独立。桥板与属性类在上方；主体与法向分流板结构相同、草稿键独立；线架（水/油接头、规格标牌、水路版等）在下方。
      </Typography.Text>

      {err ? <Alert type="error" showIcon message={err} /> : null}

      <div className="grid gap-3 sm:grid-cols-2">{prefixCodes.map((c) => renderSelect(c, "main"))}</div>

      {renderBodySection(
        "main",
        "分流板主体",
        "厚度、流道走向、分流板流道直径、点位编码、流道层数；垫块、板上碟簧、中心定位销、防转销；堵头（常规 / 平面 / 镶件各型）；流道孔预膨胀及盘条、陶瓷接口、引线、感温线、铜条等补充说明。",
      )}

      {renderBodySection(
        "normal",
        "法向分流板",
        "与「分流板主体」字段一一对应，选项复用同一套字典；填写法向布置时的选型与说明。",
      )}

      <div className="grid gap-3 sm:grid-cols-2">{suffixCodes.map((c) => renderSelect(c, "main"))}</div>
    </div>
  );
}
