import { useCallback, useEffect, useState } from "react";

import { ApiError, apiFetch, formatApiDetail } from "@/lib/api";
import type { Department, UUID } from "@/lib/types";

export type DepartmentFormState = {
  name: string;
  code: string;
  parent_id: string;
  sort_order: number;
  remark: string;
};

const emptyForm = (): DepartmentFormState => ({
  name: "",
  code: "",
  parent_id: "",
  sort_order: 0,
  remark: "",
});

export function useDepartmentsPage() {
  const [rows, setRows] = useState<Department[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<"create" | "edit" | null>(null);
  const [editingId, setEditingId] = useState<UUID | null>(null);
  const [form, setForm] = useState<DepartmentFormState>(emptyForm);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setErr(null);
    setLoading(true);
    try {
      const data = await apiFetch<Department[]>("/departments");
      setRows(data);
    } catch (e) {
      setErr(e instanceof ApiError ? formatApiDetail(e.detail) : "加载失败");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const openCreate = () => {
    setForm(emptyForm());
    setEditingId(null);
    setModal("create");
  };

  const openEdit = (d: Department) => {
    setEditingId(d.id);
    setForm({
      name: d.name,
      code: d.code ?? "",
      parent_id: d.parent_id ?? "",
      sort_order: d.sort_order,
      remark: d.remark ?? "",
    });
    setModal("edit");
  };

  const submit = async () => {
    setSaving(true);
    setErr(null);
    const body = {
      name: form.name,
      code: form.code || null,
      parent_id: form.parent_id || null,
      sort_order: form.sort_order,
      remark: form.remark || null,
    };
    try {
      if (modal === "create") {
        await apiFetch<Department>("/departments", { method: "POST", body });
      } else if (modal === "edit" && editingId) {
        await apiFetch<Department>(`/departments/${editingId}`, {
          method: "PATCH",
          body,
        });
      }
      setModal(null);
      await load();
    } catch (e) {
      setErr(e instanceof ApiError ? formatApiDetail(e.detail) : "保存失败");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: UUID) => {
    if (!confirm("确定删除该部门？")) return;
    setErr(null);
    try {
      await apiFetch(`/departments/${id}`, { method: "DELETE" });
      await load();
    } catch (e) {
      setErr(e instanceof ApiError ? formatApiDetail(e.detail) : "删除失败");
    }
  };

  return {
    rows,
    err,
    loading,
    modal,
    setModal,
    editingId,
    form,
    setForm,
    saving,
    load,
    openCreate,
    openEdit,
    submit,
    remove,
  };
}
