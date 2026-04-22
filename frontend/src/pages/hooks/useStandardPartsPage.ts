import { useCallback, useEffect, useState } from "react";

import { ApiError, apiFetch, formatApiDetail } from "@/lib/api";
import type { DrawingVersion, StandardPart, UUID } from "@/lib/types";

export function useStandardPartsPage() {
  const [rows, setRows] = useState<StandardPart[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");

  const [createOpen, setCreateOpen] = useState(false);
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [status, setStatus] = useState("draft");
  const [remark, setRemark] = useState("");
  const [saving, setSaving] = useState(false);

  const [versionsPart, setVersionsPart] = useState<StandardPart | null>(null);
  const [versions, setVersions] = useState<DrawingVersion[]>([]);
  const [verLoading, setVerLoading] = useState(false);
  const [verOpen, setVerOpen] = useState(false);
  const [verLabel, setVerLabel] = useState("");
  const [verStatus, setVerStatus] = useState("draft");
  const [verFileId, setVerFileId] = useState("");
  const [verEdit, setVerEdit] = useState<DrawingVersion | null>(null);

  const load = useCallback(async () => {
    setErr(null);
    setLoading(true);
    try {
      const q = new URLSearchParams();
      if (statusFilter.trim()) q.set("status", statusFilter.trim());
      const qs = q.toString();
      setRows(await apiFetch<StandardPart[]>(`/standard-parts${qs ? `?${qs}` : ""}`));
    } catch (e) {
      setErr(e instanceof ApiError ? formatApiDetail(e.detail) : "加载失败");
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    void load();
  }, [load]);

  const loadVersions = async (part: StandardPart) => {
    setVersionsPart(part);
    setVerLoading(true);
    setErr(null);
    try {
      setVersions(await apiFetch<DrawingVersion[]>(`/standard-parts/${part.id}/drawing-versions`));
      setVerOpen(true);
    } catch (e) {
      setErr(e instanceof ApiError ? formatApiDetail(e.detail) : "加载版本失败");
    } finally {
      setVerLoading(false);
    }
  };

  const submitCreate = async () => {
    setSaving(true);
    setErr(null);
    try {
      await apiFetch<StandardPart>("/standard-parts", {
        method: "POST",
        body: {
          code: code.trim(),
          name: name.trim(),
          category: category.trim() || null,
          status: status as "draft" | "published" | "retired",
          remark: remark.trim() || null,
        },
      });
      setCreateOpen(false);
      setCode("");
      setName("");
      setCategory("");
      setRemark("");
      await load();
    } catch (e) {
      setErr(e instanceof ApiError ? formatApiDetail(e.detail) : "创建失败");
    } finally {
      setSaving(false);
    }
  };

  const submitVersion = async () => {
    if (!versionsPart) return;
    setSaving(true);
    setErr(null);
    try {
      await apiFetch(`/standard-parts/${versionsPart.id}/drawing-versions`, {
        method: "POST",
        body: {
          version_label: verLabel.trim(),
          status: verStatus as "draft" | "published" | "obsolete",
          file_asset_id: verFileId.trim() ? (verFileId.trim() as UUID) : null,
        },
      });
      setVerLabel("");
      setVerFileId("");
      setVersions(await apiFetch<DrawingVersion[]>(`/standard-parts/${versionsPart.id}/drawing-versions`));
    } catch (e) {
      setErr(e instanceof ApiError ? formatApiDetail(e.detail) : "创建版本失败");
    } finally {
      setSaving(false);
    }
  };

  const saveVersionEdit = async () => {
    if (!versionsPart || !verEdit) return;
    setSaving(true);
    setErr(null);
    try {
      await apiFetch(`/standard-parts/${versionsPart.id}/drawing-versions/${verEdit.id}`, {
        method: "PATCH",
        body: {
          version_label: verEdit.version_label,
          status: verEdit.status,
          file_asset_id: verEdit.file_asset_id,
          remark: verEdit.remark,
        },
      });
      setVerEdit(null);
      setVersions(await apiFetch<DrawingVersion[]>(`/standard-parts/${versionsPart.id}/drawing-versions`));
    } catch (e) {
      setErr(e instanceof ApiError ? formatApiDetail(e.detail) : "保存失败");
    } finally {
      setSaving(false);
    }
  };

  const delVersion = async (id: UUID) => {
    if (!versionsPart || !window.confirm("删除该图纸版本？")) return;
    await apiFetch(`/standard-parts/${versionsPart.id}/drawing-versions/${id}`, { method: "DELETE" });
    setVersions(await apiFetch<DrawingVersion[]>(`/standard-parts/${versionsPart.id}/drawing-versions`));
  };

  const delPart = async (id: UUID) => {
    if (!window.confirm("删除标准件及其所有图纸版本？")) return;
    await apiFetch(`/standard-parts/${id}`, { method: "DELETE" });
    await load();
  };

  const closeVersionsModal = () => {
    setVerOpen(false);
    setVersionsPart(null);
    setVerEdit(null);
  };

  return {
    rows,
    err,
    loading,
    statusFilter,
    setStatusFilter,
    createOpen,
    setCreateOpen,
    code,
    setCode,
    name,
    setName,
    category,
    setCategory,
    status,
    setStatus,
    remark,
    setRemark,
    saving,
    versionsPart,
    versions,
    verLoading,
    verOpen,
    setVerOpen,
    verLabel,
    setVerLabel,
    verStatus,
    setVerStatus,
    verFileId,
    setVerFileId,
    verEdit,
    setVerEdit,
    load,
    loadVersions,
    submitCreate,
    submitVersion,
    saveVersionEdit,
    delVersion,
    delPart,
    closeVersionsModal,
  };
}
