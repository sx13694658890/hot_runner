/**
 * P3 研发域 /api/v1/rd 类型（与 FastAPI schema 对齐）
 */
import type { UUID } from "@/lib/types";

export interface RdResearchProjectRead {
  id: UUID;
  name: string;
  code: string | null;
  parent_project_id: UUID | null;
  status: string;
  description: string | null;
  owner_user_id: UUID | null;
  created_at: string;
  updated_at: string;
}

export interface RdResearchTaskRead {
  id: UUID;
  research_project_id: UUID;
  title: string;
  status: string;
  assignee_user_id: UUID | null;
  due_date: string | null;
  sort_order: number;
  remark: string | null;
  created_at: string;
  updated_at: string;
}

export interface RdReleaseIterationRead {
  id: UUID;
  research_project_id: UUID;
  version_label: string;
  release_notes: string | null;
  status: string;
  submitted_by_user_id: UUID | null;
  submitted_at: string | null;
  reviewed_by_user_id: UUID | null;
  reviewed_at: string | null;
  review_comment: string | null;
  created_at: string;
  updated_at: string;
}

export interface RdDeliverableRead {
  id: UUID;
  research_project_id: UUID;
  title: string;
  category: string;
  tags: string[];
  file_asset_id: UUID | null;
  remark: string | null;
  created_by_user_id: UUID | null;
  created_at: string;
}

export interface RdLibraryIntakeRead {
  id: UUID;
  research_project_id: UUID | null;
  title: string;
  proposed_code: string;
  proposed_name: string;
  category: string | null;
  description: string | null;
  file_asset_id: UUID | null;
  status: string;
  result_standard_part_id: UUID | null;
  created_by_user_id: UUID | null;
  submitted_by_user_id: UUID | null;
  submitted_at: string | null;
  reviewed_by_user_id: UUID | null;
  reviewed_at: string | null;
  review_comment: string | null;
  created_at: string;
  updated_at: string;
}
