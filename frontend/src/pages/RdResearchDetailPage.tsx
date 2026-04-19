import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";

import { Modal } from "@/components/Modal";
import { ApiError, apiFetch, formatApiDetail } from "@/lib/api";
import type {
  RdDeliverableRead,
  RdReleaseIterationRead,
  RdResearchProjectRead,
  RdResearchTaskRead,
} from "@/lib/rdTypes";
import { useAuth } from "@/contexts/AuthContext";

type Tab = "tasks" | "releases" | "deliverables";

function fmtTime(iso: string | null | undefined): string {
  if (!iso) return "—";
  return iso.slice(0, 19).replace("T", " ");
}

export function RdResearchDetailPage() {
  const { rdId } = useParams<{ rdId: string }>();
  const { can } = useAuth();
  const canRead = can("rd:read");
  const canWrite = can("rd:write");

  const [project, setProject] = useState<RdResearchProjectRead | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>("tasks");

  const [tasks, setTasks] = useState<RdResearchTaskRead[]>([]);
  const [releases, setReleases] = useState<RdReleaseIterationRead[]>([]);
  const [deliverables, setDeliverables] = useState<RdDeliverableRead[]>([]);
  const [subLoading, setSubLoading] = useState(false);

  const [taskModal, setTaskModal] = useState(false);
  const [taskEditingId, setTaskEditingId] = useState<string | null>(null);
  const [relModal, setRelModal] = useState(false);
  const [delModal, setDelModal] = useState(false);
  const [delEditingId, setDelEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [tTitle, setTTitle] = useState("");
  const [tStatus, setTStatus] = useState("todo");
  const [tAssignee, setTAssignee] = useState("");

  const [vLabel, setVLabel] = useState("");
  const [vNotes, setVNotes] = useState("");

  const [dTitle, setDTitle] = useState("");
  const [dCategory, setDCategory] = useState("other");
  const [dTags, setDTags] = useState("");
  const [dFileId, setDFileId] = useState("");
  const [dRemark, setDRemark] = useState("");

  const base = rdId ? `/rd/projects/${rdId}` : "";

  const loadProject = useCallback(async () => {
    if (!rdId || !canRead) {
      setLoading(false);
      return;
    }
    setErr(null);
    setLoading(true);
    try {
      setProject(await apiFetch<RdResearchProjectRead>(`/rd/projects/${rdId}`));
    } catch (e) {
      setErr(e instanceof ApiError ? formatApiDetail(e.detail) : "加载失败");
      setProject(null);
    } finally {
      setLoading(false);
    }
  }, [rdId, canRead]);

  const loadTab = useCallback(async () => {
    if (!base || !canRead) return;
    setSubLoading(true);
    setErr(null);
    try {
      if (tab === "tasks") {
        setTasks(await apiFetch<RdResearchTaskRead[]>(`${base}/tasks`));
      } else if (tab === "releases") {
        setReleases(await apiFetch<RdReleaseIterationRead[]>(`${base}/release-iterations`));
      } else {
        setDeliverables(await apiFetch<RdDeliverableRead[]>(`${base}/deliverables`));
      }
    } catch (e) {
      setErr(e instanceof ApiError ? formatApiDetail(e.detail) : "加载子资源失败");
    } finally {
      setSubLoading(false);
    }
  }, [base, tab, canRead]);

  useEffect(() => {
    void loadProject();
  }, [loadProject]);

  useEffect(() => {
    if (!rdId || !project) return;
    void loadTab();
  }, [rdId, project, tab, loadTab]);

  const submitTask = async () => {
    if (!base || !tTitle.trim()) return;
    setSaving(true);
    try {
      const body = {
        title: tTitle.trim(),
        status: tStatus,
        assignee_user_id: tAssignee.trim() || null,
        remark: null as string | null,
        sort_order: 0,
      };
      if (taskEditingId) {
        await apiFetch(`${base}/tasks/${taskEditingId}`, { method: "PATCH", body });
      } else {
        await apiFetch(`${base}/tasks`, { method: "POST", body });
      }
      setTaskModal(false);
      setTaskEditingId(null);
      setTTitle("");
      setTAssignee("");
      setTStatus("todo");
      await loadTab();
    } catch (e) {
      setErr(e instanceof ApiError ? formatApiDetail(e.detail) : taskEditingId ? "更新任务失败" : "创建任务失败");
    } finally {
      setSaving(false);
    }
  };

  const submitRelease = async () => {
    if (!base || !vLabel.trim()) return;
    setSaving(true);
    try {
      await apiFetch(`${base}/release-iterations`, {
        method: "POST",
        body: { version_label: vLabel.trim(), release_notes: vNotes.trim() || null },
      });
      setRelModal(false);
      setVLabel("");
      setVNotes("");
      await loadTab();
    } catch (e) {
      setErr(e instanceof ApiError ? formatApiDetail(e.detail) : "创建版本失败");
    } finally {
      setSaving(false);
    }
  };

  const submitDeliverable = async () => {
    if (!base || !dTitle.trim()) return;
    setSaving(true);
    try {
      const tags = dTags
        .split(/[,，]/)
        .map((s) => s.trim())
        .filter(Boolean);
      const payload = {
        title: dTitle.trim(),
        category: dCategory,
        tags,
        file_asset_id: dFileId.trim() || null,
        remark: dRemark.trim() || null,
      };
      if (delEditingId) {
        await apiFetch(`${base}/deliverables/${delEditingId}`, { method: "PATCH", body: payload });
      } else {
        await apiFetch(`${base}/deliverables`, { method: "POST", body: payload });
      }
      setDelModal(false);
      setDelEditingId(null);
      setDTitle("");
      setDTags("");
      setDFileId("");
      setDRemark("");
      setDCategory("other");
      await loadTab();
    } catch (e) {
      setErr(e instanceof ApiError ? formatApiDetail(e.detail) : delEditingId ? "更新成果失败" : "创建成果失败");
    } finally {
      setSaving(false);
    }
  };

  const deleteDeliverable = async (deliverableId: string) => {
    if (!base || !window.confirm("删除该成果登记？")) return;
    try {
      await apiFetch(`${base}/deliverables/${deliverableId}`, { method: "DELETE" });
      await loadTab();
    } catch (e) {
      setErr(e instanceof ApiError ? formatApiDetail(e.detail) : "删除失败");
    }
  };

  const submitReleaseFlow = async (iterationId: string, action: "submit" | "approve" | "reject") => {
    if (!base) return;
    setSaving(true);
    try {
      if (action === "submit") {
        await apiFetch(`${base}/release-iterations/${iterationId}/submit`, { method: "POST", body: {} });
      } else {
        await apiFetch(
          `${base}/release-iterations/${iterationId}/review?decision=${action === "approve" ? "approve" : "reject"}`,
          { method: "POST", body: { comment: null } },
        );
      }
      await loadTab();
    } catch (e) {
      setErr(e instanceof ApiError ? formatApiDetail(e.detail) : "操作失败");
    } finally {
      setSaving(false);
    }
  };

  const deleteTask = async (taskId: string) => {
    if (!base || !window.confirm("删除该任务？")) return;
    try {
      await apiFetch(`${base}/tasks/${taskId}`, { method: "DELETE" });
      await loadTab();
    } catch (e) {
      setErr(e instanceof ApiError ? formatApiDetail(e.detail) : "删除失败");
    }
  };

  if (!canRead) {
    return (
      <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
        需要 <span className="font-mono">rd:read</span>
      </div>
    );
  }

  if (!rdId) {
    return <p className="text-sm text-red-600">无效路由</p>;
  }

  return (
    <div className="space-y-6">
      <div>
        <Link to="/rd/research" className="text-sm font-medium text-brand-600 hover:underline">
          ← 研发项目列表
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-slate-800">
          {loading ? "加载中…" : project?.name ?? "研发项目"}
        </h1>
        {project ? (
          <div className="mt-2 space-y-1 text-sm text-slate-600">
            <p className="font-mono text-xs text-slate-400">{project.id}</p>
            <p>
              状态：<span className="font-medium">{project.status}</span>
              {project.code ? (
                <>
                  {" "}
                  · 编码 <span className="font-mono">{project.code}</span>
                </>
              ) : null}
            </p>
            {project.description ? <p className="text-slate-700">{project.description}</p> : null}
            {project.parent_project_id ? (
              <p>
                关联 PMO：
                <Link className="ml-1 text-brand-600 hover:underline" to={`/projects/${project.parent_project_id}`}>
                  打开项目工作台
                </Link>
              </p>
            ) : null}
          </div>
        ) : null}
      </div>

      {err ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{err}</div>
      ) : null}

      {!loading && project ? (
        <>
          <div className="flex flex-wrap gap-1 border-b border-slate-200">
            {(
              [
                ["tasks", "研发任务"],
                ["releases", "版本迭代"],
                ["deliverables", "成果附件"],
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
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs font-semibold uppercase text-slate-500">
                {tab === "tasks" ? "任务" : tab === "releases" ? "版本迭代 / 发布说明" : "仿真与成果附件"}
              </span>
              {canWrite ? (
                <button
                  type="button"
                  onClick={() => {
                    if (tab === "tasks") {
                      setTaskEditingId(null);
                      setTTitle("");
                      setTAssignee("");
                      setTStatus("todo");
                      setTaskModal(true);
                    } else if (tab === "releases") setRelModal(true);
                    else {
                      setDelEditingId(null);
                      setDTitle("");
                      setDTags("");
                      setDFileId("");
                      setDRemark("");
                      setDCategory("other");
                      setDelModal(true);
                    }
                  }}
                  className="rounded border border-slate-200 px-3 py-1 text-sm hover:bg-slate-50"
                >
                  {tab === "tasks" ? "新建任务" : tab === "releases" ? "新建版本记录" : "登记成果"}
                </button>
              ) : null}
            </div>

            {subLoading ? (
              <p className="py-6 text-center text-sm text-slate-500">加载中…</p>
            ) : tab === "tasks" ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200 text-sm">
                  <thead className="bg-slate-50 text-left text-xs font-semibold text-slate-500">
                    <tr>
                      <th className="px-3 py-2">标题</th>
                      <th className="px-3 py-2">状态</th>
                      <th className="px-3 py-2">负责人 UUID</th>
                      <th className="px-3 py-2 text-right">操作</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {tasks.map((t) => (
                      <tr key={t.id}>
                        <td className="px-3 py-2">{t.title}</td>
                        <td className="px-3 py-2">{t.status}</td>
                        <td className="px-3 py-2 font-mono text-xs">{t.assignee_user_id ?? "—"}</td>
                        <td className="space-x-2 px-3 py-2 text-right">
                          {canWrite ? (
                            <>
                              <button
                                type="button"
                                className="text-brand-600 hover:underline"
                                onClick={() => {
                                  setTaskEditingId(t.id);
                                  setTTitle(t.title);
                                  setTStatus(t.status);
                                  setTAssignee(t.assignee_user_id ?? "");
                                  setTaskModal(true);
                                }}
                              >
                                编辑
                              </button>
                              <button
                                type="button"
                                className="text-red-600 hover:underline"
                                onClick={() => void deleteTask(t.id)}
                              >
                                删除
                              </button>
                            </>
                          ) : null}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {tasks.length === 0 ? <p className="py-4 text-center text-sm text-slate-500">暂无任务</p> : null}
              </div>
            ) : tab === "releases" ? (
              <div className="overflow-x-auto">
                <table className="min-w-[960px] w-full divide-y divide-slate-200 text-sm">
                  <thead className="bg-slate-50 text-left text-xs font-semibold text-slate-500">
                    <tr>
                      <th className="px-3 py-2">版本号</th>
                      <th className="px-3 py-2">状态</th>
                      <th className="px-3 py-2">说明摘要</th>
                      <th className="px-3 py-2 text-right">操作</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {releases.map((r) => (
                      <tr key={r.id}>
                        <td className="px-3 py-2 font-mono text-xs">{r.version_label}</td>
                        <td className="px-3 py-2">{r.status}</td>
                        <td className="max-w-md truncate px-3 py-2 text-slate-600">{r.release_notes ?? "—"}</td>
                        <td className="space-x-2 px-3 py-2 text-right">
                          {canWrite && (r.status === "draft" || r.status === "rejected") ? (
                            <button
                              type="button"
                              disabled={saving}
                              className="text-brand-600 hover:underline disabled:opacity-50"
                              onClick={() => void submitReleaseFlow(r.id, "submit")}
                            >
                              提交审批
                            </button>
                          ) : null}
                          {canWrite && r.status === "submitted" ? (
                            <>
                              <button
                                type="button"
                                disabled={saving}
                                className="text-emerald-700 hover:underline disabled:opacity-50"
                                onClick={() => void submitReleaseFlow(r.id, "approve")}
                              >
                                通过
                              </button>
                              <button
                                type="button"
                                disabled={saving}
                                className="text-red-600 hover:underline disabled:opacity-50"
                                onClick={() => void submitReleaseFlow(r.id, "reject")}
                              >
                                驳回
                              </button>
                            </>
                          ) : null}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {releases.length === 0 ? (
                  <p className="py-4 text-center text-sm text-slate-500">暂无版本记录</p>
                ) : null}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200 text-sm">
                  <thead className="bg-slate-50 text-left text-xs font-semibold text-slate-500">
                    <tr>
                      <th className="px-3 py-2">标题</th>
                      <th className="px-3 py-2">分类</th>
                      <th className="px-3 py-2">标签</th>
                      <th className="px-3 py-2">文件 asset</th>
                      <th className="px-3 py-2">创建</th>
                      <th className="px-3 py-2 text-right">操作</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {deliverables.map((d) => (
                      <tr key={d.id}>
                        <td className="px-3 py-2">{d.title}</td>
                        <td className="px-3 py-2">{d.category}</td>
                        <td className="px-3 py-2 font-mono text-xs">
                          {Array.isArray(d.tags) ? d.tags.join(", ") : "—"}
                        </td>
                        <td className="px-3 py-2 font-mono text-xs">{d.file_asset_id ?? "—"}</td>
                        <td className="whitespace-nowrap px-3 py-2 text-xs text-slate-500">{fmtTime(d.created_at)}</td>
                        <td className="space-x-2 px-3 py-2 text-right">
                          {canWrite ? (
                            <>
                              <button
                                type="button"
                                className="text-brand-600 hover:underline"
                                onClick={() => {
                                  setDelEditingId(d.id);
                                  setDTitle(d.title);
                                  setDCategory(d.category);
                                  setDTags(Array.isArray(d.tags) ? d.tags.join(", ") : "");
                                  setDFileId(d.file_asset_id ?? "");
                                  setDRemark(d.remark ?? "");
                                  setDelModal(true);
                                }}
                              >
                                编辑
                              </button>
                              <button
                                type="button"
                                className="text-red-600 hover:underline"
                                onClick={() => void deleteDeliverable(d.id)}
                              >
                                删除
                              </button>
                            </>
                          ) : null}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {deliverables.length === 0 ? (
                  <p className="py-4 text-center text-sm text-slate-500">暂无成果附件登记</p>
                ) : null}
              </div>
            )}
          </div>
        </>
      ) : null}

      <Modal
        open={taskModal}
        title={taskEditingId ? "编辑研发任务" : "新建研发任务"}
        onClose={() => {
          setTaskModal(false);
          setTaskEditingId(null);
        }}
        footer={
          <div className="flex justify-end gap-2">
            <button
              type="button"
              className="rounded-lg border px-4 py-2 text-sm"
              onClick={() => {
                setTaskModal(false);
                setTaskEditingId(null);
              }}
            >
              取消
            </button>
            <button
              type="button"
              disabled={saving}
              className="rounded-lg bg-brand-600 px-4 py-2 text-sm text-white disabled:opacity-50"
              onClick={() => void submitTask()}
            >
              保存
            </button>
          </div>
        }
      >
        <div className="space-y-3 px-5 py-4 text-sm">
          <label className="block">
            <span className="text-slate-500">标题</span>
            <input className="mt-1 w-full rounded border px-2 py-1.5" value={tTitle} onChange={(e) => setTTitle(e.target.value)} />
          </label>
          <label className="block">
            <span className="text-slate-500">状态</span>
            <select className="mt-1 w-full rounded border px-2 py-1.5" value={tStatus} onChange={(e) => setTStatus(e.target.value)}>
              <option value="todo">todo</option>
              <option value="doing">doing</option>
              <option value="done">done</option>
              <option value="cancelled">cancelled</option>
            </select>
          </label>
          <label className="block">
            <span className="text-slate-500">负责人用户 ID（可选）</span>
            <input
              className="mt-1 w-full rounded border px-2 py-1.5 font-mono text-xs"
              value={tAssignee}
              onChange={(e) => setTAssignee(e.target.value)}
            />
          </label>
        </div>
      </Modal>

      <Modal
        open={relModal}
        title="新建版本迭代记录"
        onClose={() => setRelModal(false)}
        footer={
          <div className="flex justify-end gap-2">
            <button type="button" className="rounded-lg border px-4 py-2 text-sm" onClick={() => setRelModal(false)}>
              取消
            </button>
            <button
              type="button"
              disabled={saving}
              className="rounded-lg bg-brand-600 px-4 py-2 text-sm text-white disabled:opacity-50"
              onClick={() => void submitRelease()}
            >
              保存
            </button>
          </div>
        }
      >
        <div className="space-y-3 px-5 py-4 text-sm">
          <label className="block">
            <span className="text-slate-500">版本号 *</span>
            <input className="mt-1 w-full rounded border px-2 py-1.5 font-mono" value={vLabel} onChange={(e) => setVLabel(e.target.value)} />
          </label>
          <label className="block">
            <span className="text-slate-500">发布说明</span>
            <textarea className="mt-1 w-full rounded border px-2 py-1.5" rows={4} value={vNotes} onChange={(e) => setVNotes(e.target.value)} />
          </label>
        </div>
      </Modal>

      <Modal
        open={delModal}
        title={delEditingId ? "编辑成果附件" : "登记成果附件"}
        onClose={() => {
          setDelModal(false);
          setDelEditingId(null);
        }}
        wide
        footer={
          <div className="flex justify-end gap-2">
            <button
              type="button"
              className="rounded-lg border px-4 py-2 text-sm"
              onClick={() => {
                setDelModal(false);
                setDelEditingId(null);
              }}
            >
              取消
            </button>
            <button
              type="button"
              disabled={saving}
              className="rounded-lg bg-brand-600 px-4 py-2 text-sm text-white disabled:opacity-50"
              onClick={() => void submitDeliverable()}
            >
              保存
            </button>
          </div>
        }
      >
        <div className="space-y-3 px-5 py-4 text-sm">
          <label className="block">
            <span className="text-slate-500">标题 *</span>
            <input className="mt-1 w-full rounded border px-2 py-1.5" value={dTitle} onChange={(e) => setDTitle(e.target.value)} />
          </label>
          <label className="block">
            <span className="text-slate-500">分类</span>
            <select className="mt-1 w-full rounded border px-2 py-1.5" value={dCategory} onChange={(e) => setDCategory(e.target.value)}>
              <option value="simulation">simulation</option>
              <option value="drawing">drawing</option>
              <option value="report">report</option>
              <option value="other">other</option>
            </select>
          </label>
          <label className="block">
            <span className="text-slate-500">标签（逗号分隔）</span>
            <input className="mt-1 w-full rounded border px-2 py-1.5" value={dTags} onChange={(e) => setDTags(e.target.value)} />
          </label>
          <label className="block">
            <span className="text-slate-500">文件 asset ID（先在「文件」上传后粘贴）</span>
            <input
              className="mt-1 w-full rounded border px-2 py-1.5 font-mono text-xs"
              value={dFileId}
              onChange={(e) => setDFileId(e.target.value)}
            />
          </label>
          <label className="block">
            <span className="text-slate-500">备注</span>
            <textarea className="mt-1 w-full rounded border px-2 py-1.5" rows={2} value={dRemark} onChange={(e) => setDRemark(e.target.value)} />
          </label>
        </div>
      </Modal>
    </div>
  );
}
