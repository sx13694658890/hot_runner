# 技术管理端前端（M0）

React 18 + Vite + TypeScript + **Tailwind CSS**，对接说明见 `docs/技术管理端-前端对接API文档.md`。

## 环境要求

- Node.js **≥ 18.18**
- **pnpm** ≥ 9（推荐启用 Corepack：`corepack enable`）

## 环境变量

复制 `.env.example` 为 `.env`。

**本地开发推荐**：不设置 `VITE_API_BASE_URL`（或留空）。此时请求使用相对路径 `/api/v1`，由 **Vite 代理**转发到后端，避免请求误发到前端开发端口导致 **404**。代理默认指向 `http://127.0.0.1:8000`；后端若使用其他端口，请设置 `VITE_API_PROXY_TARGET`，例如：

```bash
VITE_API_PROXY_TARGET=http://127.0.0.1:8009
```

**直连后端**：设置 `VITE_API_BASE_URL` 为后端根地址（不要带 `/api/v1`）。需在后端 `CORS_ORIGINS` 中加入本前端地址（如 `http://127.0.0.1:3679`）。

若误将 `VITE_API_BASE_URL` 写成 `http://host:port/api/v1`，前端会自动去掉重复路径。

## 命令（pnpm）

```bash
cd frontend
pnpm install
pnpm dev
```

构建：`pnpm build`，预览：`pnpm preview`，检查：`pnpm lint`。

## 功能（M0）

- 登录 / 退出、JWT 存储、`401` 跳转登录页  
- 工作台（`/health`、当前用户、权限码）  
- 部门 CRUD（上级部门下拉）  
- 岗位列表与新建（部门下拉）  
- 用户列表、新建、编辑、分配角色（部门/岗位下拉）  
- 角色与权限只读字典  
- 项目列表、新建、添加成员  
- 文件上传（`multipart` 字段 `file`）与元数据查询  
- 审计日志：`skip` / `limit` / `action` 查询  
- 我的通知、标已读；有 `notification:write` 时可代发通知  

界面样式统一使用 **Tailwind** 工具类。
