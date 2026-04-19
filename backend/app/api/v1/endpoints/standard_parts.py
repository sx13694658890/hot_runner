"""P2：标准件与图纸版本 API。"""

from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.deps import require_permissions
from app.models.catalog import DrawingVersion, StandardPart
from app.models.file_asset import FileAsset
from app.models.user import User
from app.schemas.catalog import (
    DrawingVersionCreate,
    DrawingVersionRead,
    DrawingVersionUpdate,
    StandardPartCreate,
    StandardPartRead,
    StandardPartUpdate,
)
from app.services.audit_service import log_action

router = APIRouter()


@router.get("", response_model=list[StandardPartRead])
async def list_standard_parts(
    db: Annotated[AsyncSession, Depends(get_db)],
    _: Annotated[User, Depends(require_permissions("standard_part:read"))],
    skip: Annotated[int, Query(ge=0)] = 0,
    limit: Annotated[int, Query(ge=1, le=200)] = 100,
    status_filter: Annotated[str | None, Query(alias="status")] = None,
) -> list[StandardPart]:
    stmt = select(StandardPart).order_by(StandardPart.code).offset(skip).limit(limit)
    if status_filter:
        stmt = stmt.where(StandardPart.status == status_filter)
    r = await db.execute(stmt)
    return list(r.scalars().all())


@router.post("", response_model=StandardPartRead, status_code=status.HTTP_201_CREATED)
async def create_standard_part(
    request: Request,
    body: StandardPartCreate,
    db: Annotated[AsyncSession, Depends(get_db)],
    user: Annotated[User, Depends(require_permissions("standard_part:write"))],
) -> StandardPart:
    exists = await db.execute(select(StandardPart.id).where(StandardPart.code == body.code))
    if exists.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="标准件编码已存在")
    row = StandardPart(**body.model_dump())
    db.add(row)
    await db.flush()
    await log_action(
        db,
        user_id=user.id,
        action="standard_part.create",
        resource_type="standard_part",
        resource_id=str(row.id),
        ip=request.client.host if request.client else None,
        user_agent=request.headers.get("user-agent"),
        detail={"code": body.code},
    )
    await db.commit()
    await db.refresh(row)
    return row


@router.get("/{part_id}", response_model=StandardPartRead)
async def get_standard_part(
    part_id: UUID,
    db: Annotated[AsyncSession, Depends(get_db)],
    _: Annotated[User, Depends(require_permissions("standard_part:read"))],
) -> StandardPart:
    row = await db.get(StandardPart, part_id)
    if row is None:
        raise HTTPException(status_code=404, detail="标准件不存在")
    return row


@router.patch("/{part_id}", response_model=StandardPartRead)
async def update_standard_part(
    request: Request,
    part_id: UUID,
    body: StandardPartUpdate,
    db: Annotated[AsyncSession, Depends(get_db)],
    user: Annotated[User, Depends(require_permissions("standard_part:write"))],
) -> StandardPart:
    row = await db.get(StandardPart, part_id)
    if row is None:
        raise HTTPException(status_code=404, detail="标准件不存在")
    for k, v in body.model_dump(exclude_unset=True).items():
        setattr(row, k, v)
    await log_action(
        db,
        user_id=user.id,
        action="standard_part.update",
        resource_type="standard_part",
        resource_id=str(part_id),
        ip=request.client.host if request.client else None,
        user_agent=request.headers.get("user-agent"),
    )
    await db.commit()
    await db.refresh(row)
    return row


@router.delete("/{part_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_standard_part(
    part_id: UUID,
    db: Annotated[AsyncSession, Depends(get_db)],
    _: Annotated[User, Depends(require_permissions("standard_part:write"))],
) -> None:
    row = await db.get(StandardPart, part_id)
    if row is None:
        raise HTTPException(status_code=404, detail="标准件不存在")
    await db.delete(row)
    await db.commit()


