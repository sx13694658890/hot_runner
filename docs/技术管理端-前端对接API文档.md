# 技术管理端 — 前端对接 API 文档（M0）

**对应后端**：`backend/`（FastAPI 0.1.x）  
**对应前端**：`frontend/`（React + Vite + Tailwind，依赖 **pnpm**，见 `frontend/README.md`）  
**API 版本路径**：`/api/v1`  
**文档版本**：v1.4（含 §5.3～§5.5 P3～P5；后续迭代以 OpenAPI 为准）

---

## 1. 基础约定

### 1.1 Base URL

- 本地开发示例：`http://127.0.0.1:8000`
- 前端环境变量建议：`VITE_API_BASE_URL`（或项目约定）指向上述 origin，**不要**把 `/api/v1` 写进域名以外的重复前缀。

完整路径示例：

```text
{BASE}/api/v1/auth/login
{BASE}/health
```

### 1.2 健康检查（无需鉴权）

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/health` | 存活探测 |

**响应示例**

```json
{ "status": "ok", "env": "development" }
```

### 1.3 跨域 CORS

后端从环境变量 **`CORS_ORIGINS`** 读取允许的前端源（逗号分隔），默认包含 `http://localhost:5173`。部署时需在服务端 `.env` 中配置实际前端地址。

### 1.4 内容类型

| 场景 | Header |
|------|--------|
| JSON 请求体 | `Content-Type: application/json` |
| 文件上传 | `Content-Type: multipart/form-data`（由浏览器/`FormData` 自动带 boundary，不要手写整段） |

### 1.5 鉴权（JWT Bearer）

除登录、健康检查外，**绝大部分业务接口**需要：

```http
Authorization: Bearer <access_token>
```

- 令牌来自 `POST /api/v1/auth/login` 的 `access_token`。
- 过期时间由服务端 `ACCESS_TOKEN_EXPIRE_MINUTES` 控制（默认 480 分钟）；前端应在 **401** 时清理本地令牌并跳转登录。
- 服务端使用 **HTTP Bearer** 方案（`HTTPBearer`），勿使用 `Authorization: Token xxx` 等非标准前缀。

### 1.6 时间与 ID

- 时间字段：JSON 中为 **ISO 8601** 字符串（含时区，如 `2026-04-12T03:00:00+00:00`）。
- ID：均为 **UUID** 字符串。

### 1.7 OpenAPI 与在线调试

服务启动后可直接使用：

- **Swagger UI**：`{BASE}/docs`
- **ReDoc**：`{BASE}/redoc`
- **OpenAPI JSON**：`{BASE}/openapi.json`

前端可用 `openapi-typescript` 等工具从 `openapi.json` 生成 TypeScript 类型（推荐与手写类型二选一、定期同步）。

---

## 2. 统一错误格式

FastAPI 默认将 `HTTPException` 序列化为：

```json
{ "detail": <string | object | array> }
```

常见情况：

| HTTP | `detail` 形态 | 说明 |
|------|----------------|------|
| 401 | 字符串，如 `"未登录或令牌无效"` / `"用户名或密码错误"` | 未带令牌、令牌无效、登录失败 |
| 403 | 字符串 **或** 对象 | 权限不足时可能为 `{"message":"权限不足","missing":["department:read"]}` |
| 404 | 字符串 | 资源不存在 |
| 422 | 数组 | Pydantic 校验失败，含 `loc` / `msg` / `type` 等字段 |
| 400 | 字符串 | 业务校验失败（如编码重复） |

**403 权限对象示例**（便于前端展示缺省权限）：

```json
{
  "detail": {
    "message": "权限不足",
    "missing": ["department:read"]
  }
}
```

**422 示例**（节选）：

```json
{
  "detail": [
    {
      "type": "string_too_short",
      "loc": ["body", "username"],
      "msg": "String should have at least 2 characters",
      "input": "a"
    }
  ]
}
```

---

## 3. 认证与用户上下文

### 3.1 登录

| 方法 | 路径 | 鉴权 |
|------|------|------|
| POST | `/api/v1/auth/login` | 否 |

**请求体**

| 字段 | 类型 | 约束 |
|------|------|------|
| username | string | 2～64 |
| password | string | 1～128 |

**响应 200**

| 字段 | 类型 | 说明 |
|------|------|------|
| access_token | string | JWT |
| token_type | string | 固定为 `bearer` |

### 3.2 当前用户

