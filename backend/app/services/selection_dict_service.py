"""选型字典：校验、标签解析。"""

from __future__ import annotations

from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.constants.sel_hrspec_dict import HR_SPEC_DICT_COLUMN_TO_CATEGORY, HRSPEC_CATEGORY_CODES
from app.constants.sel_drive_system_detail_dict import DRIVE_SYSTEM_DETAIL_CATEGORY_CODES
from app.constants.sel_hot_nozzle_detail_dict import HOT_NOZZLE_DETAIL_CATEGORY_CODES
from app.constants.sel_main_nozzle_detail_dict import MAIN_NOZZLE_DETAIL_CATEGORY_CODES
from app.constants.sel_manifold_detail_dict import MANIFOLD_DETAIL_CATEGORY_CODES
from app.constants.sel_mold_dict import MOLD_DICT_COLUMN_TO_CATEGORY
from app.constants.sel_product_dict import PRODUCT_DICT_COLUMN_TO_CATEGORY
from app.models.selection_catalog import SelDictCategory, SelDictItem, SelMaterial


async def validate_mold_material_fk_payload(db: AsyncSession, flat: dict) -> None:
    """校验 mold material_id 指向启用中的 sel_material。"""
    from fastapi import HTTPException, status

    if "material_id" not in flat:
        return
    mid = flat.get("material_id")
    if mid is None:
        return
    result = await db.execute(
        select(SelMaterial.id).where(SelMaterial.id == mid, SelMaterial.is_active.is_(True))
    )
    if result.scalar_one_or_none() is None:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="材料不存在或已停用")


async def assert_dict_item_belongs_to(
    db: AsyncSession,
    *,
    item_id: UUID | None,
    category_code: str,
) -> None:
    from fastapi import HTTPException, status

    if item_id is None:
        return
    stmt = (
        select(SelDictItem.id)
        .join(SelDictCategory, SelDictItem.category_id == SelDictCategory.id)
        .where(
            SelDictItem.id == item_id,
            SelDictCategory.code == category_code,
            SelDictItem.is_active.is_(True),
        )
    )
    result = await db.execute(stmt)
    if result.scalar_one_or_none() is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"字典项不属于分类 {category_code} 或已停用",
        )


async def validate_mold_dict_fk_payload(db: AsyncSession, flat: dict) -> None:
    """校验 mold create/patch 中与字典关联的 UUID 字段。"""
    for col_name, cat_code in MOLD_DICT_COLUMN_TO_CATEGORY.items():
        if col_name not in flat:
            continue
        await assert_dict_item_belongs_to(db, item_id=flat.get(col_name), category_code=cat_code)


async def validate_product_dict_fk_payload(db: AsyncSession, flat: dict) -> None:
    """校验 sel_product_info 写入中的字典 UUID 字段。"""
    for col_name, cat_code in PRODUCT_DICT_COLUMN_TO_CATEGORY.items():
        if col_name not in flat:
            continue
        await assert_dict_item_belongs_to(db, item_id=flat.get(col_name), category_code=cat_code)


async def validate_hrspec_dict_fk_payload(db: AsyncSession, flat: dict) -> None:
    """校验 sel_mold_hot_runner_spec PATCH 中的字典 UUID 字段。"""
    for col_name, cat_code in HR_SPEC_DICT_COLUMN_TO_CATEGORY.items():
        if col_name not in flat:
            continue
        await assert_dict_item_belongs_to(db, item_id=flat.get(col_name), category_code=cat_code)


async def fetch_labels_for_ids(db: AsyncSession, ids: list[UUID]) -> dict[UUID, str]:
    if not ids:
        return {}
    uniq = list({i for i in ids})
    result = await db.execute(select(SelDictItem.id, SelDictItem.label).where(SelDictItem.id.in_(uniq)))
    return {row.id: row.label for row in result.all()}


