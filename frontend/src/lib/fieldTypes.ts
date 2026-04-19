/**
 * P4 工艺与现场 /api/v1/field
 */
import type { UUID } from "@/lib/types";

export interface ProcessPlanRead {
  id: UUID;
  title: string;
  summary: string | null;
  status: string;
  project_id: UUID | null;
  standard_part_id: UUID | null;
  primary_file_asset_id: UUID | null;
  created_by_user_id: UUID | null;
  created_at: string;
  updated_at: string;
}

export interface ProcessAnnotationRead {
  id: UUID;
  body: string;
  project_id: UUID | null;
  standard_part_id: UUID | null;
  file_asset_id: UUID | null;
  created_by_user_id: UUID | null;
  created_at: string;
}

export interface TrialRunRead {
  id: UUID;
  title: string;
  description: string | null;
  status: string;
  project_id: UUID | null;
  standard_part_id: UUID | null;
  drawing_version_id: UUID | null;
  assignee_user_id: UUID | null;
  report_file_asset_id: UUID | null;
  planned_at: string | null;
  closed_at: string | null;
  created_by_user_id: UUID | null;
  created_at: string;
  updated_at: string;
}

export interface SupportTicketRead {
  id: UUID;
  title: string;
  description: string | null;
  status: string;
  project_id: UUID | null;
  drawing_version_id: UUID | null;
  selection_stub_id: UUID | null;
  assignee_user_id: UUID | null;
  resolution_note: string | null;
  created_by_user_id: UUID | null;
  created_at: string;
  updated_at: string;
}

export interface KnowledgeDocRead {
  id: UUID;
  title: string;
  category: string | null;
  symptom: string | null;
  cause: string | null;
  remedy: string | null;
  status: string;
  file_asset_id: UUID | null;
  related_standard_part_id: UUID | null;
  created_by_user_id: UUID | null;
  created_at: string;
  updated_at: string;
}
