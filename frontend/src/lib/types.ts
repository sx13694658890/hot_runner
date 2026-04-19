export type UUID = string;

export interface TokenResponse {
  access_token: string;
  token_type: string;
}

export interface UserBrief {
  id: UUID;
  username: string;
  email: string;
  full_name: string;
  is_active: boolean;
  is_superuser: boolean;
  department_id: UUID | null;
  position_id: UUID | null;
}

export interface PermissionsResponse {
  codes: string[];
}

export interface Department {
  id: UUID;
  name: string;
  code: string | null;
  parent_id: UUID | null;
  sort_order: number;
  remark: string | null;
}

export interface Position {
  id: UUID;
  name: string;
  code: string | null;
  department_id: UUID | null;
  remark: string | null;
}

export interface UserRead {
  id: UUID;
  username: string;
  email: string;
  full_name: string;
  is_active: boolean;
  is_superuser: boolean;
  department_id: UUID | null;
  position_id: UUID | null;
}

export interface Role {
  id: UUID;
  name: string;
  code: string;
  description: string | null;
}

export interface Permission {
  id: UUID;
  code: string;
  name: string;
  module: string;
}

export interface Project {
  id: UUID;
  name: string;
  code: string;
  status: string;
  remark: string | null;
}

/** P1：WBS */
export interface ProjectTask {
  id: UUID;
  project_id: UUID;
  parent_id: UUID | null;
  title: string;
  sort_order: number;
  assignee_user_id: UUID | null;
  due_date: string | null;
  status: string;
  remark: string | null;
  created_at: string;
}

/** P1：里程碑 */
export interface ProjectMilestone {
  id: UUID;
  project_id: UUID;
  name: string;
  target_date: string | null;
  status: string;
  sort_order: number;
  created_at: string;
}

/** P1：风险 */
export interface ProjectRisk {
  id: UUID;
  project_id: UUID;
  title: string;
  risk_level: string;
  status: string;
  owner_user_id: UUID | null;
  remark: string | null;
  created_at: string;
}

/** P1：设计任务 */
export interface DesignTask {
  id: UUID;
  project_id: UUID;
  title: string;
  status: string;
  assignee_user_id: UUID | null;
  sort_order: number;
  remark: string | null;
  created_at: string;
}

/** P1：设计变更 */
export interface DesignChangeRequest {
  id: UUID;
  project_id: UUID;
  title: string;
  description: string | null;
  status: string;
  created_by_user_id: UUID | null;
  created_at: string;
}

/** P1：选型存根 */
export interface SelectionStub {
  id: UUID;
  project_id: UUID;
  title: string;
  payload: Record<string, unknown>;
  remark: string | null;
  created_at: string;
}

/** P2：标准件 */
export interface StandardPart {
  id: UUID;
  code: string;
  name: string;
  category: string | null;
  status: string;
  remark: string | null;
  created_at: string;
}

/** P2：图纸版本 */
export interface DrawingVersion {
  id: UUID;
  standard_part_id: UUID;
  version_label: string;
  status: string;
  file_asset_id: UUID | null;
  remark: string | null;
  created_at: string;
}

export interface FileAsset {
  id: UUID;
  original_name: string;
  content_type: string | null;
  size_bytes: number;
  storage_path: string;
  created_by_user_id: UUID | null;
  created_at: string;
}

export interface AuditLog {
  id: UUID;
  user_id: UUID | null;
  action: string;
  resource_type: string | null;
  resource_id: string | null;
  ip: string | null;
  user_agent: string | null;
  detail: Record<string, unknown> | null;
  created_at: string;
}

export interface Notification {
  id: UUID;
  user_id: UUID;
  title: string;
  body: string | null;
  read: boolean;
  channel: string;
  created_at: string;
}

export interface HealthResponse {
  status: string;
  env: string;
}
