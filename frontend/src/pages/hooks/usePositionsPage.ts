import { useCallback, useEffect, useState } from "react";

import { ApiError, apiFetch, formatApiDetail } from "@/lib/api";
import type { Department, Position } from "@/lib/types";

export function usePositionsPage() {
  const [rows, setRows] = useState<Position[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [departmentId, setDepartmentId] = useState("");
  const [remark, setRemark] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setErr(null);
    setLoading(true);
    try {
      const [pos, depts] = await Promise.all([
        apiFetch<Position[]>("/positions"),
        apiFetch<Department[]>("/departments").catch(() => [] as Department[]),
      ]);
      setRows(pos);
      setDepartments(depts);
    } catch (e) {
      setErr(e instanceof ApiError ? formatApiDetail(e.detail) : "加载失败");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const submit = async () => {
    setSaving(true);
    setErr(null);
    try {
      await apiFetch<Position>("/positions", {
        method: "POST",
        body: {
          name,
          code: code || null,
          department_id: departmentId || null,
          remark: remark || null,
        },
      });
      setOpen(false);
      setName("");
      setCode("");
      setDepartmentId("");
      setRemark("");
      await load();
    } catch (e) {
      setErr(e instanceof ApiError ? formatApiDetail(e.detail) : "保存失败");
    } finally {
      setSaving(false);
    }
  };

  return {
    rows,
    departments,
    err,
    loading,
    open,
    setOpen,
    name,
    setName,
    code,
    setCode,
    departmentId,
    setDepartmentId,
    remark,
    setRemark,
    saving,
    load,
    submit,
  };
}