# ----- 图纸版本（挂在标准件下）-----
@router.get("/{part_id}/drawing-versions", response_model=list[DrawingVersionRead])
async def list_drawing_versions(
    part_id: UUID,
    db: Annotated[AsyncSession, Depends(get_db)],
    _: Annotated[User, Depends(require_permissions("drawing_version:read"))],
) -> list[DrawingVersion]:
    part = await db.get(StandardPart, part_id)
    if part is None:
        raise HTTPException(status_code=404, detail="标准件不存在")
    r = await db.execute(
        select(DrawingVersion)
        .where(DrawingVersion.standard_part_id == part_id)
        .order_by(DrawingVersion.created_at)
    )
    return list(r.scalars().all())


@router.post(
    "/{part_id}/drawing-versions",
    response_model=DrawingVersionRead,
    status_code=status.HTTP_201_CREATED,
)
async def create_drawing_version(
    request: Request,
    part_id: UUID,
    body: DrawingVersionCreate,
    db: Annotated[AsyncSession, Depends(get_db)],
    user: Annotated[User, Depends(require_permissions("drawing_version:write"))],
) -> DrawingVersion:
    part = await db.get(StandardPart, part_id)
    if part is None:
        raise HTTPException(status_code=404, detail="标准件不存在")
    dup = await db.execute(
        select(DrawingVersion.id).where(
            DrawingVersion.standard_part_id == part_id,
            DrawingVersion.version_label == body.version_label,
        )
    )
    if dup.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="该版本号已存在")
    if body.file_asset_id is not None:
        fa = await db.get(FileAsset, body.file_asset_id)
        if fa is None:
            raise HTTPException(status_code=400, detail="文件资产不存在")
    row = DrawingVersion(standard_part_id=part_id, **body.model_dump())
    db.add(row)
    await db.flush()
    await log_action(
        db,
        user_id=user.id,
        action="drawing_version.create",
        resource_type="drawing_version",
        resource_id=str(row.id),
        ip=request.client.host if request.client else None,
        user_agent=request.headers.get("user-agent"),
        detail={"standard_part_id": str(part_id), "version_label": body.version_label},
    )
    await db.commit()
    await db.refresh(row)
    return row


@router.patch(
    "/{part_id}/drawing-versions/{version_id}",
    response_model=DrawingVersionRead,
)
async def update_drawing_version(
    request: Request,
    part_id: UUID,
    version_id: UUID,
    body: DrawingVersionUpdate,
    db: Annotated[AsyncSession, Depends(get_db)],
    user: Annotated[User, Depends(require_permissions("drawing_version:write"))],
) -> DrawingVersion:
    row = await db.get(DrawingVersion, version_id)
    if row is None or row.standard_part_id != part_id:
        raise HTTPException(status_code=404, detail="图纸版本不存在")
    data = body.model_dump(exclude_unset=True)
    if "version_label" in data and data["version_label"] != row.version_label:
        dup = await db.execute(
            select(DrawingVersion.id).where(
                DrawingVersion.standard_part_id == part_id,
                DrawingVersion.version_label == data["version_label"],
                DrawingVersion.id != version_id,
            )
        )
        if dup.scalar_one_or_none():
            raise HTTPException(status_code=400, detail="该版本号已存在")
    if data.get("file_asset_id") is not None:
        fa = await db.get(FileAsset, data["file_asset_id"])
        if fa is None:
            raise HTTPException(status_code=400, detail="文件资产不存在")
    for k, v in data.items():
        setattr(row, k, v)
    await log_action(
        db,
        user_id=user.id,
        action="drawing_version.update",
        resource_type="drawing_version",
        resource_id=str(version_id),
        ip=request.client.host if request.client else None,
        user_agent=request.headers.get("user-agent"),
    )
    await db.commit()
    await db.refresh(row)
    return row


@router.delete(
    "/{part_id}/drawing-versions/{version_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
async def delete_drawing_version(
    part_id: UUID,
    version_id: UUID,
    db: Annotated[AsyncSession, Depends(get_db)],
    _: Annotated[User, Depends(require_permissions("drawing_version:write"))],
) -> None:
    row = await db.get(DrawingVersion, version_id)
    if row is None or row.standard_part_id != part_id:
        raise HTTPException(status_code=404, detail="图纸版本不存在")
    await db.delete(row)
    await db.commit()
