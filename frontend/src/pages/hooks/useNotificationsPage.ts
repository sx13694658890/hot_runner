import { useCallback, useEffect, useState } from "react";

import { ApiError, apiFetch, formatApiDetail } from "@/lib/api";
import type { Notification, UUID } from "@/lib/types";

export function useNotificationsPage() {
  const [rows, setRows] = useState<Notification[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [toUser, setToUser] = useState("");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setErr(null);
    setLoading(true);
    try {
      setRows(await apiFetch<Notification[]>("/notifications/mine"));
    } catch (e) {
      setErr(e instanceof ApiError ? formatApiDetail(e.detail) : "加载失败");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const markRead = async (id: UUID) => {
    setErr(null);
    try {
      await apiFetch<Notification>(`/notifications/${id}/read`, { method: "POST" });
      await load();
    } catch (e) {
      setErr(e instanceof ApiError ? formatApiDetail(e.detail) : "操作失败");
    }
  };

  const submitCreate = async () => {
    setSaving(true);
    setErr(null);
    try {
      await apiFetch<Notification>("/notifications", {
        method: "POST",
        body: {
          user_id: toUser.trim(),
          title,
          body: body || null,
          channel: "in_app",
        },
      });
      setCreateOpen(false);
      setToUser("");
      setTitle("");
      setBody("");
      await load();
    } catch (e) {
      setErr(e instanceof ApiError ? formatApiDetail(e.detail) : "发送失败");
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
    toUser,
    setToUser,
    title,
    setTitle,
    body,
    setBody,
    saving,
    load,
    markRead,
    submitCreate,
  };
}
