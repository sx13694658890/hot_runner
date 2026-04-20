import { useCallback, useEffect, useState } from "react";
import { Alert, Button, Input, InputNumber, Modal, Select, Switch, Table, Tag, Typography } from "antd";
import type { ColumnsType } from "antd/es/table";
import { Link } from "react-router-dom";

import { ApiError, apiFetch, formatApiDetail } from "@/lib/api";
import { fetchMainNozzleDetailDictBundle } from "@/lib/selectionCatalogDictApi";
import type { SelDictCategoryRead, SelDictItemRead } from "@/lib/selectionCatalogTypes";
import { useAuth } from "@/contexts/AuthContext";
import { DictCategoryPrefixToolbar } from "@/features/selection-catalog/DictCategoryPrefixToolbar";

/** 与 docs/主射咀字典-前端对接.md、backend sel_main_nozzle_detail_dict 顺序一致 */
const MNZ_CATEGORY_ORDER: readonly string[] = [
  "hrspec_mnz_body_heated",
  "hrspec_mnz_body_unheated",
  "hrspec_mnz_adapter_ring_bridge",
  "hrspec_mnz_adapter_ring_stack",
  "hrspec_mnz_sr_ball",
  "hrspec_mnz_main_heater",
  "hrspec_mnz_thermocouple_style",
  "hrspec_mnz_body_material",
] as const;

const MNZ_PREFIX = "hrspec_mnz_";

function isMnzCategory(code: string): boolean {
  return code.startsWith(MNZ_PREFIX);
}

function sortMnzCategories(cats: SelDictCategoryRead[]): SelDictCategoryRead[] {
  const idx = new Map(MNZ_CATEGORY_ORDER.map((c, i) => [c, i]));
  return [...cats].sort((a, b) => {
    const ia = idx.get(a.code) ?? 999;
    const ib = idx.get(b.code) ?? 999;
    if (ia !== ib) return ia - ib;
    return a.code.localeCompare(b.code);
  });
}

