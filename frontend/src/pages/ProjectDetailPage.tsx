import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";

import { Modal } from "@/components/Modal";
import { ApiError, apiFetch, formatApiDetail } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import type {
  DesignChangeRequest,
  DesignTask,
  Project,
  ProjectMilestone,
  ProjectRisk,
  ProjectTask,
  SelectionStub,
  UUID,
} from "@/lib/types";

type TabId =
  | "overview"
  | "wbs"
  | "milestones"
  | "risks"
  | "design-tasks"
  | "design-changes"
  | "selection-stubs";

const TABS: { id: TabId; label: string; read: string }[] = [
  { id: "overview", label: "概览", read: "project:read" },
  { id: "wbs", label: "WBS 任务", read: "wbs:read" },
  { id: "milestones", label: "里程碑", read: "milestone:read" },
  { id: "risks", label: "风险", read: "risk:read" },
  { id: "design-tasks", label: "设计任务", read: "design_task:read" },
  { id: "design-changes", label: "设计变更", read: "design_change:read" },
  { id: "selection-stubs", label: "选型存根", read: "selection:read" },
];

export function ProjectDetailPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const { can } = useAuth();
  const pid = projectId as UUID | undefined;

  const [project, setProject] = useState<Project | null>(null);
  const [tab, setTab] = useState<TabId>("overview");
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const [tasks, setTasks] = useState<ProjectTask[]>([]);
  const [milestones, setMilestones] = useState<ProjectMilestone[]>([]);
  const [risks, setRisks] = useState<ProjectRisk[]>([]);
  const [designTasks, setDesignTasks] = useState<DesignTask[]>([]);
  const [changes, setChanges] = useState<DesignChangeRequest[]>([]);
  const [stubs, setStubs] = useState<SelectionStub[]>([]);
  const [tabLoading, setTabLoading] = useState(false);

  const [projEditOpen, setProjEditOpen] = useState(false);
  const [pName, setPName] = useState("");
  const [pStatus, setPStatus] = useState("");
  const [pRemark, setPRemark] = useState("");
  const [saving, setSaving] = useState(false);

  const loadProject = useCallback(async () => {
    if (!pid) return;
    setErr(null);
    setLoading(true);
    try {
      setProject(await apiFetch<Project>(`/projects/${pid}`));
    } catch (e) {
      setErr(e instanceof ApiError ? formatApiDetail(e.detail) : "加载项目失败");
      setProject(null);
    } finally {
      setLoading(false);
    }
  }, [pid]);

  const loadTabData = useCallback(async () => {
    if (!pid) return;
    setTabLoading(true);
    setErr(null);
    try {
      if (tab === "wbs" && can("wbs:read")) {
        setTasks(await apiFetch<ProjectTask[]>(`/projects/${pid}/tasks`));
      } else if (tab === "milestones" && can("milestone:read")) {
        setMilestones(await apiFetch<ProjectMilestone[]>(`/projects/${pid}/milestones`));
      } else if (tab === "risks" && can("risk:read")) {
        setRisks(await apiFetch<ProjectRisk[]>(`/projects/${pid}/risks`));
      } else if (tab === "design-tasks" && can("design_task:read")) {
        setDesignTasks(await apiFetch<DesignTask[]>(`/projects/${pid}/design-tasks`));
      } else if (tab === "design-changes" && can("design_change:read")) {
        setChanges(await apiFetch<DesignChangeRequest[]>(`/projects/${pid}/design-changes`));
      } else if (tab === "selection-stubs" && can("selection:read")) {
        setStubs(await apiFetch<SelectionStub[]>(`/projects/${pid}/selection-stubs`));
      }
    } catch (e) {
      setErr(e instanceof ApiError ? formatApiDetail(e.detail) : "加载数据失败");
    } finally {
      setTabLoading(false);
    }
  }, [pid, tab, can]);

  useEffect(() => {
    void loadProject();
  }, [loadProject]);

  useEffect(() => {
    if (!pid || tab === "overview") return;
    void loadTabData();
  }, [pid, tab, loadTabData]);

  const openProjectEdit = () => {
    if (!project) return;
    setPName(project.name);
    setPStatus(project.status);
    setPRemark(project.remark ?? "");
    setProjEditOpen(true);
  };

  const saveProject = async () => {
    if (!pid) return;
    setSaving(true);
    setErr(null);
    try {
      const updated = await apiFetch<Project>(`/projects/${pid}`, {
        method: "PATCH",
        body: {
          name: pName.trim(),
          status: pStatus.trim(),
          remark: pRemark.trim() || null,
        },
      });
      setProject(updated);
      setProjEditOpen(false);
    } catch (e) {
      setErr(e instanceof ApiError ? formatApiDetail(e.detail) : "保存失败");
    } finally {
      setSaving(false);
    }
  };

  if (!pid) {
    return <div className="text-sm text-red-600">无效的项目 ID</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link to="/projects" className="text-sm font-medium text-brand-600 hover:underline">
            ← 返回项目列表
          </Link>
          <h1 className="mt-2 text-2xl font-bold text-slate-800">
            {loading ? "加载中…" : project?.name ?? "项目"}
          </h1>
          {project ? (
            <p className="mt-1 font-mono text-xs text-slate-500">
              {project.code} · {project.status}
            </p>
          ) : null}
        </div>
        {project && can("project:write") ? (
          <button
            type="button"
            onClick={openProjectEdit}
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            编辑项目
          </button>
        ) : null}
      </div>

      {err ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{err}</div>
      ) : null}

      <div className="flex flex-wrap gap-1 border-b border-slate-200 pb-px">
        {TABS.filter((t) => can(t.read)).map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={[
              "rounded-t-lg px-4 py-2 text-sm font-medium transition-colors",
              tab === t.id
                ? "border border-b-0 border-slate-200 bg-white text-brand-700"
                : "text-slate-600 hover:bg-slate-100",
            ].join(" ")}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        {tab === "overview" && project ? (
          <div className="space-y-2 text-sm text-slate-700">
            <p>
              <span className="font-medium text-slate-500">名称：</span>
              {project.name}
            </p>
            <p>
              <span className="font-medium text-slate-500">编码：</span>
              <span className="font-mono">{project.code}</span>
            </p>
            <p>
              <span className="font-medium text-slate-500">状态：</span>
              {project.status}
            </p>
            <p>
              <span className="font-medium text-slate-500">备注：</span>
              {project.remark ?? "—"}
            </p>
          </div>
        ) : null}

        {tab !== "overview" ? (
          tabLoading ? (
            <p className="text-sm text-slate-500">加载中…</p>
          ) : (
            <TabPanels
              tab={tab}
              projectId={pid}
              can={can}
              tasks={tasks}
              milestones={milestones}
              risks={risks}
              designTasks={designTasks}
              changes={changes}
              stubs={stubs}
              onRefresh={() => void loadTabData()}
            />
          )
        ) : null}
      </div>

      <Modal
        open={projEditOpen}
        title="编辑项目"
        onClose={() => setProjEditOpen(false)}
        footer={
          <>
            <button type="button" className="rounded-lg border px-4 py-2 text-sm" onClick={() => setProjEditOpen(false)}>
              取消
            </button>
            <button
              type="button"
              disabled={saving || !pName.trim()}
              className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
              onClick={() => void saveProject()}
            >
              {saving ? "保存中…" : "保存"}
            </button>
          </>
        }
      >
        <div className="space-y-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">名称</label>
            <input
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              value={pName}
              onChange={(e) => setPName(e.target.value)}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">状态</label>
            <input
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              value={pStatus}
              onChange={(e) => setPStatus(e.target.value)}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">备注</label>
            <textarea
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              rows={2}
              value={pRemark}
              onChange={(e) => setPRemark(e.target.value)}
            />
          </div>
        </div>
      </Modal>
    </div>
  );
}

