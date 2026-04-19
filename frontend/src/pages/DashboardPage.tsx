import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { useAuth } from "@/contexts/AuthContext";
import { ApiError, apiFetch, fetchHealth, formatApiDetail } from "@/lib/api";
import type { DashboardSummaryRead } from "@/lib/p5Types";
import type { HealthResponse } from "@/lib/types";

function KpiCard({
  title,
  value,
  hint,
  to,
}: {
  title: string;
  value: number;
  hint?: string;
  to?: string;
}) {
  const inner = (
    <>
      <h3 className="text-xs font-semibold uppercase text-slate-500">{title}</h3>
      <p className="mt-2 text-3xl font-bold tabular-nums text-slate-800">{value}</p>
      {hint ? <p className="mt-1 text-xs text-slate-500">{hint}</p> : null}
    </>
  );
  const className =
    "rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition-colors" +
    (to ? " hover:border-brand-200 hover:bg-brand-50/30" : "");
  return to ? (
    <Link to={to} className={className}>
      {inner}
    </Link>
  ) : (
    <div className={className}>{inner}</div>
  );
}

export function DashboardPage() {
  const { user, permissions, can } = useAuth();
  const canDash = can("dashboard:read");
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [healthErr, setHealthErr] = useState<string | null>(null);
  const [summary, setSummary] = useState<DashboardSummaryRead | null>(null);
  const [sumErr, setSumErr] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const h = await fetchHealth();
        if (!cancelled) setHealth(h);
      } catch (e) {
        if (!cancelled) {
          setHealthErr(
            e instanceof ApiError ? formatApiDetail(e.detail) : "无法连接后端，请检查 VITE_API_BASE_URL 与 CORS",
          );
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!canDash) return;
    let cancelled = false;
    (async () => {
      try {
        const s = await apiFetch<DashboardSummaryRead>("/dashboard/summary");
        if (!cancelled) {
          setSummary(s);
          setSumErr(null);
        }
      } catch (e) {
        if (!cancelled) {
          setSumErr(e instanceof ApiError ? formatApiDetail(e.detail) : "无法加载 KPI");
          setSummary(null);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [canDash]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">工作台</h1>
        <p className="mt-1 text-slate-600">欢迎，{user?.full_name}</p>
      </div>

      {canDash ? (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-slate-700">运营与模块 KPI（近 7 日集成成功/失败含桩作业）</h2>
          {sumErr ? (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{sumErr}</div>
          ) : null}
          {summary ? (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <KpiCard title="项目总数" value={summary.projects_total} hint="含全部状态" to="/projects" />
              <KpiCard title="进行中项目" value={summary.projects_active} hint="status=active" to="/projects" />
              <KpiCard title="标准件条数" value={summary.standard_parts_total} to="/standard-parts" />
              <KpiCard title="未完成设计任务" value={summary.design_tasks_open} hint="排除 done/cancelled" to="/projects" />
              <KpiCard title="售后工单（未关闭）" value={summary.field_support_open} to="/field" />
              <KpiCard title="试模工单（进行中）" value={summary.trial_runs_active} hint="scheduled/in_progress/reported" to="/field" />
              <KpiCard title="成果入库（待审批）" value={summary.rd_intakes_pending} to="/rd/library-intakes" />
              <KpiCard
                title="近 7 日集成作业成功"
                value={summary.integration_jobs_recent_success}
                hint="桩作业计入"
                to="/integration"
              />
              <KpiCard title="近 7 日集成作业失败" value={summary.integration_jobs_recent_failed} to="/integration" />
            </div>
          ) : !sumErr ? (
            <p className="text-sm text-slate-500">KPI 加载中…</p>
          ) : null}
        </div>
      ) : (
        <p className="rounded-lg border border-amber-100 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          当前账号无 <span className="font-mono">dashboard:read</span>，不展示 KPI 卡片；核心菜单仍按其它权限显示。
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-slate-500">当前用户</h2>
          <dl className="mt-3 space-y-2 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-slate-500">邮箱</dt>
              <dd className="truncate font-medium text-slate-800">{user?.email}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-slate-500">超级管理员</dt>
              <dd className="font-medium text-slate-800">{user?.is_superuser ? "是" : "否"}</dd>
            </div>
          </dl>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-slate-500">后端健康</h2>
          {healthErr ? (
            <p className="mt-3 text-sm text-red-600">{healthErr}</p>
          ) : health ? (
            <dl className="mt-3 space-y-2 text-sm">
              <div className="flex justify-between gap-4">
                <dt className="text-slate-500">状态</dt>
                <dd className="font-medium text-emerald-600">{health.status}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-slate-500">环境</dt>
                <dd className="font-medium text-slate-800">{health.env}</dd>
              </div>
            </dl>
          ) : (
            <p className="mt-3 text-sm text-slate-500">检测中…</p>
          )}
        </div>
      </div>
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-sm font-semibold text-slate-500">权限码</h2>
        <p className="mt-2 text-xs text-slate-500">共 {permissions.length} 项（含 * 表示全部）</p>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {permissions.map((c) => (
            <span
              key={c}
              className="rounded-md bg-slate-100 px-2 py-0.5 font-mono text-xs text-slate-700"
            >
              {c}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
