import uuid
from pathlib import Path
from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, File, Form, HTTPException, Request, UploadFile, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import get_settings
from app.database import get_db
from app.deps import require_permissions
from app.models.file_asset import FileAsset
from app.models.user import User
from app.schemas.file import FileAssetRead
from app.services.audit_service import log_action
from app.services.upload_paths import build_storage_layout, parse_upload_domain, safe_filename

router = APIRouter()


@router.post("/upload", response_model=FileAssetRead, status_code=status.HTTP_201_CREATED)
async def upload_file(
    request: Request,
    db: Annotated[AsyncSession, Depends(get_db)],
    user: Annotated[User, Depends(require_permissions("file:upload"))],
    file: UploadFile = File(...),
    storage_domain: str | None = Form(
        default=None,
        description="业务域目录：general | project | design | library | approval（默认 general）",
    ),
    project_id: UUID | None = Form(
        default=None,
        description="domain=project 时建议传入，否则落在 project/_unscoped/",
    ),
) -> FileAsset:
    try:
        domain = parse_upload_domain(storage_domain)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e)) from e
    settings = get_settings()
    base = Path(settings.upload_dir)
    base.mkdir(parents=True, exist_ok=True)
    fid = uuid.uuid4()
    safe_name = safe_filename(file.filename or "unnamed")
    storage_path = build_storage_layout(domain, project_id, fid, safe_name)
    dest_path = base / Path(storage_path)
    dest_path.parent.mkdir(parents=True, exist_ok=True)
    size = 0
    with dest_path.open("wb") as buf:
        while chunk := await file.read(1024 * 1024):
            size += len(chunk)
            buf.write(chunk)
    asset = FileAsset(
        original_name=safe_name,
        content_type=file.content_type,
        size_bytes=size,
        storage_path=storage_path,
        created_by_user_id=user.id,
    )
    db.add(asset)
    await db.flush()
    await log_action(
        db,
        user_id=user.id,
        action="file.upload",
        resource_type="file_asset",
        resource_id=str(asset.id),
        ip=request.client.host if request.client else None,
        user_agent=request.headers.get("user-agent"),
        detail={
            "original_name": safe_name,
            "size_bytes": size,
            "storage_domain": domain,
            "project_id": str(project_id) if project_id else None,
            "storage_path": storage_path,
        },
    )
    await db.commit()
    await db.refresh(asset)
    return asset


@router.get("/{file_id}", response_model=FileAssetRead)
async def get_file_meta(
    file_id: UUID,
    db: Annotated[AsyncSession, Depends(get_db)],
    _: Annotated[User, Depends(require_permissions("file:read"))],
) -> FileAsset:
    row = await db.get(FileAsset, file_id)
    if row is None:
        raise HTTPException(status_code=404, detail="文件不存在")
    return row
