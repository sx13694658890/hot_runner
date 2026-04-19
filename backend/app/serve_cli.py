"""开发/本地启动入口：`uv run serve`。"""

import os


def main() -> None:
    import uvicorn

    from app.config import get_settings

    settings = get_settings()
    host = os.environ.get("BIND_HOST", "0.0.0.0")
    port = int(os.environ.get("PORT", "8009"))
    reload = settings.app_env == "development"

    uvicorn.run(
        "app.main:app",
        host=host,
        port=port,
        reload=reload,
    )
