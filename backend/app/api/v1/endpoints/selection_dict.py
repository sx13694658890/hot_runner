"""选型字典：分类只读 + 字典项 CRUD + 模具表单用选项包。"""

from __future__ import annotations

from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.deps import require_permissions
from app.models.selection_catalog import SelDictCategory, SelDictItem
from app.models.user import User
from app.schemas.selection_dict import (
    MoldDictBundleRead,
    SelDictCategoryRead,
    SelDictItemCreate,
    SelDictItemPatch,
    SelDictItemRead,
)

router = APIRouter()


@router.get("/dict/mold-options", response_model=MoldDictBundleRead)
async def get_mold_dict_bundle(
    db: Annotated[AsyncSession, Depends(get_db)],
    _: Annotated[User, Depends(require_permissions("selection:read"))],
) -> MoldDictBundleRead:
    from app.services.selection_dict_service import list_mold_dict_options_bundle

    bundle = await list_mold_dict_options_bundle(db)
    return MoldDictBundleRead(categories=bundle)


@router.get("/dict/hot-runner-spec-options", response_model=MoldDictBundleRead)
async def get_hot_runner_spec_dict_bundle(
    db: Annotated[AsyncSession, Depends(get_db)],
    _: Annotated[User, Depends(require_permissions("selection:read"))],
) -> MoldDictBundleRead:
    from app.services.selection_dict_service import list_hrspec_dict_options_bundle

    bundle = await list_hrspec_dict_options_bundle(db)
    return MoldDictBundleRead(categories=bundle)


@router.get("/dict/categories", response_model=list[SelDictCategoryRead])
async def list_dict_categories(
    db: Annotated[AsyncSession, Depends(get_db)],
    _: Annotated[User, Depends(require_permissions("selection:read"))],
) -> list[SelDictCategoryRead]:
    result = await db.execute(select(SelDictCategory).order_by(SelDictCategory.sort_order))
    return [SelDictCategoryRead.model_validate(r) for r in result.scalars().all()]


@router.get("/dict/items", response_model=list[SelDictItemRead])
async def list_dict_items(
    db: Annotated[AsyncSession, Depends(get_db)],
    _: Annotated[User, Depends(require_permissions("selection:read"))],
    category_code: str = Query(..., min_length=1),
    include_inactive: bool = False,
) -> list[SelDictItemRead]:
    stmt = (
        select(SelDictItem)
        .join(SelDictCategory, SelDictItem.category_id == SelDictCategory.id)
        .where(SelDictCategory.code == category_code)
        .order_by(SelDictItem.sort_order, SelDictItem.label)
    )
    if not include_inactive:
        stmt = stmt.where(SelDictItem.is_active.is_(True))
    result = await db.execute(stmt)
    return [SelDictItemRead.model_validate(r) for r in result.scalars().all()]


@router.post("/dict/items", response_model=SelDictItemRead, status_code=status.HTTP_201_CREATED)
async def create_dict_item(
    body: SelDictItemCreate,
    db: Annotated[AsyncSession, Depends(get_db)],
    _: Annotated[User, Depends(require_permissions("selection:write"))],
) -> SelDictItem:
    cat = await db.execute(select(SelDictCategory).where(SelDictCategory.code == body.category_code))
    row = cat.scalar_one_or_none()
    if row is None:
        raise HTTPException(status_code=404, detail="字典分类不存在")
    item = SelDictItem(
        category_id=row.id,
        label=body.label.strip(),
        sort_order=body.sort_order,
        is_active=True,
    )
    db.add(item)
    await db.commit()
    await db.refresh(item)
    return item


@router.patch("/dict/items/{item_id}", response_model=SelDictItemRead)
async def patch_dict_item(
    item_id: UUID,
    body: SelDictItemPatch,
    db: Annotated[AsyncSession, Depends(get_db)],
    _: Annotated[User, Depends(require_permissions("selection:write"))],
) -> SelDictItem:
    item = await db.get(SelDictItem, item_id)
    if item is None:
        raise HTTPException(status_code=404, detail="字典项不存在")
    data = body.model_dump(exclude_unset=True)
    if "label" in data and data["label"] is not None:
        data["label"] = data["label"].strip()
    for k, v in data.items():
        setattr(item, k, v)
    await db.commit()
    await db.refresh(item)
    return item


@router.delete("/dict/items/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_dict_item(
    item_id: UUID,
    db: Annotated[AsyncSession, Depends(get_db)],
    _: Annotated[User, Depends(require_permissions("selection:write"))],
) -> None:
    """停用字典项（硬删除受 sel_mold_info 外键限制）。"""
    item = await db.get(SelDictItem, item_id)
    if item is None:
        raise HTTPException(status_code=404, detail="字典项不存在")
    item.is_active = False
    await db.commit()
