import { useState } from "react";
import { Button, Input, InputNumber, Modal, Typography, message } from "antd";

import { ApiError, apiFetch, formatApiDetail } from "@/lib/api";
import type { SelDictCategoryCreateBody, SelDictCategoryPatchBody, SelDictCategoryRead } from "@/lib/selectionCatalogTypes";

type Props = {
  /** 与后端 query require_code_prefix 一致，如 hrspec_mfld_ */
  codePrefix: string;
  categories: SelDictCategoryRead[];
  categoryCode: string;
  setCategoryCode: (c: string) => void;
  /** 重新拉取分类列表并修正当前选中；可传入新建/保存后的 code */
  reloadCategories: (selectCode?: string) => Promise<void>;
  itemsCount: number;
  canWrite: boolean;
  setErr: (msg: string | null) => void;
};

function prefixQuery(codePrefix: string): string {
  const q = new URLSearchParams();
  q.set("require_code_prefix", codePrefix);
  return `?${q.toString()}`;
}

/**
 * 分流板 / 主射咀 / 热咀 / 驱动系统 等「前缀大类」字典页：分类增删改，请求带 require_code_prefix。
 */
export function DictCategoryPrefixToolbar({
  codePrefix,
  categories,
  categoryCode,
  setCategoryCode,
  reloadCategories,
  itemsCount,
  canWrite,
  setErr,
}: Props) {
  const [catModalOpen, setCatModalOpen] = useState(false);
  const [catModalMode, setCatModalMode] = useState<"create" | "edit">("create");
  const [catFormCode, setCatFormCode] = useState("");
  const [catFormLabel, setCatFormLabel] = useState("");
  const [catFormSort, setCatFormSort] = useState(0);
  const [catSaving, setCatSaving] = useState(false);
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);

  const pq = prefixQuery(codePrefix);

  const openCreateCategory = () => {
    setCatModalMode("create");
    setEditingCategoryId(null);
    setCatFormCode(codePrefix);
    setCatFormLabel("");
    setCatFormSort(categories.length > 0 ? Math.max(...categories.map((c) => c.sort_order)) + 1 : 0);
    setCatModalOpen(true);
  };

  const openEditCategory = () => {
    const cur = categories.find((c) => c.code === categoryCode);
    if (!cur) return;
    setCatModalMode("edit");
    setEditingCategoryId(cur.id);
    setCatFormCode(cur.code);
    setCatFormLabel(cur.label);
    setCatFormSort(cur.sort_order);
    setCatModalOpen(true);
  };

  const submitCategoryModal = async () => {
    if (!canWrite) return;
    const code = catFormCode.trim();
    const label = catFormLabel.trim();
    if (!code || !label) return;
    setCatSaving(true);
    setErr(null);
    try {
      if (catModalMode === "create") {
        const body: SelDictCategoryCreateBody = { code, label, sort_order: catFormSort };
        const created = await apiFetch<SelDictCategoryRead>(`/selection-catalog/dict/categories${pq}`, {
          method: "POST",
          body,
        });
        await reloadCategories(created.code);
        setCategoryCode(created.code);
        message.success("已新增字典分类");
      } else if (editingCategoryId) {
        const body: SelDictCategoryPatchBody = { code, label, sort_order: catFormSort };
        const updated = await apiFetch<SelDictCategoryRead>(
          `/selection-catalog/dict/categories/${editingCategoryId}${pq}`,
          { method: "PATCH", body },
        );
        await reloadCategories(updated.code);
        setCategoryCode(updated.code);
        message.success("已保存分类");
      }
      setCatModalOpen(false);
    } catch (e) {
      setErr(e instanceof ApiError ? formatApiDetail(e.detail) : "保存分类失败");
    } finally {
      setCatSaving(false);
    }
  };

  const deleteCurrentCategory = async () => {
    if (!canWrite) return;
    const cur = categories.find((c) => c.code === categoryCode);
    if (!cur) return;
    if (itemsCount > 0) {
      message.warning("请先清空该分类下字典项后再删除分类");
      return;
    }
    if (!window.confirm(`确定删除空分类「${cur.label}」（${cur.code}）？此操作不可恢复。`)) return;
    setErr(null);
    try {
      await apiFetch(`/selection-catalog/dict/categories/${cur.id}${pq}`, { method: "DELETE" });
      await reloadCategories();
      message.success("已删除分类");
    } catch (e) {
      setErr(e instanceof ApiError ? formatApiDetail(e.detail) : "删除分类失败");
    }
  };

  if (!canWrite) {
    return null;
  }

  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        <Button type="default" onClick={openCreateCategory}>
          新增分类
        </Button>
        <Button type="default" disabled={!categoryCode} onClick={openEditCategory}>
          编辑当前分类
        </Button>
        <Button type="default" danger disabled={!categoryCode || itemsCount > 0} onClick={() => void deleteCurrentCategory()}>
          删除当前分类
        </Button>
      </div>

      <Modal
        title={catModalMode === "create" ? "新增字典分类" : "编辑字典分类"}
        open={catModalOpen}
        onCancel={() => setCatModalOpen(false)}
        onOk={() => void submitCategoryModal()}
        confirmLoading={catSaving}
        okButtonProps={{ disabled: !catFormCode.trim() || !catFormLabel.trim() }}
      >
        <div className="space-y-3 pt-2">
          <label className="block text-sm">
            <span className="text-slate-600">分类 code（须以 {codePrefix} 开头）</span>
            <Input
              className="mt-1 font-mono text-sm"
              value={catFormCode}
              onChange={(e) => setCatFormCode(e.target.value)}
              placeholder={codePrefix}
            />
          </label>
          <label className="block text-sm">
            <span className="text-slate-600">显示名称</span>
            <Input className="mt-1" value={catFormLabel} onChange={(e) => setCatFormLabel(e.target.value)} />
          </label>
          <label className="block text-sm">
            <span className="text-slate-600">排序</span>
            <InputNumber className="mt-1 w-full" value={catFormSort} onChange={(v) => setCatFormSort(Number(v ?? 0))} />
          </label>
          {catModalMode === "edit" ? (
            <Typography.Text type="secondary" className="block text-xs">
              修改 code 须保持前缀 {codePrefix}；若与其它分类冲突将保存失败。
            </Typography.Text>
          ) : null}
        </div>
      </Modal>
    </>
  );
}
