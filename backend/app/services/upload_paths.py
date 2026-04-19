"""本地静态目录下的上传路径规划（按业务域分目录，便于后续接对象存储前缀）。"""

from __future__ import annotations

import re
import uuid
from pathlib import Path
from typing import Literal
from uuid import UUID

UploadDomain = Literal["general", "project", "design", "library", "approval"]

_ALLOWED = frozenset({"general", "project", "design", "library", "approval"})


def parse_upload_domain(raw: str | None) -> UploadDomain:
    if raw is None or not str(raw).strip():
        return "general"
    v = str(raw).strip().lower()
    if v not in _ALLOWED:
        raise ValueError(
            "storage_domain 须为 general|project|design|library|approval，"
            f"收到: {raw!r}"
        )
    return v  # type: ignore[return-value]


def build_storage_layout(
    domain: UploadDomain,
    project_id: UUID | None,
    file_id: uuid.UUID,
    safe_name: str,
) -> str:
    """
    返回相对 upload_dir 的 posix 路径（含文件名）。

    目录约定（与 MVP 主线「项目 / 设计 / 图库 / 审批」对齐）::
        general/   — 未归类或历史兼容
        project/{project_id}|_unscoped/{file_id}/
        design/{file_id}/
        library/{file_id}/
        approval/{file_id}/
    """
    fid = str(file_id)
    root = Path(domain if domain != "general" else "general")
    if domain == "project":
        if project_id is not None:
            rel_dir = root / str(project_id) / fid
        else:
            rel_dir = root / "_unscoped" / fid
    else:
        rel_dir = root / fid
    rel_file = rel_dir / safe_name
    return rel_file.as_posix()


def safe_filename(name: str) -> str:
    base = name.strip() or "unnamed"
    base = Path(base).name
    base = re.sub(r"[^\w.\-()\u4e00-\u9fff]+", "_", base, flags=re.UNICODE)
    return base[:255] if len(base) > 255 else base
