import { useCallback, useEffect, useState } from "react";

import { ApiError, apiFetch, formatApiDetail } from "@/lib/api";
import type { Project, UUID } from "@/lib/types";

export function useProjectsPage() {
  const [rows, setRows] = useState<Project[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [memberOpen, setMemberOpen] = useState<UUID | null>(null);
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [remark, setRemark] = useState("");
  const [memberUserId, setMemberUserId] = useState("");
  const [memberRole, setMemberRole] = useState<"owner" | "member">("member");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setErr(null);
    setLoading(true);
    try {
      setRows(await apiFetch<Project[]>("/projects"));
    } catch (e) {
      setErr(e instanceof ApiError ? formatApiDetail(e.detail) : "加载失败");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const submitCreate = async () => {
    setSaving(true);
    setErr(null);
    try {
      await apiFetch<Project>("/projects", {
        method: "POST",
        body: { name, code, remark: remark || null },
      });
      setCreateOpen(false);
      setName("");
      setCode("");
      setRemark("");
      await load();
    } catch (e) {
      setErr(e instanceof ApiError ? formatApiDetail(e.detail) : "创建失败");
    } finally {
      setSaving(false);
    }
  };

  const submitMember = async () => {
    if (!memberOpen) return;
    setSaving(true);
    setErr(null);
    try {
      await apiFetch(`/projects/${memberOpen}/members`, {
        method: "POST",
        body: { user_id: memberUserId, role_in_project: memberRole },
      });
      setMemberOpen(null);
      setMemberUserId("");
      setMemberRole("member");
      await load();
    } catch (e) {
      setErr(e instanceof ApiError ? formatApiDetail(e.detail) : "添加失败");
    } finally {
      setSaving(false);
    }
  };

  return {
    rows,
    err,
    loading,
    createOpen,
    setCreateOpen,
    memberOpen,
    setMemberOpen,
    name,
    setName,
    code,
    setCode,
    remark,
    setRemark,
    memberUserId,
    setMemberUserId,
    memberRole,
    setMemberRole,
    saving,
    load,
    submitCreate,
    submitMember,
  };
}
