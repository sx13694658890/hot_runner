import { useEffect, useState } from "react";
import { Alert, Input, Select, Spin, Typography } from "antd";

import { ApiError, apiFetch, formatApiDetail } from "@/lib/api";
import type { SelDictItemRead } from "@/lib/selectionCatalogTypes";
import type { WizardProjectInfo } from "@/features/selection-catalog/wizardDraftStorage";

/** 与 backend sel_mold_dict、GET …/dict/items?category_code= 一致 */
const ORDER_REQUIREMENT_CATEGORY = "order_requirement";

type Props = {
  value: WizardProjectInfo;
  onChange: (next: WizardProjectInfo) => void;
  disabled: boolean;
};

export function WizardProjectInfoFields({ value, onChange, disabled }: Props) {
  const [items, setItems] = useState<SelDictItemRead[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      setErr(null);
      setLoading(true);
      try {
        const q = new URLSearchParams({
          category_code: ORDER_REQUIREMENT_CATEGORY,
          include_inactive: "true",
        });
        const rows = await apiFetch<SelDictItemRead[]>(`/selection-catalog/dict/items?${q.toString()}`);
        if (!cancelled) setItems(rows.filter((r) => r.is_active));
      } catch (e) {
        if (!cancelled) {
          setErr(e instanceof ApiError ? formatApiDetail(e.detail) : "加载订单需求字典失败");
          setItems([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const patch = (partial: Partial<WizardProjectInfo>) => {
    onChange({ ...value, ...partial });
  };

  const inputCls = "mt-1 w-full rounded border border-slate-200 px-2 py-1.5 text-sm";

  return (
    <div className="space-y-4 max-w-xl">
      <Typography.Text type="secondary" className="text-xs">
        字典分类 <Typography.Text code>order_requirement</Typography.Text>（订单需求）与模具档案根表字段{" "}
        <Typography.Text code>order_requirement_id</Typography.Text>、
        <Typography.Text code>manufacturer</Typography.Text>、<Typography.Text code>manager</Typography.Text>、
        <Typography.Text code>manager_phone</Typography.Text> 对齐。
      </Typography.Text>

      {err ? (
        <Alert type="error" showIcon message={err} />
      ) : null}

      {loading ? (
        <div className="flex items-center gap-2 py-1 text-sm text-slate-500">
          <Spin size="small" />
          正在加载订单需求字典…
        </div>
      ) : null}

      <label className="block text-sm">
        <span className="text-slate-700">订单需求</span>
        <Select
          className={`mt-1 w-full [&_.ant-select-selector]:rounded [&_.ant-select-selector]:border-slate-200`}
          allowClear
          placeholder={loading ? "字典加载中…" : "请选择订单需求"}
          loading={loading}
          disabled={disabled || loading}
          value={value.order_requirement_id || undefined}
          options={items.map((o) => ({
            value: o.id,
            label: o.label,
          }))}
          onChange={(id) => patch({ order_requirement_id: id ?? "" })}
        />
      </label>

      <label className="block text-sm">
        <span className="text-slate-700">模具制造商</span>
        <Input
          className={inputCls}
          placeholder="例如制造商名称"
          disabled={disabled}
          value={value.manufacturer}
          onChange={(e) => patch({ manufacturer: e.target.value })}
        />
      </label>

      <label className="block text-sm">
        <span className="text-slate-700">负责人</span>
        <Input
          className={inputCls}
          placeholder="负责人姓名"
          disabled={disabled}
          value={value.manager}
          onChange={(e) => patch({ manager: e.target.value })}
        />
      </label>

      <label className="block text-sm">
        <span className="text-slate-700">负责人电话</span>
        <Input
          className={inputCls}
          type="tel"
          placeholder="手机号码或座机"
          disabled={disabled}
          value={value.manager_phone}
          onChange={(e) => patch({ manager_phone: e.target.value })}
        />
      </label>

    </div>
  );
}