export function SelectionCatalogMainNozzleDictPage() {
  const { can } = useAuth();
  const canRead = can("selection:read");
  const canWrite = can("selection:write");

  const [mnzCategories, setMnzCategories] = useState<SelDictCategoryRead[]>([]);
  const [categoryCode, setCategoryCode] = useState<string>("");
  const [items, setItems] = useState<SelDictItemRead[]>([]);
  const [loadingCats, setLoadingCats] = useState(true);
  const [loadingItems, setLoadingItems] = useState(false);
  const [bundleLoading, setBundleLoading] = useState(false);
  const [bundlePreviewCount, setBundlePreviewCount] = useState<number | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [editRow, setEditRow] = useState<SelDictItemRead | null>(null);
  const [formLabel, setFormLabel] = useState("");
  const [formSort, setFormSort] = useState(0);
  const [formActive, setFormActive] = useState(true);
  const [saving, setSaving] = useState(false);

  const loadCategories = useCallback(
    async (selectCode?: string) => {
      if (!canRead) return;
      setErr(null);
      setLoadingCats(true);
      try {
        const rows = await apiFetch<SelDictCategoryRead[]>("/selection-catalog/dict/categories");
        const sorted = sortMnzCategories(rows.filter((c) => isMnzCategory(c.code)));
        setMnzCategories(sorted);
        setCategoryCode((prev) => {
          if (selectCode && sorted.some((c) => c.code === selectCode)) return selectCode;
          if (prev && sorted.some((c) => c.code === prev)) return prev;
          return sorted[0]?.code ?? "";
        });
      } catch (e) {
        setErr(e instanceof ApiError ? formatApiDetail(e.detail) : "加载分类失败");
        setMnzCategories([]);
        setCategoryCode("");
      } finally {
        setLoadingCats(false);
      }
    },
    [canRead],
  );

  useEffect(() => {
    if (!canRead) return;
    void loadCategories();
  }, [canRead, loadCategories]);

  useEffect(() => {
    if (!canRead || !categoryCode) return;
    let cancelled = false;
    void (async () => {
      setErr(null);
      setLoadingItems(true);
      try {
        const q = new URLSearchParams({
          category_code: categoryCode,
          include_inactive: "true",
        });
        const rows = await apiFetch<SelDictItemRead[]>(`/selection-catalog/dict/items?${q.toString()}`);
        if (!cancelled) setItems(rows);
      } catch (e) {
        if (!cancelled) setErr(e instanceof ApiError ? formatApiDetail(e.detail) : "加载字典项失败");
        setItems([]);
      } finally {
        if (!cancelled) setLoadingItems(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [canRead, categoryCode]);

  const refreshBundlePreview = useCallback(async () => {
    setBundleLoading(true);
    try {
      const bundle = await fetchMainNozzleDetailDictBundle();
      const n = Object.values(bundle).reduce((acc, arr) => acc + arr.length, 0);
      setBundlePreviewCount(n);
    } catch {
      setBundlePreviewCount(null);
    } finally {
      setBundleLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!canRead) return;
    void refreshBundlePreview();
  }, [canRead, refreshBundlePreview]);

  const openCreate = () => {
    setEditRow(null);
    setFormLabel("");
    setFormSort(items.length > 0 ? Math.max(...items.map((x) => x.sort_order)) + 1 : 0);
    setFormActive(true);
    setModalOpen(true);
  };

  const openEdit = (row: SelDictItemRead) => {
    setEditRow(row);
    setFormLabel(row.label);
    setFormSort(row.sort_order);
    setFormActive(row.is_active);
    setModalOpen(true);
  };

  const submitModal = async () => {
    if (!canWrite || !categoryCode) return;
    const label = formLabel.trim();
    if (!label) return;
    setSaving(true);
    setErr(null);
    try {
      if (editRow) {
        await apiFetch(`/selection-catalog/dict/items/${editRow.id}`, {
          method: "PATCH",
          body: { label, sort_order: formSort, is_active: formActive },
        });
      } else {
        await apiFetch("/selection-catalog/dict/items", {
          method: "POST",
          body: { category_code: categoryCode, label, sort_order: formSort },
        });
      }
      setModalOpen(false);
      const q = new URLSearchParams({ category_code: categoryCode, include_inactive: "true" });
      const rows = await apiFetch<SelDictItemRead[]>(`/selection-catalog/dict/items?${q.toString()}`);
      setItems(rows);
      void refreshBundlePreview();
    } catch (e) {
      setErr(e instanceof ApiError ? formatApiDetail(e.detail) : "保存失败");
    } finally {
      setSaving(false);
    }
  };

  const softDelete = async (row: SelDictItemRead) => {
    if (!canWrite) return;
    if (!window.confirm(`停用字典项「${row.label}」？若已被模具引用仍可显示历史文案。`)) return;
    setErr(null);
    try {
      await apiFetch(`/selection-catalog/dict/items/${row.id}`, { method: "DELETE" });
      const q = new URLSearchParams({ category_code: categoryCode, include_inactive: "true" });
      setItems(await apiFetch<SelDictItemRead[]>(`/selection-catalog/dict/items?${q.toString()}`));
      void refreshBundlePreview();
    } catch (e) {
      setErr(e instanceof ApiError ? formatApiDetail(e.detail) : "停用失败");
    }
  };

  const columns: ColumnsType<SelDictItemRead> = [
    {
      title: "文案",
      dataIndex: "label",
      key: "label",
      render: (t: string, r) => (
        <span className={r.is_active ? "" : "text-slate-400 line-through"}>{t}</span>
      ),
    },
    {
      title: "排序",
      dataIndex: "sort_order",
      width: 88,
    },
    {
      title: "启用",
      dataIndex: "is_active",
      width: 96,
      render: (v: boolean) => (v ? <Tag color="green">是</Tag> : <Tag>否</Tag>),
    },
    {
      title: "操作",
      key: "act",
      width: 160,
      render: (_, row) =>
        canWrite ? (
          <span className="space-x-2">
            <button type="button" className="text-brand-600 hover:underline" onClick={() => openEdit(row)}>
              编辑
            </button>
            {row.is_active ? (
              <button type="button" className="text-amber-700 hover:underline" onClick={() => void softDelete(row)}>
                停用
              </button>
            ) : null}
          </span>
        ) : (
          "—"
        ),
    },
  ];

  if (!canRead) {
    return (
      <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
        需要 <span className="font-mono">selection:read</span>
      </div>
    );
  }

  const catLabel = mnzCategories.find((c) => c.code === categoryCode)?.label ?? categoryCode;

  return (
    <div className="space-y-6">
      <div>
        <Link to="/selection-catalog" className="text-sm font-medium text-brand-600 hover:underline">
          ← 返回选型领域表
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-slate-800">主射咀大类字典</h1>
        <p className="mt-1 text-sm text-slate-600">
          数据来自《主射咀大类》截图/Excel；分类 <Typography.Text code>code</Typography.Text> 以{" "}
          <Typography.Text code>hrspec_mnz_</Typography.Text> 开头，与扁平行热流道规格中的{" "}
          <Typography.Text code>hrspec_main_nozzle_*</Typography.Text> 字段独立。维护方式与「选型字典」相同。
        </p>
      </div>

      <Alert
        type="info"
        showIcon
        message={
          <span>
            热流道规格表中的主射咀字段（是否加热、EPM 类加热器等）仍在{" "}
            <Typography.Text code>GET …/hot-runner-spec-options</Typography.Text>，请在{" "}
            <Link to="/selection-catalog/dict" className="font-medium text-brand-600 hover:underline">
              选型字典
            </Link>{" "}
            中维护对应分类；本页为「主射咀大类」扩展选项包。
          </span>
        }
      />

      {err ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{err}</div>
      ) : null}

      <div className="flex flex-wrap items-end gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <label className="block min-w-[240px] text-sm">
          <span className="text-slate-600">字典分类（主射咀大类）</span>
          <Select
            className="mt-1 w-full min-w-[300px]"
            loading={loadingCats}
            value={categoryCode || undefined}
            options={mnzCategories.map((c) => ({
              value: c.code,
              label: `${c.label} (${c.code})`,
            }))}
            onChange={(v) => setCategoryCode(v)}
            notFoundContent={loadingCats ? "加载中…" : "暂无 hrspec_mnz_ 分类，请检查后端迁移"}
          />
        </label>
        <DictCategoryPrefixToolbar
          codePrefix={MNZ_PREFIX}
          categories={mnzCategories}
          categoryCode={categoryCode}
          setCategoryCode={setCategoryCode}
          reloadCategories={loadCategories}
          itemsCount={items.length}
          canWrite={canWrite}
          setErr={setErr}
        />
        {canWrite ? (
          <Button type="primary" disabled={!categoryCode} onClick={openCreate}>
            新增字典项
          </Button>
        ) : (
          <p className="text-xs text-amber-800">当前账号无 selection:write，仅可查看。</p>
        )}
        <div className="text-xs text-slate-500">
          选项包预览（<Typography.Text code>GET …/main-nozzle-detail-options</Typography.Text>
          ）：{" "}
          {bundleLoading ? (
            "加载中…"
          ) : bundlePreviewCount != null ? (
            <>共 {bundlePreviewCount} 条字典项</>
          ) : (
            "—"
          )}
          <Button type="link" size="small" className="!px-1" onClick={() => void refreshBundlePreview()}>
            刷新计数
          </Button>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-4 py-3 text-sm font-medium text-slate-700">{catLabel}</div>
        <Table<SelDictItemRead>
          size="small"
          rowKey="id"
          loading={loadingItems}
          pagination={false}
          columns={columns}
          dataSource={items}
          locale={{ emptyText: "暂无字典项" }}
        />
      </div>

      <Modal
        title={editRow ? "编辑字典项" : "新增字典项"}
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        onOk={() => void submitModal()}
        confirmLoading={saving}
        okButtonProps={{ disabled: !formLabel.trim() }}
      >
        <div className="space-y-3 pt-2">
          <label className="block text-sm">
            <span className="text-slate-600">显示文案</span>
            <Input className="mt-1" value={formLabel} onChange={(e) => setFormLabel(e.target.value)} />
          </label>
          <label className="block text-sm">
            <span className="text-slate-600">排序</span>
            <InputNumber className="mt-1 w-full" value={formSort} onChange={(v) => setFormSort(Number(v ?? 0))} />
          </label>
          {editRow ? (
            <label className="flex items-center gap-2 text-sm">
              <Switch checked={formActive} onChange={setFormActive} />
              <span className="text-slate-600">启用（停用后不可用于新选）</span>
            </label>
          ) : null}
        </div>
      </Modal>
    </div>
  );
}