| 方法 | 路径 | 鉴权 |
|------|------|------|
| GET | `/api/v1/auth/me` | 是 |

**响应 200**（`UserBrief`）

| 字段 | 类型 |
|------|------|
| id | UUID |
| username | string |
| email | string |
| full_name | string |
| is_active | boolean |
| is_superuser | boolean |
| department_id | UUID \| null |
| position_id | UUID \| null |

### 3.3 当前用户权限码（用于前端菜单/按钮）

| 方法 | 路径 | 鉴权 |
|------|------|------|
| GET | `/api/v1/auth/me/permissions` | 可选 |

- **未带令牌**：返回 `{ "codes": [] }`。
- **超级管理员**：`{ "codes": ["*"] }`。
- **普通用户**：`{ "codes": ["department:read", ...] }`（已排序字符串数组）。

前端建议：以 `codes` 是否包含某权限码或包含 `*` 控制路由与按钮显隐；与后端 `require_permissions` 使用的码表保持一致（见第 8 节）。

---

## 4. 组织与 IAM

### 4.1 部门

前缀：`/api/v1/departments`

| 方法 | 路径 | 所需权限 |
|------|------|-----------|
| GET | `` | `department:read` |
| POST | `` | `department:write` |
| PATCH | `/{dept_id}` | `department:write` |
| DELETE | `/{dept_id}` | `department:write` |

**POST / PATCH 请求体字段**（创建用全部可选默认值见模型；更新为部分字段）

| 字段 | 类型 | 说明 |
|------|------|------|
| name | string | 必填（创建）；最大 200 |
| code | string \| null | 唯一；最大 64 |
| parent_id | UUID \| null | 上级部门 |
| sort_order | number | 默认 0 |
| remark | string \| null | |

**响应**：`DepartmentRead` — `id`, `name`, `code`, `parent_id`, `sort_order`, `remark`。

**DELETE**：204，无 body。

---

### 4.2 岗位

前缀：`/api/v1/positions`

| 方法 | 路径 | 所需权限 |
|------|------|-----------|
| GET | `` | `position:read` |
| POST | `` | `position:write` |

**POST 请求体**（`PositionCreate`）

| 字段 | 类型 |
|------|------|
| name | string，必填，≤120 |
| code | string \| null，≤64，唯一 |
| department_id | UUID \| null |
| remark | string \| null |

**响应**：`PositionRead`（含 `id`）。

---

### 4.3 用户

前缀：`/api/v1/users`

| 方法 | 路径 | 所需权限 |
|------|------|-----------|
| GET | `` | `user:read` |
| POST | `` | `user:write` |
| GET | `/{user_id}` | `user:read` |
| PATCH | `/{user_id}` | `user:write` |
| POST | `/{user_id}/roles` | 超级管理员 **或** 拥有 `role:assign` |

**POST 创建 `UserCreate`**

| 字段 | 类型 |
|------|------|
| username | string，2～64 |
| email | string，邮箱格式 |
| password | string，6～128 |
| full_name | string，≤120 |
| department_id | UUID \| null |
| position_id | UUID \| null |
| is_active | boolean，默认 true |
| role_ids | UUID[]，默认 [] |

**PATCH `UserUpdate`**：均为可选 — `email`, `full_name`, `department_id`, `position_id`, `is_active`, `password`（若传密码则 6～128）。

**POST `/{user_id}/roles` 请求体**

```json
{ "role_ids": ["<uuid>", "..."] }
```

说明：会**替换**该用户全部角色关联。

**响应**：`UserRead`（不含密码哈希）。

---

### 4.4 角色与权限字典

前缀：`/api/v1/roles`

| 方法 | 路径 | 所需权限 |
|------|------|-----------|
| GET | `` | `role:read` |
| GET | `/permissions` | `role:read` |

**`RoleRead`**：`id`, `name`, `code`, `description`。

**`PermissionRead`**：`id`, `code`, `name`, `module`。

---

## 5. 项目与成员（M0 预留）

前缀：`/api/v1/projects`

| 方法 | 路径 | 所需权限 |
|------|------|-----------|
| GET | `` | `project:read` |
| POST | `` | `project:write` |
| GET | `/{project_id}` | `project:read` |
| PATCH | `/{project_id}` | `project:write` |
| POST | `/{project_id}/members` | `project:member:manage` |

**POST 创建 `ProjectCreate`**

