"""选型字典：分类只读 + 字典项 CRUD + 模具表单用选项包。"""

from __future__ import annotations

from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.deps import require_permissions
from app.models.selection_catalog import SelDictCategory, SelDictItem
from app.models.user import User
from app.schemas.selection_dict import (
    MoldDictBundleRead,
    SelDictCategoryCreate,
    SelDictCategoryPatch,
    SelDictCategoryRead,
    SelDictItemCreate,
    SelDictItemPatch,
    SelDictItemRead,
)

router = APIRouter()


def _norm_code_prefix(p: str | None) -> str | None:
    if p is None:
        return None
    s = p.strip()
    return s if s else None


def _assert_code_has_prefix(*, code: str, prefix: str) -> None:
    if not code.startswith(prefix):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"字典分类 code 必须以 {prefix} 开头",
        )


def _assert_category_has_prefix(cat: SelDictCategory, prefix: str) -> None:
    _assert_code_has_prefix(code=cat.code, prefix=prefix)


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


@router.get("/dict/manifold-detail-options", response_model=MoldDictBundleRead)
async def get_manifold_detail_dict_bundle(
    db: Annotated[AsyncSession, Depends(get_db)],
    _: Annotated[User, Depends(require_permissions("selection:read"))],
) -> MoldDictBundleRead:
    """分流板大类数据字典（截图/Excel），与扁平行热流道规格字典独立；法向分流板可复用分流板主体同一批 code。"""
    from app.services.selection_dict_service import list_manifold_detail_dict_options_bundle

    bundle = await list_manifold_detail_dict_options_bundle(db)
    return MoldDictBundleRead(categories=bundle)


@router.get("/dict/main-nozzle-detail-options", response_model=MoldDictBundleRead)
async def get_main_nozzle_detail_dict_bundle(
    db: Annotated[AsyncSession, Depends(get_db)],
    _: Annotated[User, Depends(require_permissions("selection:read"))],
) -> MoldDictBundleRead:
    """主射咀大类数据字典（截图/Excel），与扁平行 hrspec_main_nozzle_* 规格字典独立或互补。"""
    from app.services.selection_dict_service import list_main_nozzle_detail_dict_options_bundle

    bundle = await list_main_nozzle_detail_dict_options_bundle(db)
    return MoldDictBundleRead(categories=bundle)


@router.get("/dict/hot-nozzle-detail-options", response_model=MoldDictBundleRead)
async def get_hot_nozzle_detail_dict_bundle(
    db: Annotated[AsyncSession, Depends(get_db)],
    _: Annotated[User, Depends(require_permissions("selection:read"))],
) -> MoldDictBundleRead:
    """热咀大类数据字典（截图/Excel），与扁平行 hrspec_hot_nozzle_* / 浇口等规格字典独立或互补。"""
    from app.services.selection_dict_service import list_hot_nozzle_detail_dict_options_bundle

    bundle = await list_hot_nozzle_detail_dict_options_bundle(db)
    return MoldDictBundleRead(categories=bundle)


@router.get("/dict/wizard-cae-flow-options", response_model=MoldDictBundleRead)
async def get_wizard_cae_flow_dict_bundle(
    db: Annotated[AsyncSession, Depends(get_db)],
    _: Annotated[User, Depends(require_permissions("selection:read"))],
) -> MoldDictBundleRead:
    """选型向导第 5 步：主射咀/桥/分流板/热咀流道直径、法向热咀、胶口直径（sel_wizard_cae_*）。"""
    from app.services.selection_dict_service import list_wizard_cae_flow_dict_options_bundle

    bundle = await list_wizard_cae_flow_dict_options_bundle(db)
    return MoldDictBundleRead(categories=bundle)


@router.get("/dict/drive-system-detail-options", response_model=MoldDictBundleRead)
async def get_drive_system_detail_dict_bundle(
    db: Annotated[AsyncSession, Depends(get_db)],
    _: Annotated[User, Depends(require_permissions("selection:read"))],
) -> MoldDictBundleRead:
    """驱动系统数据字典（截图/Excel），与扁平行 hrspec_valve_* 等规格字典独立或互补。"""
    from app.services.selection_dict_service import list_drive_system_detail_dict_options_bundle

    bundle = await list_drive_system_detail_dict_options_bundle(db)
    return MoldDictBundleRead(categories=bundle)


