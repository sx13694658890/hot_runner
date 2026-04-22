import { useCallback, useEffect, useState } from "react";

import { useAuth } from "@/contexts/AuthContext";
import { ApiError, apiFetch, formatApiDetail } from "@/lib/api";
import type { RdResearchProjectRead } from "@/lib/rdTypes";

export function formatRdResearchTime(iso: string | undefined): string {
  if (!iso) return "—";
  return iso.slice(0, 19).replace("T", " ");
}

export function useRdResearchPage() {
  const { can } = useAuth();
  const canRead = can("rd:read");
  const canWrite = can("rd:write");

  const [rows, setRows] = useState<RdResearchProjectRead[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [parentFilter, setParentFilter] = useState("");

  const [createOpen, setCreateOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [status, setStatus] = useState("active");
  const [description, setDescription] = useState("");
  const [parentProjectId, setParentProjectId] = useState("");

  const load = useCallback(async () => {
    if (!canRead) return;
    setErr(null);
    setLoading(true);
    try {
      const q = new URLSearchParams();
      if (parentFilter.trim()) q.set("parent_project_id", parentFilter.trim());
      const qs = q.toString();
      setRows(await apiFetch<RdResearchProjectRead[]>(`/rd/projects${qs ? `?${qs}` : ""}`));
    } catch (e) {
      setErr(e instanceof ApiError ? formatApiDetail(e.detail) : "加载失败");
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [canRead, parentFilter]);

  useEffect(() => {
    void load();
  }, [load]);

  const submitCreate = async () => {
    if (!name.trim()) {
      setErr("请填写项目名称");
      return;
    }
    setSaving(true);
    setErr(null);
    try {
      await apiFetch<RdResearchProjectRead>("/rd/projects", {
        method: "POST",
        body: {
          name: name.trim(),
          code: code.trim() || null,
          parent_project_id: parentProjectId.trim() || null,
          status,
          description: description.trim() || null,
          owner_user_id: null,
        },
      });
      setCreateOpen(false);
      setName("");
      setCode("");
      setDescription("");
      setParentProjectId("");
      setStatus("active");
      await load();
    } catch (e) {
      setErr(e instanceof ApiError ? formatApiDetail(e.detail) : "创建失败");
    } finally {
      setSaving(false);
    }
  };

  return {
    canRead,
    canWrite,
    rows,
    err,
    loading,
    parentFilter,
    setParentFilter,
    createOpen,
    setCreateOpen,
    saving,
    name,
    setName,
    code,
    setCode,
    status,
    setStatus,
    description,
    setDescription,
    parentProjectId,
    setParentProjectId,
    load,
    submitCreate,
  };
}
