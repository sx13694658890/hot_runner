import { useCallback, useEffect, useState } from "react";

import { Modal } from "@/components/Modal";
import { ApiError, apiFetch, formatApiDetail } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import type { Notification, UUID } from "@/lib/types";

export function NotificationsPage() {
  const { can } = useAuth();
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

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">通知</h1>
          <p className="mt-1 text-sm text-slate-600">我的通知；有权限时可代发站内信</p>
        </div>
        {can("notification:write") ? (
          <button
            type="button"
            onClick={() => setCreateOpen(true)}
            className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white"
          >
            发送通知
          </button>
        ) : null}
      </div>
      {err ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{err}</div>
      ) : null}
      <div className="divide-y divide-slate-200 rounded-xl border border-slate-200 bg-white shadow-sm">
        {loading ? (
          <div className="p-8 text-center text-slate-500">加载中…</div>
        ) : rows.length === 0 ? (
          <div className="p-8 text-center text-slate-500">暂无通知</div>
        ) : (
          rows.map((n) => (
            <div key={n.id} className={`flex flex-wrap items-start justify-between gap-4 px-4 py-4 ${n.read ? "bg-slate-50/50" : "bg-white"}`}>
              <div>
                <div className="flex items-center gap-2">
                  {!n.read ? <span className="h-2 w-2 rounded-full bg-brand-500" /> : null}
                  <span className="font-semibold text-slate-800">{n.title}</span>
                  <span className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[10px] text-slate-500">
                    {n.channel}
                  </span>
                </div>
                {n.body ? <p className="mt-2 text-sm text-slate-600">{n.body}</p> : null}
                <p className="mt-2 text-xs text-slate-400">{n.created_at}</p>
              </div>
              {!n.read ? (
                <button
                  type="button"
                  onClick={() => void markRead(n.id)}
                  className="shrink-0 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                >
                  标为已读
                </button>
              ) : (
                <span className="text-xs text-slate-400">已读</span>
              )}
            </div>
          ))
        )}
      </div>

      <Modal
        open={createOpen}
        title="发送站内通知"
        onClose={() => setCreateOpen(false)}
        footer={
          <>
            <button type="button" className="rounded-lg border px-4 py-2 text-sm" onClick={() => setCreateOpen(false)}>
              取消
            </button>
            <button
              type="button"
              disabled={saving || !toUser.trim() || !title.trim()}
              className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
              onClick={() => void submitCreate()}
            >
              {saving ? "发送中…" : "发送"}
            </button>
          </>
        }
      >
        <div className="space-y-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">接收用户 UUID *</label>
            <input
              className="w-full rounded-lg border border-slate-300 px-3 py-2 font-mono text-sm"
              value={toUser}
              onChange={(e) => setToUser(e.target.value)}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">标题 *</label>
            <input
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">正文</label>
            <textarea
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              rows={3}
              value={body}
              onChange={(e) => setBody(e.target.value)}
            />
          </div>
        </div>
      </Modal>
    </div>
  );
}