| 字段 | 类型 |
|------|------|
| name | string，≤200 |
| code | string，≤64，**全局唯一** |
| remark | string \| null |

**响应**：`ProjectRead` — 含 `id`, `name`, `code`, `status`, `remark`。

**POST `/{project_id}/members` 请求体 `ProjectMemberCreate`**

| 字段 | 类型 |
|------|------|
| user_id | UUID |
| role_in_project | `"owner"` \| `"member"`，默认 `"member"` |

**响应**：204，无 body。

**PATCH `/{project_id}` 请求体 `ProjectUpdate`**（字段均可选）：`name`, `status`, `remark`。

### 5.1 P1：项目工作包（WBS / 里程碑 / 风险 / 设计 / 变更 / 选型存根）

前缀仍为 **`/api/v1/projects`**。以下路径均在 `/{project_id}` 之下。

| 资源 | 方法 | 路径模式 | 读权限 | 写权限 |
|------|------|----------|--------|--------|
| WBS 任务 | GET / POST | `/{id}/tasks`、`/{id}/tasks/{task_id}`（PATCH/DELETE） | `wbs:read` | `wbs:write` |
| 里程碑 | GET / POST / PATCH / DELETE | `/{id}/milestones`、`/{id}/milestones/{mid}` | `milestone:read` | `milestone:write` |
| 风险 | GET / POST / PATCH / DELETE | `/{id}/risks`、`/{id}/risks/{rid}` | `risk:read` | `risk:write` |
| 设计任务 | GET / POST / PATCH / DELETE | `/{id}/design-tasks`、`/{id}/design-tasks/{tid}` | `design_task:read` | `design_task:write` |
| 设计变更 | GET / POST / PATCH / DELETE | `/{id}/design-changes`、`/{id}/design-changes/{cid}` | `design_change:read` | `design_change:write` |
| 选型存根 | GET / POST / PATCH / DELETE | `/{id}/selection-stubs`、`/{id}/selection-stubs/{sid}` | `selection:read` | `selection:write` |

**说明**：请求/响应体字段以 **`/openapi.json`** 为准（Pydantic 模型：`ProjectTaskCreate` / `ProjectMilestoneRead` 等）。设计变更 **POST** 时 `created_by_user_id` 由后端取当前登录用户。选型存根 **`payload`** 为 JSON 对象（JSONB）。

### 5.2 P2：标准件与图纸版本

前缀：**`/api/v1/standard-parts`**

| 方法 | 路径 | 所需权限 |
|------|------|-----------|
| GET | ``（Query：`skip`,`limit`,`status`） | `standard_part:read` |
| POST | `` | `standard_part:write` |
| GET / PATCH / DELETE | `/{part_id}` | 读 / 写同上 |
| GET / POST | `/{part_id}/drawing-versions` | `drawing_version:read` / `drawing_version:write` |
| PATCH / DELETE | `/{part_id}/drawing-versions/{version_id}` | `drawing_version:write` |

**约束**：同一标准件下 **`version_label` 唯一**；`file_asset_id` 须为已存在文件资产 ID（可先走 §6 上传）。

### 5.3 P3：研发域（`/api/v1/rd`）

前缀 **`/api/v1/rd`**：`/projects`、`/projects/{id}/tasks`、`/projects/{id}/release-iterations`、`/projects/{id}/deliverables`、`/library-intakes` 及 submit/withdraw/approve/reject 等。**权限**：`rd:read`、`rd:write`、`rd:intake_approve`。详见 OpenAPI。

### 5.4 P4：工艺与现场（`/api/v1/field`）

前缀：**`/api/v1/field`**（后端 `app/api/v1/endpoints/field_site.py`，迁移 **`20260413_0002`**）。**权限**：`field:read`、`field:write`。

| 资源 | 方法（路径均在 `/api/v1/field` 之后） | 说明 |
|------|----------------------------------------|------|
| 工艺方案 | GET/POST `/process-plans`，GET/PATCH/DELETE `/process-plans/{id}` | 须至少关联 **`project_id` 或 `standard_part_id`** |
| 工艺批注 | GET/POST `/annotations`，DELETE `/annotations/{id}` | 同上关联约束；可选 **`file_asset_id`** |
| 试模工单 | GET/POST `/trial-runs`，PATCH/DELETE `/trial-runs/{id}` | 状态机：`draft→scheduled→in_progress→reported→closed`，可 `cancelled`；关闭时自动写 **`closed_at`** |
| 售后工单 | GET/POST `/support-tickets`，PATCH/DELETE `/support-tickets/{id}` | 溯源 **`drawing_version_id`**、**`selection_stub_id`**；状态：`open→investigating→resolved→closed` |
| 知识库 | GET/POST `/knowledge-docs`，PATCH/DELETE `/knowledge-docs/{id}` | 失效案例字段：`symptom`/`cause`/`remedy`；可选 **`related_standard_part_id`** |

