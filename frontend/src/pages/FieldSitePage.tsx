import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { Modal } from "@/components/Modal";
import { ApiError, apiFetch, formatApiDetail } from "@/lib/api";
import type {
  KnowledgeDocRead,
  ProcessAnnotationRead,
  ProcessPlanRead,
  SupportTicketRead,
  TrialRunRead,
} from "@/lib/fieldTypes";
import { useAuth } from "@/contexts/AuthContext";

type Tab = "plans" | "annotations" | "trials" | "support" | "knowledge";

function fmt(iso: string | null | undefined): string {
  if (!iso) return "—";
  return iso.slice(0, 19).replace("T", " ");
}

const PLAN_STATUS = ["draft", "active", "archived"];
const TRIAL_STATUS = ["draft", "scheduled", "in_progress", "reported", "closed", "cancelled"];
const SUPPORT_STATUS = ["open", "investigating", "resolved", "closed"];
const KD_STATUS = ["draft", "published", "archived"];

export function FieldSitePage() {
  const { can } = useAuth();
  const canRead = can("field:read");
  const canWrite = can("field:write");

  const [tab, setTab] = useState<Tab>("plans");
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const [plans, setPlans] = useState<ProcessPlanRead[]>([]);
  const [annotations, setAnnotations] = useState<ProcessAnnotationRead[]>([]);
  const [trials, setTrials] = useState<TrialRunRead[]>([]);
  const [supports, setSupports] = useState<SupportTicketRead[]>([]);
  const [docs, setDocs] = useState<KnowledgeDocRead[]>([]);

  const [saving, setSaving] = useState(false);

  const [planOpen, setPlanOpen] = useState(false);
  const [planEdit, setPlanEdit] = useState<ProcessPlanRead | null>(null);
  const [annOpen, setAnnOpen] = useState(false);
  const [trialOpen, setTrialOpen] = useState(false);
  const [trialEdit, setTrialEdit] = useState<TrialRunRead | null>(null);
  const [supOpen, setSupOpen] = useState(false);
  const [supEdit, setSupEdit] = useState<SupportTicketRead | null>(null);
  const [kdOpen, setKdOpen] = useState(false);
  const [kdEdit, setKdEdit] = useState<KnowledgeDocRead | null>(null);

  const load = useCallback(async () => {
    if (!canRead) return;
    setErr(null);
    setLoading(true);
    try {
      if (tab === "plans") setPlans(await apiFetch<ProcessPlanRead[]>("/field/process-plans"));
      else if (tab === "annotations")
        setAnnotations(await apiFetch<ProcessAnnotationRead[]>("/field/annotations"));
      else if (tab === "trials") setTrials(await apiFetch<TrialRunRead[]>("/field/trial-runs"));
      else if (tab === "support") setSupports(await apiFetch<SupportTicketRead[]>("/field/support-tickets"));
      else setDocs(await apiFetch<KnowledgeDocRead[]>("/field/knowledge-docs"));
    } catch (e) {
      setErr(e instanceof ApiError ? formatApiDetail(e.detail) : "加载失败");
    } finally {
      setLoading(false);
    }
  }, [canRead, tab]);

  useEffect(() => {
    void load();
  }, [load]);

  const delAnn = async (id: string) => {
    if (!window.confirm("删除该批注？")) return;
    try {
      await apiFetch(`/field/annotations/${id}`, { method: "DELETE" });
      await load();
    } catch (e) {
      setErr(e instanceof ApiError ? formatApiDetail(e.detail) : "删除失败");
    }
  };

  const delPlan = async (id: string) => {
    if (!window.confirm("删除？")) return;
    try {
      await apiFetch(`/field/process-plans/${id}`, { method: "DELETE" });
      await load();
    } catch (e) {
      setErr(e instanceof ApiError ? formatApiDetail(e.detail) : "删除失败");
    }
  };

  const delTrial = async (id: string) => {
    if (!window.confirm("删除试模工单？")) return;
    try {
      await apiFetch(`/field/trial-runs/${id}`, { method: "DELETE" });
      await load();
    } catch (e) {
      setErr(e instanceof ApiError ? formatApiDetail(e.detail) : "删除失败");
    }
  };

  const delSup = async (id: string) => {
    if (!window.confirm("删除售后工单？")) return;
    try {
      await apiFetch(`/field/support-tickets/${id}`, { method: "DELETE" });
      await load();
    } catch (e) {
      setErr(e instanceof ApiError ? formatApiDetail(e.detail) : "删除失败");
    }
  };

  const delKd = async (id: string) => {
    if (!window.confirm("删除知识库条目？")) return;
    try {
      await apiFetch(`/field/knowledge-docs/${id}`, { method: "DELETE" });
      await load();
    } catch (e) {
      setErr(e instanceof ApiError ? formatApiDetail(e.detail) : "删除失败");
    }
  };

  if (!canRead) {
    return (
      <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
        需要 <span className="font-mono">field:read</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">工艺与现场（P4）</h1>
        <p className="mt-1 text-sm text-slate-600">
          工艺方案、批注、试模工单、售后工单与失效案例知识库；UUID 可从项目/标准件/选型等工作台复制。
        </p>
      </div>

      {err ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{err}</div>
      ) : null}

      <div className="flex flex-wrap gap-1 border-b border-slate-200">
        {(
          [
            ["plans", "工艺方案"],
            ["annotations", "工艺批注"],
            ["trials", "试模工单"],
            ["support", "售后工单"],
            ["knowledge", "知识库"],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={[
              "rounded-t-lg px-4 py-2 text-sm font-medium",
              tab === id ? "border border-b-0 border-slate-200 bg-white text-brand-700" : "text-slate-600 hover:bg-slate-100",
            ].join(" ")}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="mb-3 flex justify-end">
          {canWrite ? (
            <button
              type="button"
              onClick={() => {
                if (tab === "plans") {
                  setPlanEdit(null);
                  setPlanOpen(true);
                } else if (tab === "annotations") setAnnOpen(true);
                else if (tab === "trials") {
                  setTrialEdit(null);
                  setTrialOpen(true);
                } else if (tab === "support") {
                  setSupEdit(null);
                  setSupOpen(true);
                } else {
                  setKdEdit(null);
                  setKdOpen(true);
                }
              }}
              className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm hover:bg-slate-50"
            >
              新建
            </button>
          ) : null}
        </div>

        {loading ? (
          <p className="py-8 text-center text-sm text-slate-500">加载中…</p>
        ) : tab === "plans" ? (
          <PlansTable rows={plans} canWrite={canWrite} onEdit={(r) => { setPlanEdit(r); setPlanOpen(true); }} onDelete={delPlan} />
        ) : tab === "annotations" ? (
          <AnnotationsTable rows={annotations} canWrite={canWrite} onDelete={delAnn} />
        ) : tab === "trials" ? (
          <TrialsTable rows={trials} canWrite={canWrite} onEdit={(r) => { setTrialEdit(r); setTrialOpen(true); }} onDelete={delTrial} />
        ) : tab === "support" ? (
          <SupportTable rows={supports} canWrite={canWrite} onEdit={(r) => { setSupEdit(r); setSupOpen(true); }} onDelete={delSup} />
        ) : (
          <KbTable rows={docs} canWrite={canWrite} onEdit={(r) => { setKdEdit(r); setKdOpen(true); }} onDelete={delKd} />
        )}
      </div>

      <PlanModal
        open={planOpen}
        edit={planEdit}
        saving={saving}
        setSaving={setSaving}
        setErr={setErr}
        onClose={() => {
          setPlanOpen(false);
          setPlanEdit(null);
        }}
        onSaved={() => void load()}
      />
      <AnnotationModal
        open={annOpen}
        saving={saving}
        setSaving={setSaving}
        setErr={setErr}
        onClose={() => setAnnOpen(false)}
        onSaved={() => void load()}
      />
      <TrialModal
        open={trialOpen}
        edit={trialEdit}
        saving={saving}
        setSaving={setSaving}
        setErr={setErr}
        onClose={() => {
          setTrialOpen(false);
          setTrialEdit(null);
        }}
        onSaved={() => void load()}
      />
      <SupportModal
        open={supOpen}
        edit={supEdit}
        saving={saving}
        setSaving={setSaving}
        setErr={setErr}
        onClose={() => {
          setSupOpen(false);
          setSupEdit(null);
        }}
        onSaved={() => void load()}
      />
      <KbModal
        open={kdOpen}
        edit={kdEdit}
        saving={saving}
        setSaving={setSaving}
        setErr={setErr}
        onClose={() => {
          setKdOpen(false);
          setKdEdit(null);
        }}
        onSaved={() => void load()}
      />
    </div>
  );
}

function PlansTable({
  rows,
  canWrite,
  onEdit,
  onDelete,
}: {
  rows: ProcessPlanRead[];
  canWrite: boolean;
  onEdit: (r: ProcessPlanRead) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <div className="overflow-x-auto text-sm">
      <table className="min-w-[900px] w-full divide-y divide-slate-200">
        <thead className="bg-slate-50 text-left text-xs font-semibold text-slate-500">
          <tr>
            <th className="px-3 py-2">标题</th>
            <th className="px-3 py-2">状态</th>
            <th className="px-3 py-2">项目</th>
            <th className="px-3 py-2">标准件</th>
            <th className="px-3 py-2">更新</th>
            <th className="px-3 py-2 text-right">操作</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {rows.map((r) => (
            <tr key={r.id}>
              <td className="px-3 py-2 font-medium">{r.title}</td>
              <td className="px-3 py-2">{r.status}</td>
              <td className="px-3 py-2 font-mono text-xs">
                {r.project_id ? (
                  <Link className="text-brand-600 hover:underline" to={`/projects/${r.project_id}`}>
                    {r.project_id.slice(0, 8)}…
                  </Link>
                ) : (
                  "—"
                )}
              </td>
              <td className="px-3 py-2 font-mono text-xs">
                {r.standard_part_id ? (
                  <Link className="text-brand-600 hover:underline" to="/standard-parts">
                    {r.standard_part_id.slice(0, 8)}…
                  </Link>
                ) : (
                  "—"
                )}
              </td>
              <td className="whitespace-nowrap px-3 py-2 text-xs text-slate-500">{fmt(r.updated_at)}</td>
              <td className="space-x-2 px-3 py-2 text-right">
                {canWrite ? (
                  <>
                    <button type="button" className="text-brand-600 hover:underline" onClick={() => onEdit(r)}>
                      编辑
                    </button>
                    <button type="button" className="text-red-600 hover:underline" onClick={() => void onDelete(r.id)}>
                      删除
                    </button>
                  </>
                ) : null}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {rows.length === 0 ? <p className="py-6 text-center text-slate-500">暂无记录</p> : null}
    </div>
  );
}

function AnnotationsTable({
  rows,
  canWrite,
  onDelete,
}: {
  rows: ProcessAnnotationRead[];
  canWrite: boolean;
  onDelete: (id: string) => void;
}) {
  return (
    <div className="overflow-x-auto text-sm">
      <table className="min-w-full divide-y divide-slate-200">
        <thead className="bg-slate-50 text-left text-xs font-semibold text-slate-500">
          <tr>
            <th className="px-3 py-2">内容摘要</th>
            <th className="px-3 py-2">项目</th>
            <th className="px-3 py-2">标准件</th>
            <th className="px-3 py-2">时间</th>
            <th className="px-3 py-2 text-right">操作</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {rows.map((r) => (
            <tr key={r.id}>
              <td className="max-w-md truncate px-3 py-2">{r.body}</td>
              <td className="px-3 py-2 font-mono text-xs">{r.project_id?.slice(0, 8) ?? "—"}</td>
              <td className="px-3 py-2 font-mono text-xs">{r.standard_part_id?.slice(0, 8) ?? "—"}</td>
              <td className="whitespace-nowrap px-3 py-2 text-xs text-slate-500">{fmt(r.created_at)}</td>
              <td className="px-3 py-2 text-right">
                {canWrite ? (
                  <button type="button" className="text-red-600 hover:underline" onClick={() => void onDelete(r.id)}>
                    删除
                  </button>
                ) : null}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {rows.length === 0 ? <p className="py-6 text-center text-slate-500">暂无批注</p> : null}
    </div>
  );
}

function TrialsTable({
  rows,
  canWrite,
  onEdit,
  onDelete,
}: {
  rows: TrialRunRead[];
  canWrite: boolean;
  onEdit: (r: TrialRunRead) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <div className="overflow-x-auto text-sm">
      <table className="min-w-[960px] w-full divide-y divide-slate-200">
        <thead className="bg-slate-50 text-left text-xs font-semibold text-slate-500">
          <tr>
            <th className="px-3 py-2">标题</th>
            <th className="px-3 py-2">状态</th>
            <th className="px-3 py-2">项目</th>
            <th className="px-3 py-2">图纸版本</th>
            <th className="px-3 py-2">更新</th>
            <th className="px-3 py-2 text-right">操作</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {rows.map((r) => (
            <tr key={r.id}>
              <td className="px-3 py-2">{r.title}</td>
              <td className="px-3 py-2">{r.status}</td>
              <td className="px-3 py-2 font-mono text-xs">{r.project_id?.slice(0, 8) ?? "—"}</td>
              <td className="px-3 py-2 font-mono text-xs">{r.drawing_version_id?.slice(0, 8) ?? "—"}</td>
              <td className="whitespace-nowrap px-3 py-2 text-xs text-slate-500">{fmt(r.updated_at)}</td>
              <td className="space-x-2 px-3 py-2 text-right">
                {canWrite ? (
                  <>
                    <button type="button" className="text-brand-600 hover:underline" onClick={() => onEdit(r)}>
                      编辑
                    </button>
                    <button type="button" className="text-red-600 hover:underline" onClick={() => void onDelete(r.id)}>
                      删除
                    </button>
                  </>
                ) : null}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {rows.length === 0 ? <p className="py-6 text-center text-slate-500">暂无试模工单</p> : null}
    </div>
  );
}

function SupportTable({
  rows,
  canWrite,
  onEdit,
  onDelete,
}: {
  rows: SupportTicketRead[];
  canWrite: boolean;
  onEdit: (r: SupportTicketRead) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <div className="overflow-x-auto text-sm">
      <table className="min-w-[960px] w-full divide-y divide-slate-200">
        <thead className="bg-slate-50 text-left text-xs font-semibold text-slate-500">
          <tr>
            <th className="px-3 py-2">标题</th>
            <th className="px-3 py-2">状态</th>
            <th className="px-3 py-2">项目</th>
            <th className="px-3 py-2">选型存根</th>
            <th className="px-3 py-2">更新</th>
            <th className="px-3 py-2 text-right">操作</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {rows.map((r) => (
            <tr key={r.id}>
              <td className="px-3 py-2">{r.title}</td>
              <td className="px-3 py-2">{r.status}</td>
              <td className="px-3 py-2 font-mono text-xs">{r.project_id?.slice(0, 8) ?? "—"}</td>
              <td className="px-3 py-2 font-mono text-xs">{r.selection_stub_id?.slice(0, 8) ?? "—"}</td>
              <td className="whitespace-nowrap px-3 py-2 text-xs text-slate-500">{fmt(r.updated_at)}</td>
              <td className="space-x-2 px-3 py-2 text-right">
                {canWrite ? (
                  <>
                    <button type="button" className="text-brand-600 hover:underline" onClick={() => onEdit(r)}>
                      编辑
                    </button>
                    <button type="button" className="text-red-600 hover:underline" onClick={() => void onDelete(r.id)}>
                      删除
                    </button>
                  </>
                ) : null}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {rows.length === 0 ? <p className="py-6 text-center text-slate-500">暂无售后工单</p> : null}
    </div>
  );
}

function KbTable({
  rows,
  canWrite,
  onEdit,
  onDelete,
}: {
  rows: KnowledgeDocRead[];
  canWrite: boolean;
  onEdit: (r: KnowledgeDocRead) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <div className="overflow-x-auto text-sm">
      <table className="min-w-full divide-y divide-slate-200">
        <thead className="bg-slate-50 text-left text-xs font-semibold text-slate-500">
          <tr>
            <th className="px-3 py-2">标题</th>
            <th className="px-3 py-2">分类</th>
            <th className="px-3 py-2">状态</th>
            <th className="px-3 py-2">关联标准件</th>
            <th className="px-3 py-2 text-right">操作</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {rows.map((r) => (
            <tr key={r.id}>
              <td className="px-3 py-2">{r.title}</td>
              <td className="px-3 py-2">{r.category ?? "—"}</td>
              <td className="px-3 py-2">{r.status}</td>
              <td className="px-3 py-2 font-mono text-xs">{r.related_standard_part_id?.slice(0, 8) ?? "—"}</td>
              <td className="space-x-2 px-3 py-2 text-right">
                {canWrite ? (
                  <>
                    <button type="button" className="text-brand-600 hover:underline" onClick={() => onEdit(r)}>
                      编辑
                    </button>
                    <button type="button" className="text-red-600 hover:underline" onClick={() => void onDelete(r.id)}>
                      删除
                    </button>
                  </>
                ) : null}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {rows.length === 0 ? <p className="py-6 text-center text-slate-500">暂无知识库条目</p> : null}
    </div>
  );
}

function PlanModal({
  open,
  edit,
  saving,
  setSaving,
  setErr,
  onClose,
  onSaved,
}: {
  open: boolean;
  edit: ProcessPlanRead | null;
  saving: boolean;
  setSaving: (v: boolean) => void;
  setErr: (v: string | null) => void;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [status, setStatus] = useState("draft");
  const [projectId, setProjectId] = useState("");
  const [partId, setPartId] = useState("");
  const [fileId, setFileId] = useState("");

  useEffect(() => {
    if (open) {
      setTitle(edit?.title ?? "");
      setSummary(edit?.summary ?? "");
      setStatus(edit?.status ?? "draft");
      setProjectId(edit?.project_id ?? "");
      setPartId(edit?.standard_part_id ?? "");
      setFileId(edit?.primary_file_asset_id ?? "");
    }
  }, [open, edit]);

  const submit = async () => {
    const pid = projectId.trim() || null;
    const sid = partId.trim() || null;
    if (!pid && !sid) {
      setErr("请填写项目 ID 或标准件 ID 至少一项");
      return;
    }
    setSaving(true);
    setErr(null);
    try {
      const body = {
        title: title.trim(),
        summary: summary.trim() || null,
        status,
        project_id: pid,
        standard_part_id: sid,
        primary_file_asset_id: fileId.trim() || null,
      };
      if (edit) {
        await apiFetch(`/field/process-plans/${edit.id}`, { method: "PATCH", body });
      } else {
        await apiFetch("/field/process-plans", { method: "POST", body });
      }
      onClose();
      onSaved();
    } catch (e) {
      setErr(e instanceof ApiError ? formatApiDetail(e.detail) : "保存失败");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={open}
      title={edit ? "编辑工艺方案" : "新建工艺方案"}
      wide
      onClose={onClose}
      footer={
        <div className="flex justify-end gap-2">
          <button type="button" className="rounded-lg border px-4 py-2 text-sm" onClick={onClose}>
            取消
          </button>
          <button
            type="button"
            disabled={saving || !title.trim()}
            className="rounded-lg bg-brand-600 px-4 py-2 text-sm text-white disabled:opacity-50"
            onClick={() => void submit()}
          >
            保存
          </button>
        </div>
      }
    >
      <div className="grid gap-3 px-5 py-4 text-sm sm:grid-cols-2">
        <label className="block sm:col-span-2">
          <span className="text-slate-500">标题 *</span>
          <input className="mt-1 w-full rounded border px-2 py-1.5" value={title} onChange={(e) => setTitle(e.target.value)} />
        </label>
        <label className="block sm:col-span-2">
          <span className="text-slate-500">摘要</span>
          <textarea className="mt-1 w-full rounded border px-2 py-1.5" rows={3} value={summary} onChange={(e) => setSummary(e.target.value)} />
        </label>
        <label className="block">
          <span className="text-slate-500">状态</span>
          <select className="mt-1 w-full rounded border px-2 py-1.5" value={status} onChange={(e) => setStatus(e.target.value)}>
            {PLAN_STATUS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="text-slate-500">主附件 file_asset_id</span>
          <input className="mt-1 w-full rounded border px-2 py-1.5 font-mono text-xs" value={fileId} onChange={(e) => setFileId(e.target.value)} />
        </label>
        <label className="block sm:col-span-2">
          <span className="text-slate-500">项目 UUID（PMO）</span>
          <input className="mt-1 w-full rounded border px-2 py-1.5 font-mono text-xs" value={projectId} onChange={(e) => setProjectId(e.target.value)} />
        </label>
        <label className="block sm:col-span-2">
          <span className="text-slate-500">标准件 UUID</span>
          <input className="mt-1 w-full rounded border px-2 py-1.5 font-mono text-xs" value={partId} onChange={(e) => setPartId(e.target.value)} />
        </label>
      </div>
    </Modal>
  );
}

function AnnotationModal({
  open,
  saving,
  setSaving,
  setErr,
  onClose,
  onSaved,
}: {
  open: boolean;
  saving: boolean;
  setSaving: (v: boolean) => void;
  setErr: (v: string | null) => void;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [body, setBody] = useState("");
  const [projectId, setProjectId] = useState("");
  const [partId, setPartId] = useState("");
  const [fileId, setFileId] = useState("");

  const submit = async () => {
    const pid = projectId.trim() || null;
    const sid = partId.trim() || null;
    if (!body.trim()) {
      setErr("请填写批注内容");
      return;
    }
    if (!pid && !sid) {
      setErr("请填写项目 ID 或标准件 ID 至少一项");
      return;
    }
    setSaving(true);
    setErr(null);
    try {
      await apiFetch("/field/annotations", {
        method: "POST",
        body: {
          body: body.trim(),
          project_id: pid,
          standard_part_id: sid,
          file_asset_id: fileId.trim() || null,
        },
      });
      setBody("");
      setProjectId("");
      setPartId("");
      setFileId("");
      onClose();
      onSaved();
    } catch (e) {
      setErr(e instanceof ApiError ? formatApiDetail(e.detail) : "保存失败");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={open}
      title="新建工艺批注"
      wide
      onClose={onClose}
      footer={
        <div className="flex justify-end gap-2">
          <button type="button" className="rounded-lg border px-4 py-2 text-sm" onClick={onClose}>
            取消
          </button>
          <button
            type="button"
            disabled={saving}
            className="rounded-lg bg-brand-600 px-4 py-2 text-sm text-white disabled:opacity-50"
            onClick={() => void submit()}
          >
            保存
          </button>
        </div>
      }
    >
      <div className="space-y-3 px-5 py-4 text-sm">
        <label className="block">
          <span className="text-slate-500">批注内容 *</span>
          <textarea className="mt-1 w-full rounded border px-2 py-1.5" rows={4} value={body} onChange={(e) => setBody(e.target.value)} />
        </label>
        <label className="block">
          <span className="text-slate-500">项目 UUID</span>
          <input className="mt-1 w-full rounded border px-2 py-1.5 font-mono text-xs" value={projectId} onChange={(e) => setProjectId(e.target.value)} />
        </label>
        <label className="block">
          <span className="text-slate-500">标准件 UUID</span>
          <input className="mt-1 w-full rounded border px-2 py-1.5 font-mono text-xs" value={partId} onChange={(e) => setPartId(e.target.value)} />
        </label>
        <label className="block">
          <span className="text-slate-500">附件 file_asset_id</span>
          <input className="mt-1 w-full rounded border px-2 py-1.5 font-mono text-xs" value={fileId} onChange={(e) => setFileId(e.target.value)} />
        </label>
      </div>
    </Modal>
  );
}

function TrialModal({
  open,
  edit,
  saving,
  setSaving,
  setErr,
  onClose,
  onSaved,
}: {
  open: boolean;
  edit: TrialRunRead | null;
  saving: boolean;
  setSaving: (v: boolean) => void;
  setErr: (v: string | null) => void;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState("draft");
  const [projectId, setProjectId] = useState("");
  const [partId, setPartId] = useState("");
  const [dvId, setDvId] = useState("");
  const [assignee, setAssignee] = useState("");
  const [reportFile, setReportFile] = useState("");

  useEffect(() => {
    if (open) {
      setTitle(edit?.title ?? "");
      setDescription(edit?.description ?? "");
      setStatus(edit?.status ?? "draft");
      setProjectId(edit?.project_id ?? "");
      setPartId(edit?.standard_part_id ?? "");
      setDvId(edit?.drawing_version_id ?? "");
      setAssignee(edit?.assignee_user_id ?? "");
      setReportFile(edit?.report_file_asset_id ?? "");
    }
  }, [open, edit]);

  const submit = async () => {
    if (!title.trim()) return;
    setSaving(true);
    setErr(null);
    try {
      const payload = {
        title: title.trim(),
        description: description.trim() || null,
        status,
        project_id: projectId.trim() || null,
        standard_part_id: partId.trim() || null,
        drawing_version_id: dvId.trim() || null,
        assignee_user_id: assignee.trim() || null,
        report_file_asset_id: reportFile.trim() || null,
      };
      if (edit) {
        await apiFetch(`/field/trial-runs/${edit.id}`, { method: "PATCH", body: payload });
      } else {
        await apiFetch("/field/trial-runs", { method: "POST", body: payload });
      }
      onClose();
      onSaved();
    } catch (e) {
      setErr(e instanceof ApiError ? formatApiDetail(e.detail) : "保存失败");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open={open} title={edit ? "编辑试模工单" : "新建试模工单"} wide onClose={onClose} footer={
      <div className="flex justify-end gap-2">
        <button type="button" className="rounded-lg border px-4 py-2 text-sm" onClick={onClose}>取消</button>
        <button type="button" disabled={saving || !title.trim()} className="rounded-lg bg-brand-600 px-4 py-2 text-sm text-white disabled:opacity-50" onClick={() => void submit()}>保存</button>
      </div>
    }>
      <div className="grid gap-3 px-5 py-4 text-sm sm:grid-cols-2">
        <label className="block sm:col-span-2">
          <span className="text-slate-500">标题 *</span>
          <input className="mt-1 w-full rounded border px-2 py-1.5" value={title} onChange={(e) => setTitle(e.target.value)} />
        </label>
        <label className="block sm:col-span-2">
          <span className="text-slate-500">说明</span>
          <textarea className="mt-1 w-full rounded border px-2 py-1.5" rows={2} value={description} onChange={(e) => setDescription(e.target.value)} />
        </label>
        <label className="block">
          <span className="text-slate-500">状态（须符合状态机）</span>
          <select className="mt-1 w-full rounded border px-2 py-1.5" value={status} onChange={(e) => setStatus(e.target.value)}>
            {TRIAL_STATUS.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="text-slate-500">报告附件 file_asset_id</span>
          <input className="mt-1 w-full rounded border px-2 py-1.5 font-mono text-xs" value={reportFile} onChange={(e) => setReportFile(e.target.value)} />
        </label>
        <label className="block sm:col-span-2">
          <span className="text-slate-500">项目 UUID</span>
          <input className="mt-1 w-full rounded border px-2 py-1.5 font-mono text-xs" value={projectId} onChange={(e) => setProjectId(e.target.value)} />
        </label>
        <label className="block sm:col-span-2">
          <span className="text-slate-500">标准件 UUID</span>
          <input className="mt-1 w-full rounded border px-2 py-1.5 font-mono text-xs" value={partId} onChange={(e) => setPartId(e.target.value)} />
        </label>
        <label className="block sm:col-span-2">
          <span className="text-slate-500">图纸版本 UUID</span>
          <input className="mt-1 w-full rounded border px-2 py-1.5 font-mono text-xs" value={dvId} onChange={(e) => setDvId(e.target.value)} />
        </label>
        <label className="block sm:col-span-2">
          <span className="text-slate-500">负责人用户 UUID</span>
          <input className="mt-1 w-full rounded border px-2 py-1.5 font-mono text-xs" value={assignee} onChange={(e) => setAssignee(e.target.value)} />
        </label>
      </div>
    </Modal>
  );
}

function SupportModal({
  open,
  edit,
  saving,
  setSaving,
  setErr,
  onClose,
  onSaved,
}: {
  open: boolean;
  edit: SupportTicketRead | null;
  saving: boolean;
  setSaving: (v: boolean) => void;
  setErr: (v: string | null) => void;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState("open");
  const [projectId, setProjectId] = useState("");
  const [dvId, setDvId] = useState("");
  const [stubId, setStubId] = useState("");
  const [assignee, setAssignee] = useState("");
  const [resolution, setResolution] = useState("");

  useEffect(() => {
    if (open) {
      setTitle(edit?.title ?? "");
      setDescription(edit?.description ?? "");
      setStatus(edit?.status ?? "open");
      setProjectId(edit?.project_id ?? "");
      setDvId(edit?.drawing_version_id ?? "");
      setStubId(edit?.selection_stub_id ?? "");
      setAssignee(edit?.assignee_user_id ?? "");
      setResolution(edit?.resolution_note ?? "");
    }
  }, [open, edit]);

  const submit = async () => {
    if (!title.trim()) return;
    setSaving(true);
    setErr(null);
    try {
      const payload = {
        title: title.trim(),
        description: description.trim() || null,
        status,
        project_id: projectId.trim() || null,
        drawing_version_id: dvId.trim() || null,
        selection_stub_id: stubId.trim() || null,
        assignee_user_id: assignee.trim() || null,
        resolution_note: resolution.trim() || null,
      };
      if (edit) {
        await apiFetch(`/field/support-tickets/${edit.id}`, { method: "PATCH", body: payload });
      } else {
        await apiFetch("/field/support-tickets", { method: "POST", body: payload });
      }
      onClose();
      onSaved();
    } catch (e) {
      setErr(e instanceof ApiError ? formatApiDetail(e.detail) : "保存失败");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open={open} title={edit ? "编辑售后工单" : "新建售后工单"} wide onClose={onClose} footer={
      <div className="flex justify-end gap-2">
        <button type="button" className="rounded-lg border px-4 py-2 text-sm" onClick={onClose}>取消</button>
        <button type="button" disabled={saving || !title.trim()} className="rounded-lg bg-brand-600 px-4 py-2 text-sm text-white disabled:opacity-50" onClick={() => void submit()}>保存</button>
      </div>
    }>
      <div className="grid gap-3 px-5 py-4 text-sm sm:grid-cols-2">
        <label className="block sm:col-span-2">
          <span className="text-slate-500">标题 *</span>
          <input className="mt-1 w-full rounded border px-2 py-1.5" value={title} onChange={(e) => setTitle(e.target.value)} />
        </label>
        <label className="block sm:col-span-2">
          <span className="text-slate-500">描述</span>
          <textarea className="mt-1 w-full rounded border px-2 py-1.5" rows={2} value={description} onChange={(e) => setDescription(e.target.value)} />
        </label>
        <label className="block">
          <span className="text-slate-500">状态</span>
          <select className="mt-1 w-full rounded border px-2 py-1.5" value={status} onChange={(e) => setStatus(e.target.value)}>
            {SUPPORT_STATUS.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </label>
        <label className="block sm:col-span-2">
          <span className="text-slate-500">处理说明</span>
          <textarea className="mt-1 w-full rounded border px-2 py-1.5" rows={2} value={resolution} onChange={(e) => setResolution(e.target.value)} />
        </label>
        <label className="block sm:col-span-2">
          <span className="text-slate-500">项目 UUID</span>
          <input className="mt-1 w-full rounded border px-2 py-1.5 font-mono text-xs" value={projectId} onChange={(e) => setProjectId(e.target.value)} />
        </label>
        <label className="block sm:col-span-2">
          <span className="text-slate-500">图纸版本 UUID（溯源）</span>
          <input className="mt-1 w-full rounded border px-2 py-1.5 font-mono text-xs" value={dvId} onChange={(e) => setDvId(e.target.value)} />
        </label>
        <label className="block sm:col-span-2">
          <span className="text-slate-500">选型存根 UUID（溯源）</span>
          <input className="mt-1 w-full rounded border px-2 py-1.5 font-mono text-xs" value={stubId} onChange={(e) => setStubId(e.target.value)} />
        </label>
        <label className="block sm:col-span-2">
          <span className="text-slate-500">负责人用户 UUID</span>
          <input className="mt-1 w-full rounded border px-2 py-1.5 font-mono text-xs" value={assignee} onChange={(e) => setAssignee(e.target.value)} />
        </label>
      </div>
    </Modal>
  );
}

function KbModal({
  open,
  edit,
  saving,
  setSaving,
  setErr,
  onClose,
  onSaved,
}: {
  open: boolean;
  edit: KnowledgeDocRead | null;
  saving: boolean;
  setSaving: (v: boolean) => void;
  setErr: (v: string | null) => void;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [symptom, setSymptom] = useState("");
  const [cause, setCause] = useState("");
  const [remedy, setRemedy] = useState("");
  const [status, setStatus] = useState("draft");
  const [fileId, setFileId] = useState("");
  const [partId, setPartId] = useState("");

  useEffect(() => {
    if (open) {
      setTitle(edit?.title ?? "");
      setCategory(edit?.category ?? "");
      setSymptom(edit?.symptom ?? "");
      setCause(edit?.cause ?? "");
      setRemedy(edit?.remedy ?? "");
      setStatus(edit?.status ?? "draft");
      setFileId(edit?.file_asset_id ?? "");
      setPartId(edit?.related_standard_part_id ?? "");
    }
  }, [open, edit]);

  const submit = async () => {
    if (!title.trim()) return;
    setSaving(true);
    setErr(null);
    try {
      const payload = {
        title: title.trim(),
        category: category.trim() || null,
        symptom: symptom.trim() || null,
        cause: cause.trim() || null,
        remedy: remedy.trim() || null,
        status,
        file_asset_id: fileId.trim() || null,
        related_standard_part_id: partId.trim() || null,
      };
      if (edit) {
        await apiFetch(`/field/knowledge-docs/${edit.id}`, { method: "PATCH", body: payload });
      } else {
        await apiFetch("/field/knowledge-docs", { method: "POST", body: payload });
      }
      onClose();
      onSaved();
    } catch (e) {
      setErr(e instanceof ApiError ? formatApiDetail(e.detail) : "保存失败");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open={open} title={edit ? "编辑知识库条目" : "新建失效案例"} wide onClose={onClose} footer={
      <div className="flex justify-end gap-2">
        <button type="button" className="rounded-lg border px-4 py-2 text-sm" onClick={onClose}>取消</button>
        <button type="button" disabled={saving || !title.trim()} className="rounded-lg bg-brand-600 px-4 py-2 text-sm text-white disabled:opacity-50" onClick={() => void submit()}>保存</button>
      </div>
    }>
      <div className="grid gap-3 px-5 py-4 text-sm sm:grid-cols-2">
        <label className="block sm:col-span-2">
          <span className="text-slate-500">标题 *</span>
          <input className="mt-1 w-full rounded border px-2 py-1.5" value={title} onChange={(e) => setTitle(e.target.value)} />
        </label>
        <label className="block">
          <span className="text-slate-500">分类</span>
          <input className="mt-1 w-full rounded border px-2 py-1.5" value={category} onChange={(e) => setCategory(e.target.value)} />
        </label>
        <label className="block">
          <span className="text-slate-500">状态</span>
          <select className="mt-1 w-full rounded border px-2 py-1.5" value={status} onChange={(e) => setStatus(e.target.value)}>
            {KD_STATUS.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </label>
        <label className="block sm:col-span-2">
          <span className="text-slate-500">现象</span>
          <textarea className="mt-1 w-full rounded border px-2 py-1.5" rows={2} value={symptom} onChange={(e) => setSymptom(e.target.value)} />
        </label>
        <label className="block sm:col-span-2">
          <span className="text-slate-500">原因</span>
          <textarea className="mt-1 w-full rounded border px-2 py-1.5" rows={2} value={cause} onChange={(e) => setCause(e.target.value)} />
        </label>
        <label className="block sm:col-span-2">
          <span className="text-slate-500">对策</span>
          <textarea className="mt-1 w-full rounded border px-2 py-1.5" rows={2} value={remedy} onChange={(e) => setRemedy(e.target.value)} />
        </label>
        <label className="block">
          <span className="text-slate-500">附件 file_asset_id</span>
          <input className="mt-1 w-full rounded border px-2 py-1.5 font-mono text-xs" value={fileId} onChange={(e) => setFileId(e.target.value)} />
        </label>
        <label className="block">
          <span className="text-slate-500">关联标准件 UUID</span>
          <input className="mt-1 w-full rounded border px-2 py-1.5 font-mono text-xs" value={partId} onChange={(e) => setPartId(e.target.value)} />
        </label>
      </div>
    </Modal>
  );
}