type TabPanelsProps = {
  tab: TabId;
  projectId: UUID;
  can: (c: string) => boolean;
  tasks: ProjectTask[];
  milestones: ProjectMilestone[];
  risks: ProjectRisk[];
  designTasks: DesignTask[];
  changes: DesignChangeRequest[];
  stubs: SelectionStub[];
  onRefresh: () => void;
};

function TabPanels(props: TabPanelsProps) {
  const { tab, projectId, can, tasks, milestones, risks, designTasks, changes, stubs, onRefresh } = props;

  switch (tab) {
    case "wbs":
      return <WbsPanel projectId={projectId} can={can} rows={tasks} onRefresh={onRefresh} />;
    case "milestones":
      return <MilestonesPanel projectId={projectId} can={can} rows={milestones} onRefresh={onRefresh} />;
    case "risks":
      return <RisksPanel projectId={projectId} can={can} rows={risks} onRefresh={onRefresh} />;
    case "design-tasks":
      return <DesignTasksPanel projectId={projectId} can={can} rows={designTasks} onRefresh={onRefresh} />;
    case "design-changes":
      return <ChangesPanel projectId={projectId} can={can} rows={changes} onRefresh={onRefresh} />;
    case "selection-stubs":
      return <StubsPanel projectId={projectId} can={can} rows={stubs} onRefresh={onRefresh} />;
    default:
      return null;
  }
}