@router.get("/dict/categories", response_model=list[SelDictCategoryRead])
async def list_dict_categories(
    db: Annotated[AsyncSession, Depends(get_db)],
    _: Annotated[User, Depends(require_permissions("selection:read"))],
) -> list[SelDictCategoryRead]:
    result = await db.execute(select(SelDictCategory).order_by(SelDictCategory.sort_order))
    return [SelDictCategoryRead.model_validate(r) for r in result.scalars().all()]


@router.post("/dict/categories", response_model=SelDictCategoryRead, status_code=status.HTTP_201_CREATED)
async def create_dict_category(
    body: SelDictCategoryCreate,
    db: Annotated[AsyncSession, Depends(get_db)],
    _: Annotated[User, Depends(require_permissions("selection:write"))],
    require_code_prefix: Annotated[
        str | None,
        Query(description="若传入，则 body.code 必须以前缀开头（大类字典页防误操作）"),
    ] = None,
) -> SelDictCategory:
    code = body.code.strip()
    label = body.label.strip()
    pfx = _norm_code_prefix(require_code_prefix)
    if pfx is not None:
        _assert_code_has_prefix(code=code, prefix=pfx)
    dup = await db.execute(select(SelDictCategory.id).where(SelDictCategory.code == code))
    if dup.scalar_one_or_none() is not None:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="字典分类 code 已存在")
    row = SelDictCategory(code=code, label=label, sort_order=body.sort_order)
    db.add(row)
    await db.commit()
    await db.refresh(row)
    return row


@router.patch("/dict/categories/{category_id}", response_model=SelDictCategoryRead)
async def patch_dict_category(
    category_id: UUID,
    body: SelDictCategoryPatch,
    db: Annotated[AsyncSession, Depends(get_db)],
    _: Annotated[User, Depends(require_permissions("selection:write"))],
    require_code_prefix: Annotated[
        str | None,
        Query(description="若传入，则仅允许修改此前缀下的分类，且 code 仍须以前缀开头"),
    ] = None,
) -> SelDictCategory:
    cat = await db.get(SelDictCategory, category_id)
    if cat is None:
        raise HTTPException(status_code=404, detail="字典分类不存在")
    pfx = _norm_code_prefix(require_code_prefix)
    if pfx is not None:
        _assert_category_has_prefix(cat, pfx)
    data = body.model_dump(exclude_unset=True)
    if "code" in data and data["code"] is not None:
        new_code = str(data["code"]).strip()
        if pfx is not None:
            _assert_code_has_prefix(code=new_code, prefix=pfx)
        if new_code != cat.code:
            taken = await db.execute(
                select(SelDictCategory.id).where(SelDictCategory.code == new_code, SelDictCategory.id != category_id)
            )
            if taken.scalar_one_or_none() is not None:
                raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="字典分类 code 已存在")
        data["code"] = new_code
    if "label" in data and data["label"] is not None:
        data["label"] = str(data["label"]).strip()
    for k, v in data.items():
        setattr(cat, k, v)
    await db.commit()
    await db.refresh(cat)
    return cat


@router.delete("/dict/categories/{category_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_dict_category(
    category_id: UUID,
    db: Annotated[AsyncSession, Depends(get_db)],
    _: Annotated[User, Depends(require_permissions("selection:write"))],
    require_code_prefix: Annotated[
        str | None,
        Query(description="若传入，则仅允许删除此前缀下的空分类"),
    ] = None,
) -> None:
    """删除空分类（无字典项）。若分类下仍有字典项则返回 409。"""
    cat = await db.get(SelDictCategory, category_id)
    if cat is None:
        raise HTTPException(status_code=404, detail="字典分类不存在")
    pfx = _norm_code_prefix(require_code_prefix)
    if pfx is not None:
        _assert_category_has_prefix(cat, pfx)
    cnt = await db.scalar(select(func.count()).select_from(SelDictItem).where(SelDictItem.category_id == category_id))
    if (cnt or 0) > 0:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="该分类下仍有字典项，请先处理字典项后再删除分类",
        )
    await db.delete(cat)
    await db.commit()


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