**前端**：单页 **`/field`**（`FieldSitePage`），五 Tab 对接上表。

### 5.5 P5：驾驶舱 KPI 与集成作业桩（`/api/v1/dashboard`、`/api/v1/integration`）

**说明**：真实 **ERP/MES/BOM** 对接依赖企业接口与调研清单；当前为**作业台账 + KPI 聚合桩**，便于演示与后续替换适配层。

**数据库**：表 **`integration_sync_jobs`**（迁移 **`20260413_0003`**）；权限迁移同文件 + **`20260413_0004`**（designer 演示账号补 **dashboard/integration 只读**）。

**权限**：`dashboard:read`（`GET /dashboard/summary`）、`integration:read`（列表/详情）、`integration:write`（`POST /integration/jobs` 触发桩作业）。

#### 驾驶舱 KPI

| 方法 | 路径 | 所需权限 |
|------|------|----------|
| GET | `/summary`（接在 **`/api/v1/dashboard`** 后） | `dashboard:read` |

**响应 `DashboardSummaryRead`**：项目总数/进行中、标准件条数、未完成设计任务数、售后未关闭工单数、进行中试模工单数、待审批成果入库数、近 7 日集成作业成功/失败次数（桩作业计入）。

#### 集成作业

| 方法 | 路径 | 所需权限 |
|------|------|----------|
| GET | `/jobs` | `integration:read` |
| POST | `/jobs` | `integration:write` |
| GET | `/jobs/{job_id}` | `integration:read` |

**POST 请求体 `IntegrationSyncJobCreate`**：`job_type` ∈ `erp_material_pull` \| `bom_push` \| `bom_pull` \| `mes_handshake`；可选 **`detail`**（JSON）。

**前端**：工作台 **`/`** 在具备 **`dashboard:read`** 时展示 KPI 卡片；**`/integration`**（`IntegrationPage`）维护作业列表与触发桩同步。

---

## 6. 文件（元数据 + 本地上传）

前缀：`/api/v1/files`

| 方法 | 路径 | 所需权限 |
|------|------|-----------|
| POST | `/upload` | `file:upload` |
| GET | `/{file_id}` | `file:read` |

**POST `/upload`**

- **表单字段名**  
  - `file`（必填）：单文件。  
  - `storage_domain`（可选）：`general` \| `project` \| `design` \| `library` \| `approval`，默认 `general`。与 MVP 主线「项目 / 设计 / 图库 / 审批」目录规划一致。非法值返回 **400**。  
  - `project_id`（可选）：当 `storage_domain=project` 时**建议**传入；不传则落在 `project/_unscoped/` 下。  
- **磁盘相对路径示例**（`storage_path` 相对 `UPLOAD_DIR`）：`design/{file_uuid}/图纸.pdf`、`project/{project_uuid}/{file_uuid}/附件.zip`。  
- **响应 201**：`FileAssetRead`

| 字段 | 类型 | 说明 |
|------|------|------|
| id | UUID | 文件资产 ID，后续下载接口可对接此 ID |
| original_name | string | 原始文件名 |
| content_type | string \| null | |
| size_bytes | number | |
| storage_path | string | 服务端相对存储路径（**不要**当作可直接访问的 URL） |
| created_by_user_id | UUID \| null | |
| created_at | string (ISO) | |

**M0 说明**：当前版本**仅提供上传与元数据查询**，不提供浏览器直链下载；若前端需预览/下载，需与后端约定后续方案（如对象存储预签名 URL、专用 `GET /files/{id}/content`）。

---

## 7. 审计与通知

### 7.1 审计日志

前缀：`/api/v1/audit-logs`

| 方法 | 路径 | 所需权限 |
|------|------|-----------|
| GET | `` | `audit:read` |

**Query 参数**

| 参数 | 类型 | 默认 | 说明 |
|------|------|------|------|
| skip | int | 0 | ≥0 |
| limit | int | 50 | 1～200 |
| action | string \| 省略 | null | 按动作精确过滤，如 `auth.login_success` |

