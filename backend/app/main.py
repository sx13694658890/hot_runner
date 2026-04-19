import logging
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy import text
from sqlalchemy.exc import ProgrammingError

from app.api.v1 import api_router
from app.config import get_settings
from app.database import engine
from app.schemas.common import HealthResponse

logger = logging.getLogger(__name__)


def _missing_schema_hint(exc: ProgrammingError) -> str | None:
    """将「表/关系不存在」类错误映射为可操作的提示（常见于未执行 alembic upgrade）。"""
    raw = str(getattr(exc, "orig", None) or exc).lower()
    if "does not exist" not in raw:
        return None
    if "relation" in raw or "table" in raw:
        return (
            "数据库缺少必要表或未执行最新迁移；请在 backend 目录执行：uv run alembic upgrade head"
        )
    return None


@asynccontextmanager
async def lifespan(app: FastAPI):
    settings = get_settings()
    Path(settings.upload_dir).mkdir(parents=True, exist_ok=True)
    try:
        async with engine.connect() as conn:
            reg = await conn.scalar(text("SELECT to_regclass('public.standard_parts')"))
            if reg is None:
                logger.warning(
                    "表 standard_parts 不存在，/standard-parts 等 P2 接口将失败；"
                    "请执行：uv run alembic upgrade head"
                )
    except OSError:
        pass
    except Exception as e:  # noqa: BLE001 — 启动不应因检查失败而阻断
        logger.warning("启动时无法检查数据库结构：%s", e)
    yield


def create_app() -> FastAPI:
    settings = get_settings()
    app = FastAPI(title="热流道技术管理端 API", version="0.1.0", lifespan=lifespan)
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origin_list,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    @app.exception_handler(ProgrammingError)
    async def handle_sqlalchemy_programming_error(
        _request: Request, exc: ProgrammingError
    ) -> JSONResponse:
        hint = _missing_schema_hint(exc)
        if hint:
            return JSONResponse(status_code=503, content={"detail": hint})
        return JSONResponse(
            status_code=500,
            content={"detail": "数据库执行出错，请查看服务端日志或联系管理员"},
        )

    app.include_router(api_router)

    @app.get("/health", response_model=HealthResponse, tags=["system"])
    async def health() -> HealthResponse:
        return HealthResponse(env=settings.app_env)

    return app


app = create_app()