async def enrich_mold_flat_with_labels(db: AsyncSession, flat: dict) -> dict:
    """为 sel_mold_info 扁平行 dict 附加每个字典字段的 *_label。"""
    ids: list[UUID] = []
    fk_fields = list(MOLD_DICT_COLUMN_TO_CATEGORY.keys())
    for fk in fk_fields:
        uid = flat.get(fk)
        if uid is not None:
            ids.append(uid)
    label_map = await fetch_labels_for_ids(db, ids)
    for fk in fk_fields:
        lk = fk[:-3] + "_label" if fk.endswith("_id") else fk + "_label"
        uid = flat.get(fk)
        if uid is None:
            flat[lk] = None
        else:
            flat[lk] = label_map.get(uid)
    return flat


async def enrich_product_flat_with_labels(db: AsyncSession, flat: dict) -> dict:
    """为 sel_product_info 扁平行 dict 附加每个字典字段的 *_label。"""
    ids: list[UUID] = []
    for fk in PRODUCT_DICT_COLUMN_TO_CATEGORY:
        uid = flat.get(fk)
        if uid is not None:
            ids.append(uid)
    label_map = await fetch_labels_for_ids(db, ids)
    for fk in PRODUCT_DICT_COLUMN_TO_CATEGORY:
        lk = fk[:-3] + "_label" if fk.endswith("_id") else fk + "_label"
        uid = flat.get(fk)
        if uid is None:
            flat[lk] = None
        else:
            flat[lk] = label_map.get(uid)
    return flat


async def list_mold_dict_options_bundle(db: AsyncSession) -> dict[str, list[dict[str, object]]]:
    """category_code → [{ id, label, sort_order }]（仅启用项）。"""
    stmt = (
        select(SelDictCategory.code, SelDictItem.id, SelDictItem.label, SelDictItem.sort_order)
        .join(SelDictItem, SelDictItem.category_id == SelDictCategory.id)
        .where(SelDictItem.is_active.is_(True))
        .order_by(SelDictCategory.sort_order, SelDictItem.sort_order, SelDictItem.label)
    )
    rows = (await db.execute(stmt)).all()
    bundle: dict[str, list[dict[str, object]]] = {}
    for code, iid, lbl, so in rows:
        bundle.setdefault(code, []).append({"id": iid, "label": lbl, "sort_order": so})
    return bundle


async def list_hrspec_dict_options_bundle(db: AsyncSession) -> dict[str, list[dict[str, object]]]:
    """热流道规格相关 category_code → [{ id, label, sort_order }]（仅启用项）。"""
    stmt = (
        select(SelDictCategory.code, SelDictItem.id, SelDictItem.label, SelDictItem.sort_order)
        .join(SelDictItem, SelDictItem.category_id == SelDictCategory.id)
        .where(
            SelDictCategory.code.in_(HRSPEC_CATEGORY_CODES),
            SelDictItem.is_active.is_(True),
        )
        .order_by(SelDictCategory.sort_order, SelDictItem.sort_order, SelDictItem.label)
    )
    rows = (await db.execute(stmt)).all()
    bundle: dict[str, list[dict[str, object]]] = {}
    for code, iid, lbl, so in rows:
        bundle.setdefault(code, []).append({"id": iid, "label": lbl, "sort_order": so})
    return bundle


async def list_manifold_detail_dict_options_bundle(db: AsyncSession) -> dict[str, list[dict[str, object]]]:
    """分流板截图/Excel 扩展字典（code 前缀 hrspec_mfld_）→ 选项列表，仅启用项。"""
    stmt = (
        select(SelDictCategory.code, SelDictItem.id, SelDictItem.label, SelDictItem.sort_order)
        .join(SelDictItem, SelDictItem.category_id == SelDictCategory.id)
        .where(
            SelDictCategory.code.in_(MANIFOLD_DETAIL_CATEGORY_CODES),
            SelDictItem.is_active.is_(True),
        )
        .order_by(SelDictCategory.sort_order, SelDictItem.sort_order, SelDictItem.label)
    )
    rows = (await db.execute(stmt)).all()
    bundle: dict[str, list[dict[str, object]]] = {}
    for code, iid, lbl, so in rows:
        bundle.setdefault(code, []).append({"id": iid, "label": lbl, "sort_order": so})
    return bundle


