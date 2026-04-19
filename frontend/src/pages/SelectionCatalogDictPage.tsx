import { useEffect, useState } from "react";
import { Button, Input, InputNumber, Modal, Select, Switch, Table, Tag } from "antd";
import type { ColumnsType } from "antd/es/table";
import { Link } from "react-router-dom";

import { ApiError, apiFetch, formatApiDetail } from "@/lib/api";
import type { SelDictCategoryRead, SelDictItemRead } from "@/lib/selectionCatalogTypes";
import { useAuth } from "@/contexts/AuthContext";

export function SelectionCatalogDictPage() {
  const { can } = useAuth();
  const canRead = can("selection:read");
  const canWrite = can("selection:write");

  const [categories, setCategories] = useState<SelDictCategoryRead[]>([]);
  const [categoryCode, setCategoryCode] = useState<string>("");
  const [items, setItems] = useState<SelDictItemRead[]>([]);
  const [loadingCats, setLoadingCats] = useState(true);
  const [loadingItems, setLoadingItems] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [editRow, setEditRow] = useState<SelDictItemRead | null>(null);
  const [formLabel, setFormLabel] = useState("");
  const [formSort, setFormSort] = useState(0);
  const [formActive, setFormActive] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!canRead) return;
    let cancelled = false;
    void (async () => {
      setErr(null);
      setLoadingCats(true);
      try {
        const rows = await apiFetch<SelDictCategoryRead[]>("/selection-catalog/dict/categories");
        if (cancelled) return;
        setCategories(rows);
        setCategoryCode((prev) => prev || rows[0]?.code || "");
      } catch (e) {
        if (!cancelled) setErr(e instanceof ApiError ? formatApiDetail(e.detail) : "加载分类失败");
        setCategories([]);
      } finally {
        if (!cancelled) setLoadingCats(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [canRead]);

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

  const catLabel = categories.find((c) => c.code === categoryCode)?.label ?? categoryCode;

  return (
    <div className="space-y-6">
      <div>
        <Link to="/selection-catalog" className="text-sm font-medium text-brand-600 hover:underline">
          ← 返回选型领域表
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-slate-800">选型字典</h1>
        <p className="mt-1 text-sm text-slate-600">
          维护模具档案根部下拉选项；分类固定，仅可增删改<strong className="mx-0.5">字典项</strong>
          （存 UUID，停用后新选不可选，历史仍可展示）。
        </p>
      </div>

      {err ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{err}</div>
      ) : null}

      <div className="flex flex-wrap items-end gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <label className="block min-w-[240px] text-sm">
          <span className="text-slate-600">字典分类</span>
          <Select
            className="mt-1 w-full min-w-[220px]"
            loading={loadingCats}
            value={categoryCode || undefined}
            options={categories.map((c) => ({
              value: c.code,
              label: `${c.label} (${c.code})`,
            }))}
            onChange={(v) => setCategoryCode(v)}
          />
        </label>
        {canWrite ? (
          <Button type="primary" disabled={!categoryCode} onClick={openCreate}>
            新增字典项
          </Button>
        ) : (
          <p className="text-xs text-amber-800">当前账号无 selection:write，仅可查看。</p>
        )}
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
