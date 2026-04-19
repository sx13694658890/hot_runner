# 技术管理端后端（P0 / 里程碑 M0）

FastAPI + SQLAlchemy 2（async）+ **asyncpg** + PostgreSQL + Alembic。依赖与虚拟环境由 **uv** 管理。

## 环境要求

- Python 3.11+
- [uv](https://docs.astral.sh/uv/)
- PostgreSQL 14+（本地或 Docker）

## 快速开始

```bash
cd backend
cp .env.example .env
# 编辑 .env 中的 DATABASE_URL

uv sync
uv run alembic upgrade head
uv run python scripts/seed.py
uv run serve
```

等价于带热重载的 Uvicorn：`APP_ENV=development` 时默认开启 **reload**。监听地址与端口可用环境变量覆盖：

- `BIND_HOST`（默认 `0.0.0.0`）
- `PORT`（默认 `8000`）

示例：`PORT=8080 uv run serve`

- 健康检查：`GET http://127.0.0.1:8000/health`（端口以 `PORT` 为准）
- API 前缀：`/api/v1`
- 演示账号（见 seed 输出）：`admin` / `Admin123456`，`designer` / `Designer123456`

## 文档

- **前端对接**：`docs/技术管理端-前端对接API文档.md`（路径、鉴权、DTO、权限码、错误约定）
- **范围**：与 `docs/技术管理端-开发计划.md` 中 **P0 / M0** 对齐 — 组织与人员、RBAC、文件上传元数据、审计日志、站内通知骨架。
- 在线契约：服务启动后访问 `/docs`、`/openapi.json`。