**响应**：`AuditLogRead[]`

| 字段 | 类型 |
|------|------|
| id | UUID |
| user_id | UUID \| null |
| action | string |
| resource_type | string \| null |
| resource_id | string \| null |
| ip | string \| null |
| user_agent | string \| null |
| detail | object \| null |
| created_at | string (ISO) |

---

### 7.2 站内通知

前缀：`/api/v1/notifications`

| 方法 | 路径 | 鉴权 / 权限 |
|------|------|----------------|
| GET | `/mine` | 登录即可（需 Bearer） |
| POST | `` | `notification:write` |
| POST | `/{notif_id}/read` | 登录即可；仅能标记**自己的**通知 |

**POST 创建 `NotificationCreate`**

| 字段 | 类型 |
|------|------|
| user_id | UUID | 接收人 |
| title | string，≤255 |
| body | string \| null |
| channel | `"in_app"` \| `"email"` \| `"wecom"` | 后两者为占位，M0 仍落库为站内数据 |

**响应**：`NotificationRead`（含 `read`, `channel`, `created_at`）。

**GET `/mine`**：按创建时间倒序，**最多 100 条**。

---

## 8. 权限码一览（与 seed 一致）

前端应用 `GET /auth/me/permissions` 的 `codes` 与下表对齐（超级管理员为 `*`）。

| 权限码 | 说明 |
|--------|------|
| department:read / department:write | 部门 |
| position:read / position:write | 岗位 |
| user:read / user:write | 用户 |
| role:read | 角色与权限列表 |
| role:assign | 分配用户角色（或与超管一起） |
| project:read / project:write / project:member:manage | 项目与成员 |
| wbs:read / wbs:write | WBS 任务 |
| milestone:read / milestone:write | 里程碑 |
| risk:read / risk:write | 风险 |
| design_task:read / design_task:write | 设计任务 |
| design_change:read / design_change:write | 设计变更 |
| selection:read / selection:write | 选型存根 |
| standard_part:read / standard_part:write | 标准件 |
| drawing_version:read / drawing_version:write | 图纸版本 |
| rd:read / rd:write | P3 研发域 |
| rd:intake_approve | P3 成果入库审批 |
| field:read / field:write | P4 工艺与现场 |
| dashboard:read | P5 驾驶舱 KPI（`/dashboard/summary`） |
| integration:read / integration:write | P5 集成作业台账与触发 |
| file:upload / file:read | 文件 |
| audit:read | 审计日志 |
| notification:write | 代发通知 |

**演示账号（seed）**：`admin` / `Admin123456`（超管）；`designer` / `Designer123456`（无 `audit:read`、`notification:write` 等；迁移 **20260413_0004** 为其追加 **`dashboard:read`、`integration:read`**；详见 seed）。

---

## 9. 前端实现建议（简要）

1. **Axios / fetch 封装一层**：BaseURL、`Authorization` 注入、401 统一拦截、422 将 `detail` 映射为表单错误。
2. **权限**：登录后拉取 `me` + `me/permissions`，与路由 `meta.permission` 及按钮 `v-if` / 自定义 Hook 绑定。
3. **上传**：`FormData` 含 **`file`**；可选 `storage_domain`、`project_id`（见 §6），不要混用 JSON body。
4. **类型**：优先从 `/openapi.json` 生成类型，或为上述 DTO 手写 `interface` 与 Zod schema 二选一。
5. **分页**：M0 仅审计接口使用 `skip/limit`；列表类接口当前为全量返回，数据量大时后续版本会加分页参数（对接前看 OpenAPI）。

---

## 10. 变更记录

| 版本 | 日期 | 说明 |
|------|------|------|
| v1.0 | 2026-04-12 | 对齐 M0 已实现后端 |
| v1.1 | 2026-04-12 | P1 项目工作包 + P2 标准件/图纸版本 API；项目 GET/PATCH；权限码表扩展 |
| v1.3 | 2026-04-13 | §5.3 P3 / §5.4 P4：`/rd`、`/field` 摘要；权限码增补 `rd:*`、`field:*` |
| v1.4 | 2026-04-13 | **§5.5 P5**：`/dashboard/summary`、`/integration/jobs`；表 `integration_sync_jobs`；权限 **`dashboard:*`**、**`integration:*`** |

---

**维护说明**：接口变更时请同步更新本文档与 `backend/README.md`；以部署环境 `openapi.json` 为最终契约参考。