async def list_main_nozzle_detail_dict_options_bundle(db: AsyncSession) -> dict[str, list[dict[str, object]]]:
    """主射咀大类截图/Excel 扩展字典（code 前缀 hrspec_mnz_）→ 选项列表，仅启用项。"""
    stmt = (
        select(SelDictCategory.code, SelDictItem.id, SelDictItem.label, SelDictItem.sort_order)
        .join(SelDictItem, SelDictItem.category_id == SelDictCategory.id)
        .where(
            SelDictCategory.code.in_(MAIN_NOZZLE_DETAIL_CATEGORY_CODES),
            SelDictItem.is_active.is_(True),
        )
        .order_by(SelDictCategory.sort_order, SelDictItem.sort_order, SelDictItem.label)
    )
    rows = (await db.execute(stmt)).all()
    bundle: dict[str, list[dict[str, object]]] = {}
    for code, iid, lbl, so in rows:
        bundle.setdefault(code, []).append({"id": iid, "label": lbl, "sort_order": so})
    return bundle


async def list_hot_nozzle_detail_dict_options_bundle(db: AsyncSession) -> dict[str, list[dict[str, object]]]:
    """热咀大类截图/Excel 扩展字典（code 前缀 hrspec_hnz_）→ 选项列表，仅启用项。"""
    stmt = (
        select(SelDictCategory.code, SelDictItem.id, SelDictItem.label, SelDictItem.sort_order)
        .join(SelDictItem, SelDictItem.category_id == SelDictCategory.id)
        .where(
            SelDictCategory.code.in_(HOT_NOZZLE_DETAIL_CATEGORY_CODES),
            SelDictItem.is_active.is_(True),
        )
        .order_by(SelDictCategory.sort_order, SelDictItem.sort_order, SelDictItem.label)
    )
    rows = (await db.execute(stmt)).all()
    bundle: dict[str, list[dict[str, object]]] = {}
    for code, iid, lbl, so in rows:
        bundle.setdefault(code, []).append({"id": iid, "label": lbl, "sort_order": so})
    return bundle


async def list_drive_system_detail_dict_options_bundle(db: AsyncSession) -> dict[str, list[dict[str, object]]]:
    """驱动系统截图/Excel 扩展字典（code 前缀 hrspec_drv_）→ 选项列表，仅启用项。"""
    stmt = (
        select(SelDictCategory.code, SelDictItem.id, SelDictItem.label, SelDictItem.sort_order)
        .join(SelDictItem, SelDictItem.category_id == SelDictCategory.id)
        .where(
            SelDictCategory.code.in_(DRIVE_SYSTEM_DETAIL_CATEGORY_CODES),
            SelDictItem.is_active.is_(True),
        )
        .order_by(SelDictCategory.sort_order, SelDictItem.sort_order, SelDictItem.label)
    )
    rows = (await db.execute(stmt)).all()
    bundle: dict[str, list[dict[str, object]]] = {}
    for code, iid, lbl, so in rows:
        bundle.setdefault(code, []).append({"id": iid, "label": lbl, "sort_order": so})
    return bundle


async def enrich_hrspec_flat_with_labels(db: AsyncSession, flat: dict) -> dict:
    """为 sel_mold_hot_runner_spec 扁平行 dict 附加每个字典字段的 *_label。"""
    ids: list[UUID] = []
    for fk in HR_SPEC_DICT_COLUMN_TO_CATEGORY:
        uid = flat.get(fk)
        if uid is not None:
            ids.append(uid)
    label_map = await fetch_labels_for_ids(db, ids)
    for fk in HR_SPEC_DICT_COLUMN_TO_CATEGORY:
        lk = fk[:-3] + "_label" if fk.endswith("_id") else fk + "_label"
        uid = flat.get(fk)
        if uid is None:
            flat[lk] = None
        else:
            flat[lk] = label_map.get(uid)
    return flat
