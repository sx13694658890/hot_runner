import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { Modal } from "@/components/Modal";
import { ApiError, apiFetch, formatApiDetail } from "@/lib/api";
import type { RdLibraryIntakeRead } from "@/lib/rdTypes";
import { useAuth } from "@/contexts/AuthContext";

function fmtTime(iso: string | null | undefined): string {
  if (!iso) return "—";
  return iso.slice(0, 19).replace("T", " ");
}

const STATUS_OPTIONS = [
  { value: "", label: "全部" },
  { value: "draft", label: "草稿" },
  { value: "submitted", label: "待审批" },
  { value: "approved", label: "已通过" },
  { value: "rejected", label: "已驳回" },
  { value: "withdrawn", label: "已撤回" },
];

export function RdLibraryIntakesPage() {
  const { can } = useAuth();
  const canRead = can("rd:read");
  const canWrite = can("rd:write");
  const canApprove = can("rd:intake_approve");

  const [rows, setRows] = useState<RdLibraryIntakeRead[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");

  const [createOpen, setCreateOpen] = useState(false);
  const [reviewOpen, setReviewOpen] = useState<RdLibraryIntakeRead | null>(null);
  const [reviewMode, setReviewMode] = useState<"approve" | "reject">("approve");
  const [reviewComment, setReviewComment] = useState("");
  const [saving, setSaving] = useState(false);

  const [title, setTitle] = useState("");
  const [proposedCode, setProposedCode] = useState("");
  const [proposedName, setProposedName] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [researchProjectId, setResearchProjectId] = useState("");
  const [fileAssetId, setFileAssetId] = useState("");

  const load = useCallback(async () => {
    if (!canRead) return;
    setErr(null);
    setLoading(true);
    try {
      const q = new URLSearchParams();
      if (statusFilter) q.set("status", statusFilter);
      const qs = q.toString();
      setRows(await apiFetch<RdLibraryIntakeRead[]>(`/rd/library-intakes${qs ? `?${qs}` : ""}`));
    } catch (e) {
      setErr(e instanceof ApiError ? formatApiDetail(e.detail) : "加载失败");
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [canRead, statusFilter]);

  useEffect(() => {
    void load();
  }, [load]);

  const submitCreate = async () => {
    if (!title.trim() || !proposedCode.trim() || !proposedName.trim()) {
      setErr("请填写标题、拟用编码与名称");
      return;
    }
    setSaving(true);
    setErr(null);
    try {
      await apiFetch<RdLibraryIntakeRead>("/rd/library-intakes", {
        method: "POST",
        body: {
          title: title.trim(),
          proposed_code: proposedCode.trim(),
          proposed_name: proposedName.trim(),
          category: category.trim() || null,
          description: description.trim() || null,
          research_project_id: researchProjectId.trim() || null,
          file_asset_id: fileAssetId.trim() || null,
        },
      });
      setCreateOpen(false);
      setTitle("");
      setProposedCode("");
      setProposedName("");
      setCategory("");
      setDescription("");
      setResearchProjectId("");
      setFileAssetId("");
      await load();
    } catch (e) {
      setErr(e instanceof ApiError ? formatApiDetail(e.detail) : "创建失败");
    } finally {
      setSaving(false);
    }
  };

  const submitIntake = async (id: string) => {
    setSaving(true);
    try {
      await apiFetch(`/rd/library-intakes/${id}/submit`, { method: "POST", body: {} });
      await load();
    } catch (e) {
      setErr(e instanceof ApiError ? formatApiDetail(e.detail) : "提交失败");
    } finally {
      setSaving(false);
    }
  };

  const withdrawIntake = async (id: string) => {
    if (!window.confirm("确认撤回该入库申请？")) return;
    setSaving(true);
    try {
      await apiFetch(`/rd/library-intakes/${id}/withdraw`, { method: "POST", body: {} });
      await load();
    } catch (e) {
      setErr(e instanceof ApiError ? formatApiDetail(e.detail) : "撤回失败");
    } finally {
      setSaving(false);
    }
  };

  const runReview = async () => {
    if (!reviewOpen) return;
    const path =
      reviewMode === "approve"
        ? `/rd/library-intakes/${reviewOpen.id}/approve`
        : `/rd/library-intakes/${reviewOpen.id}/reject`;
    setSaving(true);
    try {
      await apiFetch(path, {
        method: "POST",
        body: { comment: reviewComment.trim() || null },
      });
      setReviewOpen(null);
      setReviewComment("");
      await load();
    } catch (e) {
      setErr(e instanceof ApiError ? formatApiDetail(e.detail) : "审批失败");
    } finally {
      setSaving(false);
    }
  };

  if (!canRead) {
    return (
      <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
        需要 <span className="font-mono">rd:read</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">成果入库申请</h1>
          <p className="mt-1 text-sm text-slate-600">
            新建入库单并提交审批；审批通过后生成标准件记录，可在标准件图库查看。
          </p>
        </div>
        {canWrite ? (
          <button
            type="button"
            onClick={() => setCreateOpen(true)}
            className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
          >
            新建申请
          </button>
        ) : null}
      </div>

      {err ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{err}</div>
      ) : null}

      <div className="flex flex-wrap items-center gap-3">
        <label className="flex items-center gap-2 text-sm">
          <span className="text-slate-600">状态</span>
          <select
            className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            {STATUS_OPTIONS.map((o) => (
              <option key={o.value || "all"} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="min-w-[1100px] w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50 text-left text-xs font-semibold uppercase text-slate-500">
            <tr>
              <th className="px-4 py-3">标题</th>
              <th className="px-4 py-3">拟用编码/名称</th>
              <th className="px-4 py-3">状态</th>
              <th className="px-4 py-3">研发项目</th>
              <th className="px-4 py-3">结果标准件</th>
              <th className="px-4 py-3">创建时间</th>
              <th className="px-4 py-3 text-right">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-slate-500">
                  加载中…
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-slate-500">
                  暂无数据
                </td>
              </tr>
            ) : (
              rows.map((r) => (
                <tr key={r.id} className="hover:bg-slate-50/80">
                  <td className="max-w-[200px] px-4 py-3">
                    <div className="font-medium text-slate-800">{r.title}</div>
                    <div className="font-mono text-[11px] text-slate-400">{r.id}</div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-mono text-xs text-slate-700">{r.proposed_code}</div>
                    <div className="text-slate-600">{r.proposed_name}</div>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3">{r.status}</td>
                  <td className="px-4 py-3 font-mono text-xs">
                    {r.research_project_id ? (
                      <Link className="text-brand-600 hover:underline" to={`/rd/research/${r.research_project_id}`}>
                        {r.research_project_id.slice(0, 8)}…
                      </Link>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs">
                    {r.result_standard_part_id ? (
                      <Link className="text-brand-600 hover:underline" to="/standard-parts">
                        {r.result_standard_part_id}
                      </Link>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-xs text-slate-500">{fmtTime(r.created_at)}</td>
                  <td className="space-x-2 whitespace-nowrap px-4 py-3 text-right text-xs">
                    {canWrite && (r.status === "draft" || r.status === "rejected") ? (
                      <button
                        type="button"
                        disabled={saving}
                        className="text-brand-600 hover:underline disabled:opacity-50"
                        onClick={() => void submitIntake(r.id)}
                      >
                        提交
                      </button>
                    ) : null}
                    {canWrite && r.status === "submitted" ? (
                      <button
                        type="button"
                        disabled={saving}
                        className="text-slate-600 hover:underline disabled:opacity-50"
                        onClick={() => void withdrawIntake(r.id)}
                      >
                        撤回
                      </button>
                    ) : null}
                    {canApprove && r.status === "submitted" ? (
                      <>
                        <button
                          type="button"
                          disabled={saving}
                          className="text-emerald-700 hover:underline disabled:opacity-50"
                          onClick={() => {
                            setReviewMode("approve");
                            setReviewComment("");
                            setReviewOpen(r);
                          }}
                        >
                          通过
                        </button>
                        <button
                          type="button"
                          disabled={saving}
                          className="text-red-600 hover:underline disabled:opacity-50"
                          onClick={() => {
                            setReviewMode("reject");
                            setReviewComment("");
                            setReviewOpen(r);
                          }}
                        >
                          驳回
                        </button>
                      </>
                    ) : null}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Modal
        open={createOpen}
        title="新建入库申请"
        wide
        onClose={() => setCreateOpen(false)}
        footer={
          <div className="flex justify-end gap-2">
            <button type="button" className="rounded-lg border px-4 py-2 text-sm" onClick={() => setCreateOpen(false)}>
              取消
            </button>
            <button
              type="button"
              disabled={saving}
              className="rounded-lg bg-brand-600 px-4 py-2 text-sm text-white disabled:opacity-50"
              onClick={() => void submitCreate()}
            >
              保存草稿
            </button>
          </div>
        }
      >
        <div className="grid gap-3 px-5 py-4 text-sm sm:grid-cols-2">
          <label className="block sm:col-span-2">
            <span className="text-slate-500">标题 *</span>
            <input className="mt-1 w-full rounded border px-2 py-1.5" value={title} onChange={(e) => setTitle(e.target.value)} />
          </label>
          <label className="block">
            <span className="text-slate-500">拟用编码 *</span>
            <input
              className="mt-1 w-full rounded border px-2 py-1.5 font-mono text-xs"
              value={proposedCode}
              onChange={(e) => setProposedCode(e.target.value)}
            />
          </label>
          <label className="block">
            <span className="text-slate-500">拟用名称 *</span>
            <input className="mt-1 w-full rounded border px-2 py-1.5" value={proposedName} onChange={(e) => setProposedName(e.target.value)} />
          </label>
          <label className="block">
            <span className="text-slate-500">分类</span>
            <input className="mt-1 w-full rounded border px-2 py-1.5" value={category} onChange={(e) => setCategory(e.target.value)} />
          </label>
          <label className="block">
            <span className="text-slate-500">关联研发项目 ID</span>
            <input
              className="mt-1 w-full rounded border px-2 py-1.5 font-mono text-xs"
              value={researchProjectId}
              onChange={(e) => setResearchProjectId(e.target.value)}
              placeholder="可选"
            />
          </label>
          <label className="block sm:col-span-2">
            <span className="text-slate-500">说明</span>
            <textarea
              className="mt-1 w-full rounded border px-2 py-1.5"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </label>
          <label className="block sm:col-span-2">
            <span className="text-slate-500">附件 file_asset_id（文件页上传后粘贴）</span>
            <input
              className="mt-1 w-full rounded border px-2 py-1.5 font-mono text-xs"
              value={fileAssetId}
              onChange={(e) => setFileAssetId(e.target.value)}
            />
          </label>
        </div>
      </Modal>

      <Modal
        open={Boolean(reviewOpen)}
        title={reviewMode === "approve" ? "审批通过" : "驳回入库申请"}
        onClose={() => setReviewOpen(null)}
        footer={
          <div className="flex justify-end gap-2">
            <button type="button" className="rounded-lg border px-4 py-2 text-sm" onClick={() => setReviewOpen(null)}>
              取消
            </button>
            <button
              type="button"
              disabled={saving}
              className={
                reviewMode === "approve"
                  ? "rounded-lg bg-emerald-600 px-4 py-2 text-sm text-white disabled:opacity-50"
                  : "rounded-lg bg-red-600 px-4 py-2 text-sm text-white disabled:opacity-50"
              }
              onClick={() => void runReview()}
            >
              确认
            </button>
          </div>
        }
      >
        <div className="space-y-3 px-5 py-4 text-sm">
          <p className="text-slate-600">
            {reviewOpen?.title} · <span className="font-mono text-xs">{reviewOpen?.proposed_code}</span>
          </p>
          <label className="block">
            <span className="text-slate-500">审批意见（可选）</span>
            <textarea
              className="mt-1 w-full rounded border px-2 py-1.5"
              rows={3}
              value={reviewComment}
              onChange={(e) => setReviewComment(e.target.value)}
            />
          </label>
        </div>
      </Modal>
    </div>
  );
}
