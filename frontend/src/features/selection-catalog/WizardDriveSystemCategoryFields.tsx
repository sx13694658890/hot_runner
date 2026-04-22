import { useEffect, useMemo, useState } from "react";
import { Alert, Select, Typography } from "antd";

import { ApiError, apiFetch, formatApiDetail } from "@/lib/api";
import { fetchDriveSystemDetailDictBundle } from "@/lib/selectionCatalogDictApi";
import {
  DRV_CATEGORY_FALLBACK_LABELS,
  DRV_CATEGORY_ORDER,
  drvCategoryCodeToWizardRootKey,
  isDrvCategory,
  sortDrvCategories,
  splitDrvWizardPlateActuatorBlock,
} from "@/features/selection-catalog/driveSystemDetailDictMeta";
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
 * 选型向导第 9 步（下栏）：驱动系统 — 按 `hrspec_drv_*` 各分类分别一个可搜索下拉；
 * 「气缸板上开孔的驱动器」下按 HS40 / FEP30 / VC58～VC88 分型号选 BOM 零件。选中值写入 `moldDraft.root.wizard_drv_<后缀>_id`。
 */
export function WizardDriveSystemCategoryFields({ value, onChange, disabled }: Props) {
  const [bundle, setBundle] = useState<MoldDictBundleResponse["categories"] | null>(null);
  const [categories, setCategories] = useState<SelDictCategoryRead[]>([]);
  const [err, setErr] = useState<string | null>(null);

  const { beforeCodes, plateActuatorCodes, afterCodes } = useMemo(
    () => splitDrvWizardPlateActuatorBlock(DRV_CATEGORY_ORDER),
    [],
  );

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      setErr(null);
      try {
        const [b, cats] = await Promise.all([
          fetchDriveSystemDetailDictBundle(),
          apiFetch<SelDictCategoryRead[]>("/selection-catalog/dict/categories"),
        ]);
        if (cancelled) return;
        setBundle(b);
        setCategories(sortDrvCategories(cats.filter((c) => isDrvCategory(c.code))));
      } catch (e) {
        if (!cancelled) {
          setErr(e instanceof ApiError ? formatApiDetail(e.detail) : "加载驱动系统字典失败");
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
    const fieldKey = drvCategoryCodeToWizardRootKey(catCode);
    const rowLabel =
      categoryLabelByCode.get(catCode) ?? DRV_CATEGORY_FALLBACK_LABELS[catCode] ?? catCode;
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
    <section className="rounded-lg border border-slate-200 bg-slate-50/70 p-4 shadow-sm">
      <Typography.Title level={5} className="!mb-2 !mt-0 text-slate-800">
        驱动系统
      </Typography.Title>
      <Typography.Paragraph type="secondary" className="!mb-3 !mt-0 text-xs">
        数据来自「驱动系统」扩展字典（<Typography.Text code>hrspec_drv_*</Typography.Text>
        ）；与扁平行阀针规格等独立。
      </Typography.Paragraph>

      {err ? <Alert type="error" showIcon message={err} className="mb-3" /> : null}

      {renderGrid(beforeCodes)}

      {plateActuatorCodes.length > 0 ? (
        <section className="mb-4 rounded-md border border-slate-200/80 bg-white/60 p-3">
          <Typography.Title level={5} className="!mb-2 !mt-0 text-slate-800">
            气缸板上开孔的驱动器
          </Typography.Title>
          <Typography.Paragraph type="secondary" className="!mb-3 !mt-0 text-xs">
            HS40、FEP30、VC58～VC88 各型号对应 BOM 零件（缸盖、缸体、活塞、挂针块、调节块等；FEP30 另含活塞外套）。
          </Typography.Paragraph>
          <div className="grid gap-3 sm:grid-cols-2">{plateActuatorCodes.map(renderSelect)}</div>
        </section>
      ) : null}

      {renderGrid(afterCodes)}
    </section>
  );
}