function WbsPanel({
  projectId,
  can,
  rows,
  onRefresh,
}: {
  projectId: UUID;
  can: (c: string) => boolean;
  rows: ProjectTask[];
  onRefresh: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [status, setStatus] = useState("todo");
  const [due, setDue] = useState("");
  const [saving, setSaving] = useState(false);
  const [edit, setEdit] = useState<ProjectTask | null>(null);

  const submit = async () => {
    setSaving(true);
    try {
      await apiFetch(`/projects/${projectId}/tasks`, {
        method: "POST",
        body: {
          title: title.trim(),
          status,
          due_date: due || null,
          sort_order: 0,
        },
      });
      setOpen(false);
      setTitle("");
      setDue("");
      onRefresh();
    } finally {
      setSaving(false);
    }
  };

  const patch = async () => {
    if (!edit) return;
    setSaving(true);
    try {
      await apiFetch(`/projects/${projectId}/tasks/${edit.id}`, {
        method: "PATCH",
        body: { title: edit.title, status: edit.status, due_date: edit.due_date, remark: edit.remark },
      });
      setEdit(null);
      onRefresh();
    } finally {
      setSaving(false);
    }
  };

  const del = async (id: UUID) => {
    if (!window.confirm("删除该任务？")) return;
    await apiFetch(`/projects/${projectId}/tasks/${id}`, { method: "DELETE" });
    onRefresh();
  };

  return (
    <div className="space-y-4">
      {can("wbs:write") ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="rounded-lg bg-brand-600 px-3 py-1.5 text-sm font-semibold text-white"
        >
          新建任务
        </button>
      ) : null}
      <table className="min-w-full divide-y divide-slate-200 text-sm">
        <thead className="bg-slate-50 text-left text-xs font-semibold uppercase text-slate-500">
          <tr>
            <th className="px-3 py-2">标题</th>
            <th className="px-3 py-2">状态</th>
            <th className="px-3 py-2">截止</th>
            <th className="px-3 py-2 text-right">操作</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {rows.map((r) => (
            <tr key={r.id}>
              <td className="px-3 py-2">{r.title}</td>
              <td className="px-3 py-2">{r.status}</td>
              <td className="px-3 py-2">{r.due_date ?? "—"}</td>
              <td className="px-3 py-2 text-right">
                {can("wbs:write") ? (
                  <>
                    <button type="button" className="text-brand-600 hover:underline" onClick={() => setEdit({ ...r })}>
                      编辑
                    </button>
                    <button type="button" className="ml-2 text-red-600 hover:underline" onClick={() => void del(r.id)}>
                      删除
                    </button>
                  </>
                ) : (
                  "—"
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <Modal
        open={open}
        title="新建 WBS 任务"
        onClose={() => setOpen(false)}
        footer={
          <>
            <button type="button" className="rounded-lg border px-4 py-2 text-sm" onClick={() => setOpen(false)}>
              取消
            </button>
            <button
              type="button"
              disabled={saving || !title.trim()}
              className="rounded-lg bg-brand-600 px-4 py-2 text-sm text-white"
              onClick={() => void submit()}
            >
              保存
            </button>
          </>
        }
      >
        <div className="space-y-3">
          <div>
            <label className="mb-1 block text-xs text-slate-600">标题 *</label>
            <input className="w-full rounded border px-3 py-2 text-sm" value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div>
            <label className="mb-1 block text-xs text-slate-600">状态</label>
            <select className="w-full rounded border px-3 py-2 text-sm" value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="todo">todo</option>
              <option value="in_progress">in_progress</option>
              <option value="done">done</option>
              <option value="cancelled">cancelled</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs text-slate-600">截止日期</label>
            <input type="date" className="w-full rounded border px-3 py-2 text-sm" value={due} onChange={(e) => setDue(e.target.value)} />
          </div>
        </div>
      </Modal>

      <Modal
        open={edit !== null}
        title="编辑任务"
        onClose={() => setEdit(null)}
        footer={
          <>
            <button type="button" className="rounded-lg border px-4 py-2 text-sm" onClick={() => setEdit(null)}>
              取消
            </button>
            <button type="button" disabled={saving} className="rounded-lg bg-brand-600 px-4 py-2 text-sm text-white" onClick={() => void patch()}>
              保存
            </button>
          </>
        }
      >
        {edit ? (
          <div className="space-y-3">
            <input
              className="w-full rounded border px-3 py-2 text-sm"
              value={edit.title}
              onChange={(e) => setEdit({ ...edit, title: e.target.value })}
            />
            <select
              className="w-full rounded border px-3 py-2 text-sm"
              value={edit.status}
              onChange={(e) => setEdit({ ...edit, status: e.target.value })}
            >
              <option value="todo">todo</option>
              <option value="in_progress">in_progress</option>
              <option value="done">done</option>
              <option value="cancelled">cancelled</option>
            </select>
            <input
              type="date"
              className="w-full rounded border px-3 py-2 text-sm"
              value={edit.due_date?.slice(0, 10) ?? ""}
              onChange={(e) => setEdit({ ...edit, due_date: e.target.value || null })}
            />
            <textarea
              className="w-full rounded border px-3 py-2 text-sm"
              placeholder="备注"
              rows={2}
              value={edit.remark ?? ""}
              onChange={(e) => setEdit({ ...edit, remark: e.target.value || null })}
            />
          </div>
        ) : null}
      </Modal>
    </div>
  );
}

function MilestonesPanel({
  projectId,
  can,
  rows,
  onRefresh,
}: {
  projectId: UUID;
  can: (c: string) => boolean;
  rows: ProjectMilestone[];
  onRefresh: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [target, setTarget] = useState("");
  const [status, setStatus] = useState("planned");
  const [saving, setSaving] = useState(false);
  const [edit, setEdit] = useState<ProjectMilestone | null>(null);

  const submit = async () => {
    setSaving(true);
    try {
      await apiFetch(`/projects/${projectId}/milestones`, {
        method: "POST",
        body: { name: name.trim(), target_date: target || null, status, sort_order: 0 },
      });
      setOpen(false);
      setName("");
      setTarget("");
      onRefresh();
    } finally {
      setSaving(false);
    }
  };

  const saveEdit = async () => {
    if (!edit) return;
    setSaving(true);
    try {
      await apiFetch(`/projects/${projectId}/milestones/${edit.id}`, {
        method: "PATCH",
        body: {
          name: edit.name,
          target_date: edit.target_date,
          status: edit.status,
          sort_order: edit.sort_order,
        },
      });
      setEdit(null);
      onRefresh();
    } finally {
      setSaving(false);
    }
  };

  const del = async (id: UUID) => {
    if (!window.confirm("删除？")) return;
    await apiFetch(`/projects/${projectId}/milestones/${id}`, { method: "DELETE" });
    onRefresh();
  };

  return (
    <div className="space-y-4">
      {can("milestone:write") ? (
        <button type="button" onClick={() => setOpen(true)} className="rounded-lg bg-brand-600 px-3 py-1.5 text-sm text-white">
          新建里程碑
        </button>
      ) : null}
      <table className="min-w-full divide-y text-sm">
        <thead className="bg-slate-50 text-xs uppercase text-slate-500">
          <tr>
            <th className="px-3 py-2 text-left">名称</th>
            <th className="px-3 py-2 text-left">目标日</th>
            <th className="px-3 py-2 text-left">状态</th>
            <th className="px-3 py-2 text-right">操作</th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {rows.map((r) => (
            <tr key={r.id}>
              <td className="px-3 py-2">{r.name}</td>
              <td className="px-3 py-2">{r.target_date ?? "—"}</td>
              <td className="px-3 py-2">{r.status}</td>
              <td className="px-3 py-2 text-right">
                {can("milestone:write") ? (
                  <>
                    <button type="button" className="text-brand-600 hover:underline" onClick={() => setEdit({ ...r })}>
                      编辑
                    </button>
                    <button type="button" className="ml-2 text-red-600 hover:underline" onClick={() => void del(r.id)}>
                      删
                    </button>
                  </>
                ) : (
                  "—"
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <Modal
        open={open}
        title="新建里程碑"
        onClose={() => setOpen(false)}
        footer={
          <>
            <button type="button" className="rounded-lg border px-4 py-2 text-sm" onClick={() => setOpen(false)}>
              取消
            </button>
            <button type="button" disabled={saving || !name.trim()} className="rounded-lg bg-brand-600 px-4 py-2 text-sm text-white" onClick={() => void submit()}>
              保存
            </button>
          </>
        }
      >
        <div className="space-y-3">
          <input className="w-full rounded border px-3 py-2 text-sm" placeholder="名称 *" value={name} onChange={(e) => setName(e.target.value)} />
          <input type="date" className="w-full rounded border px-3 py-2 text-sm" value={target} onChange={(e) => setTarget(e.target.value)} />
          <select className="w-full rounded border px-3 py-2 text-sm" value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="planned">planned</option>
            <option value="done">done</option>
            <option value="missed">missed</option>
          </select>
        </div>
      </Modal>

      <Modal
        open={edit !== null}
        title="编辑里程碑"
        onClose={() => setEdit(null)}
        footer={
          <>
            <button type="button" className="rounded-lg border px-4 py-2 text-sm" onClick={() => setEdit(null)}>
              取消
            </button>
            <button type="button" disabled={saving} className="rounded-lg bg-brand-600 px-4 py-2 text-sm text-white" onClick={() => void saveEdit()}>
              保存
            </button>
          </>
        }
      >
        {edit ? (
          <div className="space-y-3">
            <input className="w-full rounded border px-3 py-2 text-sm" value={edit.name} onChange={(e) => setEdit({ ...edit, name: e.target.value })} />
            <input
              type="date"
              className="w-full rounded border px-3 py-2 text-sm"
              value={edit.target_date?.slice(0, 10) ?? ""}
              onChange={(e) => setEdit({ ...edit, target_date: e.target.value || null })}
            />
            <select className="w-full rounded border px-3 py-2 text-sm" value={edit.status} onChange={(e) => setEdit({ ...edit, status: e.target.value })}>
              <option value="planned">planned</option>
              <option value="done">done</option>
              <option value="missed">missed</option>
            </select>
          </div>
        ) : null}
      </Modal>
    </div>
  );
}

function RisksPanel({
  projectId,
  can,
  rows,
  onRefresh,
}: {
  projectId: UUID;
  can: (c: string) => boolean;
  rows: ProjectRisk[];
  onRefresh: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [level, setLevel] = useState("medium");
  const [saving, setSaving] = useState(false);
  const [edit, setEdit] = useState<ProjectRisk | null>(null);

  const submit = async () => {
    setSaving(true);
    try {
      await apiFetch(`/projects/${projectId}/risks`, {
        method: "POST",
        body: { title: title.trim(), risk_level: level, status: "open" },
      });
      setOpen(false);
      setTitle("");
      onRefresh();
    } finally {
      setSaving(false);
    }
  };

  const saveEdit = async () => {
    if (!edit) return;
    setSaving(true);
    try {
      await apiFetch(`/projects/${projectId}/risks/${edit.id}`, {
        method: "PATCH",
        body: {
          title: edit.title,
          risk_level: edit.risk_level,
          status: edit.status,
          remark: edit.remark,
        },
      });
      setEdit(null);
      onRefresh();
    } finally {
      setSaving(false);
    }
  };

  const del = async (id: UUID) => {
    if (!window.confirm("删除？")) return;
    await apiFetch(`/projects/${projectId}/risks/${id}`, { method: "DELETE" });
    onRefresh();
  };

  return (
    <div className="space-y-4">
      {can("risk:write") ? (
        <button type="button" onClick={() => setOpen(true)} className="rounded-lg bg-brand-600 px-3 py-1.5 text-sm text-white">
          登记风险
        </button>
      ) : null}
      <table className="min-w-full divide-y text-sm">
        <thead className="bg-slate-50 text-xs uppercase text-slate-500">
          <tr>
            <th className="px-3 py-2 text-left">标题</th>
            <th className="px-3 py-2">级别</th>
            <th className="px-3 py-2">状态</th>
            <th className="px-3 py-2 text-right">操作</th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {rows.map((r) => (
            <tr key={r.id}>
              <td className="px-3 py-2">{r.title}</td>
              <td className="px-3 py-2">{r.risk_level}</td>
              <td className="px-3 py-2">{r.status}</td>
              <td className="px-3 py-2 text-right">
                {can("risk:write") ? (
                  <>
                    <button type="button" className="text-brand-600 hover:underline" onClick={() => setEdit({ ...r })}>
                      编辑
                    </button>
                    <button type="button" className="ml-2 text-red-600 hover:underline" onClick={() => void del(r.id)}>
                      删
                    </button>
                  </>
                ) : (
                  "—"
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <Modal
        open={open}
        title="新建风险"
        onClose={() => setOpen(false)}
        footer={
          <>
            <button type="button" className="rounded-lg border px-4 py-2 text-sm" onClick={() => setOpen(false)}>
              取消
            </button>
            <button type="button" disabled={saving || !title.trim()} className="rounded-lg bg-brand-600 px-4 py-2 text-sm text-white" onClick={() => void submit()}>
              保存
            </button>
          </>
        }
      >
        <input className="w-full rounded border px-3 py-2 text-sm" placeholder="标题 *" value={title} onChange={(e) => setTitle(e.target.value)} />
        <select className="mt-3 w-full rounded border px-3 py-2 text-sm" value={level} onChange={(e) => setLevel(e.target.value)}>
          <option value="low">low</option>
          <option value="medium">medium</option>
          <option value="high">high</option>
        </select>
      </Modal>

      <Modal
        open={edit !== null}
        title="编辑风险"
        onClose={() => setEdit(null)}
        footer={
          <>
            <button type="button" className="rounded-lg border px-4 py-2 text-sm" onClick={() => setEdit(null)}>
              取消
            </button>
            <button type="button" disabled={saving} className="rounded-lg bg-brand-600 px-4 py-2 text-sm text-white" onClick={() => void saveEdit()}>
              保存
            </button>
          </>
        }
      >
        {edit ? (
          <div className="space-y-3">
            <input className="w-full rounded border px-3 py-2 text-sm" value={edit.title} onChange={(e) => setEdit({ ...edit, title: e.target.value })} />
            <select className="w-full rounded border px-3 py-2 text-sm" value={edit.risk_level} onChange={(e) => setEdit({ ...edit, risk_level: e.target.value })}>
              <option value="low">low</option>
              <option value="medium">medium</option>
              <option value="high">high</option>
            </select>
            <select className="w-full rounded border px-3 py-2 text-sm" value={edit.status} onChange={(e) => setEdit({ ...edit, status: e.target.value })}>
              <option value="open">open</option>
              <option value="mitigated">mitigated</option>
              <option value="closed">closed</option>
            </select>
            <textarea className="w-full rounded border px-3 py-2 text-sm" rows={2} value={edit.remark ?? ""} onChange={(e) => setEdit({ ...edit, remark: e.target.value || null })} />
          </div>
        ) : null}
      </Modal>
    </div>
  );
}

function DesignTasksPanel({
  projectId,
  can,
  rows,
  onRefresh,
}: {
  projectId: UUID;
  can: (c: string) => boolean;
  rows: DesignTask[];
  onRefresh: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [status, setStatus] = useState("pending");
  const [saving, setSaving] = useState(false);
  const [edit, setEdit] = useState<DesignTask | null>(null);

  const submit = async () => {
    setSaving(true);
    try {
      await apiFetch(`/projects/${projectId}/design-tasks`, {
        method: "POST",
        body: { title: title.trim(), status, sort_order: 0 },
      });
      setOpen(false);
      setTitle("");
      onRefresh();
    } finally {
      setSaving(false);
    }
  };

  const saveEdit = async () => {
    if (!edit) return;
    setSaving(true);
    try {
      await apiFetch(`/projects/${projectId}/design-tasks/${edit.id}`, {
        method: "PATCH",
        body: { title: edit.title, status: edit.status, remark: edit.remark },
      });
      setEdit(null);
      onRefresh();
    } finally {
      setSaving(false);
    }
  };

  const del = async (id: UUID) => {
    if (!window.confirm("删除？")) return;
    await apiFetch(`/projects/${projectId}/design-tasks/${id}`, { method: "DELETE" });
    onRefresh();
  };

  return (
    <div className="space-y-4">
      {can("design_task:write") ? (
        <button type="button" onClick={() => setOpen(true)} className="rounded-lg bg-brand-600 px-3 py-1.5 text-sm text-white">
          新建设计任务
        </button>
      ) : null}
      <table className="min-w-full divide-y text-sm">
        <thead className="bg-slate-50 text-xs uppercase text-slate-500">
          <tr>
            <th className="px-3 py-2 text-left">标题</th>
            <th className="px-3 py-2">状态</th>
            <th className="px-3 py-2 text-right">操作</th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {rows.map((r) => (
            <tr key={r.id}>
              <td className="px-3 py-2">{r.title}</td>
              <td className="px-3 py-2">{r.status}</td>
              <td className="px-3 py-2 text-right">
                {can("design_task:write") ? (
                  <>
                    <button type="button" className="text-brand-600 hover:underline" onClick={() => setEdit({ ...r })}>
                      编辑
                    </button>
                    <button type="button" className="ml-2 text-red-600 hover:underline" onClick={() => void del(r.id)}>
                      删
                    </button>
                  </>
                ) : (
                  "—"
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <Modal
        open={open}
        title="新建设计任务"
        onClose={() => setOpen(false)}
        footer={
          <>
            <button type="button" className="rounded-lg border px-4 py-2 text-sm" onClick={() => setOpen(false)}>
              取消
            </button>
            <button type="button" disabled={saving || !title.trim()} className="rounded-lg bg-brand-600 px-4 py-2 text-sm text-white" onClick={() => void submit()}>
              保存
            </button>
          </>
        }
      >
        <input className="w-full rounded border px-3 py-2 text-sm" placeholder="标题 *" value={title} onChange={(e) => setTitle(e.target.value)} />
        <select className="mt-3 w-full rounded border px-3 py-2 text-sm" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="pending">pending</option>
          <option value="in_progress">in_progress</option>
          <option value="done">done</option>
        </select>
      </Modal>

      <Modal
        open={edit !== null}
        title="编辑设计任务"
        onClose={() => setEdit(null)}
        footer={
          <>
            <button type="button" className="rounded-lg border px-4 py-2 text-sm" onClick={() => setEdit(null)}>
              取消
            </button>
            <button type="button" disabled={saving} className="rounded-lg bg-brand-600 px-4 py-2 text-sm text-white" onClick={() => void saveEdit()}>
              保存
            </button>
          </>
        }
      >
        {edit ? (
          <div className="space-y-3">
            <input className="w-full rounded border px-3 py-2 text-sm" value={edit.title} onChange={(e) => setEdit({ ...edit, title: e.target.value })} />
            <select className="w-full rounded border px-3 py-2 text-sm" value={edit.status} onChange={(e) => setEdit({ ...edit, status: e.target.value })}>
              <option value="pending">pending</option>
              <option value="in_progress">in_progress</option>
              <option value="done">done</option>
            </select>
            <textarea className="w-full rounded border px-3 py-2 text-sm" rows={2} value={edit.remark ?? ""} onChange={(e) => setEdit({ ...edit, remark: e.target.value || null })} />
          </div>
        ) : null}
      </Modal>
    </div>
  );
}

function ChangesPanel({
  projectId,
  can,
  rows,
  onRefresh,
}: {
  projectId: UUID;
  can: (c: string) => boolean;
  rows: DesignChangeRequest[];
  onRefresh: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [saving, setSaving] = useState(false);
  const [edit, setEdit] = useState<DesignChangeRequest | null>(null);

  const submit = async () => {
    setSaving(true);
    try {
      await apiFetch(`/projects/${projectId}/design-changes`, {
        method: "POST",
        body: { title: title.trim(), description: desc || null, status: "draft" },
      });
      setOpen(false);
      setTitle("");
      setDesc("");
      onRefresh();
    } finally {
      setSaving(false);
    }
  };

  const saveEdit = async () => {
    if (!edit) return;
    setSaving(true);
    try {
      await apiFetch(`/projects/${projectId}/design-changes/${edit.id}`, {
        method: "PATCH",
        body: { title: edit.title, description: edit.description, status: edit.status },
      });
      setEdit(null);
      onRefresh();
    } finally {
      setSaving(false);
    }
  };

  const del = async (id: UUID) => {
    if (!window.confirm("删除？")) return;
    await apiFetch(`/projects/${projectId}/design-changes/${id}`, { method: "DELETE" });
    onRefresh();
  };

  return (
    <div className="space-y-4">
      {can("design_change:write") ? (
        <button type="button" onClick={() => setOpen(true)} className="rounded-lg bg-brand-600 px-3 py-1.5 text-sm text-white">
          新建变更单
        </button>
      ) : null}
      <table className="min-w-full divide-y text-sm">
        <thead className="bg-slate-50 text-xs uppercase text-slate-500">
          <tr>
            <th className="px-3 py-2 text-left">标题</th>
            <th className="px-3 py-2">状态</th>
            <th className="px-3 py-2 text-right">操作</th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {rows.map((r) => (
            <tr key={r.id}>
              <td className="px-3 py-2">{r.title}</td>
              <td className="px-3 py-2">{r.status}</td>
              <td className="px-3 py-2 text-right">
                {can("design_change:write") ? (
                  <>
                    <button type="button" className="text-brand-600 hover:underline" onClick={() => setEdit({ ...r })}>
                      编辑
                    </button>
                    <button type="button" className="ml-2 text-red-600 hover:underline" onClick={() => void del(r.id)}>
                      删
                    </button>
                  </>
                ) : (
                  "—"
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <Modal open={open} title="新建设计变更" onClose={() => setOpen(false)} wide
        footer={
          <>
            <button type="button" className="rounded-lg border px-4 py-2 text-sm" onClick={() => setOpen(false)}>取消</button>
            <button type="button" disabled={saving || !title.trim()} className="rounded-lg bg-brand-600 px-4 py-2 text-sm text-white" onClick={() => void submit()}>保存</button>
          </>
        }
      >
        <input className="w-full rounded border px-3 py-2 text-sm" placeholder="标题 *" value={title} onChange={(e) => setTitle(e.target.value)} />
        <textarea className="mt-3 w-full rounded border px-3 py-2 text-sm" rows={4} placeholder="说明" value={desc} onChange={(e) => setDesc(e.target.value)} />
      </Modal>

      <Modal open={edit !== null} title="编辑设计变更" onClose={() => setEdit(null)} wide
        footer={
          <>
            <button type="button" className="rounded-lg border px-4 py-2 text-sm" onClick={() => setEdit(null)}>取消</button>
            <button type="button" disabled={saving} className="rounded-lg bg-brand-600 px-4 py-2 text-sm text-white" onClick={() => void saveEdit()}>保存</button>
          </>
        }
      >
        {edit ? (
          <div className="space-y-3">
            <input className="w-full rounded border px-3 py-2 text-sm" value={edit.title} onChange={(e) => setEdit({ ...edit, title: e.target.value })} />
            <textarea className="w-full rounded border px-3 py-2 text-sm" rows={4} value={edit.description ?? ""} onChange={(e) => setEdit({ ...edit, description: e.target.value || null })} />
            <select className="w-full rounded border px-3 py-2 text-sm" value={edit.status} onChange={(e) => setEdit({ ...edit, status: e.target.value })}>
              <option value="draft">draft</option>
              <option value="submitted">submitted</option>
              <option value="approved">approved</option>
              <option value="rejected">rejected</option>
              <option value="implemented">implemented</option>
              <option value="closed">closed</option>
            </select>
          </div>
        ) : null}
      </Modal>
    </div>
  );
}

function StubsPanel({
  projectId,
  can,
  rows,
  onRefresh,
}: {
  projectId: UUID;
  can: (c: string) => boolean;
  rows: SelectionStub[];
  onRefresh: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [jsonStr, setJsonStr] = useState("{}");
  const [saving, setSaving] = useState(false);
  const [edit, setEdit] = useState<SelectionStub | null>(null);

  const submit = async () => {
    let payload: Record<string, unknown> = {};
    try {
      payload = JSON.parse(jsonStr || "{}") as Record<string, unknown>;
    } catch {
      alert("JSON 格式错误");
      return;
    }
    setSaving(true);
    try {
      await apiFetch(`/projects/${projectId}/selection-stubs`, {
        method: "POST",
        body: { title: title.trim(), payload },
      });
      setOpen(false);
      setTitle("");
      setJsonStr("{}");
      onRefresh();
    } finally {
      setSaving(false);
    }
  };

  const saveEdit = async () => {
    if (!edit) return;
    let payload: Record<string, unknown> | undefined;
    try {
      payload = JSON.parse(jsonStr || "{}") as Record<string, unknown>;
    } catch {
      alert("JSON 格式错误");
      return;
    }
    setSaving(true);
    try {
      await apiFetch(`/projects/${projectId}/selection-stubs/${edit.id}`, {
        method: "PATCH",
        body: { title: edit.title, payload, remark: edit.remark },
      });
      setEdit(null);
      onRefresh();
    } finally {
      setSaving(false);
    }
  };

  const del = async (id: UUID) => {
    if (!window.confirm("删除？")) return;
    await apiFetch(`/projects/${projectId}/selection-stubs/${id}`, { method: "DELETE" });
    onRefresh();
  };

  return (
    <div className="space-y-4">
      {can("selection:write") ? (
        <button
          type="button"
          onClick={() => {
            setTitle("");
            setJsonStr("{}");
            setOpen(true);
          }}
          className="rounded-lg bg-brand-600 px-3 py-1.5 text-sm text-white"
        >
          新建选型存根
        </button>
      ) : null}
      <table className="min-w-full divide-y text-sm">
        <thead className="bg-slate-50 text-xs uppercase text-slate-500">
          <tr>
            <th className="px-3 py-2 text-left">标题</th>
            <th className="px-3 py-2">payload 摘要</th>
            <th className="px-3 py-2 text-right">操作</th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {rows.map((r) => (
            <tr key={r.id}>
              <td className="px-3 py-2">{r.title}</td>
              <td className="max-w-xs truncate px-3 py-2 font-mono text-xs">{JSON.stringify(r.payload)}</td>
              <td className="px-3 py-2 text-right">
                {can("selection:write") ? (
                  <>
                    <button
                      type="button"
                      className="text-brand-600 hover:underline"
                      onClick={() => {
                        setEdit({ ...r });
                        setJsonStr(JSON.stringify(r.payload, null, 2));
                      }}
                    >
                      编辑
                    </button>
                    <button type="button" className="ml-2 text-red-600 hover:underline" onClick={() => void del(r.id)}>
                      删
                    </button>
                  </>
                ) : (
                  "—"
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <Modal open={open} title="新建选型存根" onClose={() => setOpen(false)} wide
        footer={
          <>
            <button type="button" className="rounded-lg border px-4 py-2 text-sm" onClick={() => setOpen(false)}>取消</button>
            <button type="button" disabled={saving || !title.trim()} className="rounded-lg bg-brand-600 px-4 py-2 text-sm text-white" onClick={() => void submit()}>保存</button>
          </>
        }
      >
        <input className="w-full rounded border px-3 py-2 text-sm" placeholder="标题 *" value={title} onChange={(e) => setTitle(e.target.value)} />
        <label className="mt-3 block text-xs text-slate-600">payload（JSON）</label>
        <textarea className="mt-1 w-full rounded border px-3 py-2 font-mono text-xs" rows={8} value={jsonStr} onChange={(e) => setJsonStr(e.target.value)} />
      </Modal>

      <Modal open={edit !== null} title="编辑选型存根" onClose={() => setEdit(null)} wide
        footer={
          <>
            <button type="button" className="rounded-lg border px-4 py-2 text-sm" onClick={() => setEdit(null)}>取消</button>
            <button type="button" disabled={saving} className="rounded-lg bg-brand-600 px-4 py-2 text-sm text-white" onClick={() => void saveEdit()}>保存</button>
          </>
        }
      >
        {edit ? (
          <div className="space-y-3">
            <input className="w-full rounded border px-3 py-2 text-sm" value={edit.title} onChange={(e) => setEdit({ ...edit, title: e.target.value })} />
            <textarea className="w-full rounded border px-3 py-2 font-mono text-xs" rows={8} value={jsonStr} onChange={(e) => setJsonStr(e.target.value)} />
            <textarea className="w-full rounded border px-3 py-2 text-sm" rows={2} placeholder="备注" value={edit.remark ?? ""} onChange={(e) => setEdit({ ...edit, remark: e.target.value || null })} />
          </div>
        ) : null}
      </Modal>
    </div>
  );
}
