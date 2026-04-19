/** P5 驾驶舱 / 集成作业 — 对齐 `/api/v1/dashboard`、`/api/v1/integration` */

import type { UUID } from "@/lib/types";

export interface DashboardSummaryRead {
  projects_total: number;
  projects_active: number;
  standard_parts_total: number;
  design_tasks_open: number;
  field_support_open: number;
  trial_runs_active: number;
  rd_intakes_pending: number;
  integration_jobs_recent_success: number;
  integration_jobs_recent_failed: number;
}

export interface IntegrationSyncJobRead {
  id: UUID;
  job_type: string;
  direction: string | null;
  status: string;
  detail: Record<string, unknown> | null;
  message: string | null;
  started_at: string | null;
  finished_at: string | null;
  triggered_by_user_id: UUID | null;
  created_at: string;
}
