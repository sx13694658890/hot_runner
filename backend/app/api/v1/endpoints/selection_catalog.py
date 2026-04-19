"""模具选型领域表 REST API — 数据对齐 `sel_*` 与 docs/database_schema.sql；不调用 docs 下规则/引擎代码。"""

from __future__ import annotations

import re
from typing import Annotated
from urllib.parse import quote
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import Response
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.database import get_db
from app.deps import require_permissions
from app.models.selection_catalog import (
    SelAssociationRule,
    SelHotRunnerSystem,
    SelMaterial,
    SelMaterialProperty,
    SelMoldHotRunnerSpec,
    SelMoldInfo,
    SelNozzleConfig,
    SelProductInfo,
    SelValvePinConfig,
)
from app.models.user import User
from app.schemas.selection_catalog import (
    SelAssociationRuleRead,
    SelHotRunnerSystemListRead,
    SelMaterialMasterRead,
    SelMaterialPropertyFlatRead,
    SelMaterialRead,
    SelMoldHotRunnerSpecListRead,
    SelMoldHotRunnerSpecPage,
    SelMoldHotRunnerSpecPatch,
    SelMoldInfoCreate,
    SelMoldInfoPatch,
    SelMoldInfoRead,
    SelNozzleListRead,
    SelProductInfoListRead,
    SelValvePinListRead,
)
from app.services.selection_catalog_service import (
    create_mold_bundle,
    get_mold_loaded,
    patch_mold_bundle,
)
from app.services.selection_dict_service import (
    enrich_hrspec_flat_with_labels,
    enrich_mold_flat_with_labels,
    enrich_product_flat_with_labels,
    validate_hrspec_dict_fk_payload,
    validate_mold_dict_fk_payload,
    validate_mold_material_fk_payload,
    validate_product_dict_fk_payload,
)

router = APIRouter()


def _paginate(skip: int, limit: int) -> tuple[int, int]:
    return max(skip, 0), min(max(limit, 1), 500)


async def _hrspec_row_to_list_read(
    db: AsyncSession,
    spec: SelMoldHotRunnerSpec,
    mold_number: str | None,
    mold_manufacturer: str | None,
) -> SelMoldHotRunnerSpecListRead:
    row = {c.key: getattr(spec, c.key) for c in SelMoldHotRunnerSpec.__table__.columns}
    row["mold_number"] = mold_number
    row["mold_manufacturer"] = mold_manufacturer
    await enrich_hrspec_flat_with_labels(db, row)
    return SelMoldHotRunnerSpecListRead.model_validate(row)


async def _mold_to_read(db: AsyncSession, m: SelMoldInfo) -> SelMoldInfoRead:
    flat = {c.key: getattr(m, c.key) for c in SelMoldInfo.__table__.columns}
    await enrich_mold_flat_with_labels(db, flat)
    if m.product:
        pd = {c.key: getattr(m.product, c.key) for c in SelProductInfo.__table__.columns}
        await enrich_product_flat_with_labels(db, pd)
        flat["product"] = pd
    else:
        flat["product"] = None
    hr = m.hot_runner
    if hr:
        flat["hot_runner"] = {
            **{c.key: getattr(hr, c.key) for c in SelHotRunnerSystem.__table__.columns},
            "nozzles": list(hr.nozzles),
            "valve_pin": hr.valve_pin,
        }
    else:
        flat["hot_runner"] = None
    if m.material is not None:
        flat["material"] = SelMaterialRead.model_validate(m.material)
    else:
        flat["material"] = None
    return SelMoldInfoRead.model_validate(flat)


@router.get("/materials", response_model=list[SelMaterialRead])
async def list_materials(
    db: Annotated[AsyncSession, Depends(get_db)],
    _: Annotated[User, Depends(require_permissions("selection:read"))],
) -> list[SelMaterial]:
    result = await db.execute(
        select(SelMaterial)
        .where(SelMaterial.is_active.is_(True))
        .options(selectinload(SelMaterial.property_row))
        .order_by(SelMaterial.abbreviation)
    )
    return list(result.scalars().all())


@router.get("/materials-master", response_model=list[SelMaterialMasterRead])
async def list_materials_master(
    db: Annotated[AsyncSession, Depends(get_db)],
    _: Annotated[User, Depends(require_permissions("selection:read"))],
    skip: int = 0,
    limit: int = 200,
) -> list[SelMaterialMasterRead]:
    """材料主表 `sel_material`（不含属性），便于与属性分表对照。"""
    sk, lm = _paginate(skip, limit)
    result = await db.execute(
        select(SelMaterial)
        .where(SelMaterial.is_active.is_(True))
        .order_by(SelMaterial.abbreviation)
        .offset(sk)
        .limit(lm)
    )
    return [SelMaterialMasterRead.model_validate(m) for m in result.scalars().all()]


@router.get("/material-properties", response_model=list[SelMaterialPropertyFlatRead])
async def list_material_properties_flat(
    db: Annotated[AsyncSession, Depends(get_db)],
    _: Annotated[User, Depends(require_permissions("selection:read"))],
    skip: int = 0,
    limit: int = 200,
) -> list[SelMaterialPropertyFlatRead]:
    """材料属性表扁平行，附材料缩写。"""
    sk, lm = _paginate(skip, limit)
    stmt = (
        select(SelMaterialProperty, SelMaterial.abbreviation)
        .join(SelMaterial, SelMaterialProperty.material_id == SelMaterial.id)
        .where(SelMaterial.is_active.is_(True))
        .order_by(SelMaterial.abbreviation)
        .offset(sk)
        .limit(lm)
    )
    result = await db.execute(stmt)
    out: list[SelMaterialPropertyFlatRead] = []
    for prop, abbrev in result.all():
        row = {c.key: getattr(prop, c.key) for c in SelMaterialProperty.__table__.columns}
        row["abbreviation"] = abbrev
        out.append(SelMaterialPropertyFlatRead.model_validate(row))
    return out


@router.get("/product-infos", response_model=list[SelProductInfoListRead])
async def list_product_infos(
    db: Annotated[AsyncSession, Depends(get_db)],
    _: Annotated[User, Depends(require_permissions("selection:read"))],
    skip: int = 0,
    limit: int = 200,
) -> list[SelProductInfoListRead]:
    """产品信息表 + 模具业务编号/制造商。"""
    sk, lm = _paginate(skip, limit)
    stmt = (
        select(SelProductInfo, SelMoldInfo.mold_id, SelMoldInfo.manufacturer)
        .join(SelMoldInfo, SelProductInfo.mold_info_id == SelMoldInfo.id)
        .order_by(SelMoldInfo.mold_id.nulls_last())
        .offset(sk)
        .limit(lm)
    )
    result = await db.execute(stmt)
    out: list[SelProductInfoListRead] = []
    for p, mold_number, mold_manufacturer in result.all():
        row = {
            **{c.key: getattr(p, c.key) for c in SelProductInfo.__table__.columns},
            "mold_number": mold_number,
            "mold_manufacturer": mold_manufacturer,
        }
        await enrich_product_flat_with_labels(db, row)
        out.append(SelProductInfoListRead.model_validate(row))
    return out


@router.get("/hot-runner-systems", response_model=list[SelHotRunnerSystemListRead])
async def list_hot_runner_systems(
    db: Annotated[AsyncSession, Depends(get_db)],
    _: Annotated[User, Depends(require_permissions("selection:read"))],
    skip: int = 0,
    limit: int = 200,
) -> list[SelHotRunnerSystemListRead]:
    """热流道系统表扁平行 + 模具标识。"""
    sk, lm = _paginate(skip, limit)
    stmt = (
        select(SelHotRunnerSystem, SelMoldInfo.mold_id, SelMoldInfo.manufacturer)
        .join(SelMoldInfo, SelHotRunnerSystem.mold_info_id == SelMoldInfo.id)
        .order_by(SelMoldInfo.mold_id.nulls_last())
        .offset(sk)
        .limit(lm)
    )
    result = await db.execute(stmt)
    out: list[SelHotRunnerSystemListRead] = []
    for hr, mold_number, mold_manufacturer in result.all():
        row = {c.key: getattr(hr, c.key) for c in SelHotRunnerSystem.__table__.columns}
        row["mold_number"] = mold_number
        row["mold_manufacturer"] = mold_manufacturer
        out.append(SelHotRunnerSystemListRead.model_validate(row))
    return out


@router.get("/mold-hot-runner-specs", response_model=SelMoldHotRunnerSpecPage)
async def list_mold_hot_runner_specs(
    db: Annotated[AsyncSession, Depends(get_db)],
    _: Annotated[User, Depends(require_permissions("selection:read"))],
    skip: int = 0,
    limit: int = 50,
    q: str | None = None,
) -> SelMoldHotRunnerSpecPage:
    """模具热流道规格列表（分页）；q 按模具号 mold_id 模糊匹配。"""
    sk, lm = _paginate(skip, limit)
    base_join = SelMoldHotRunnerSpec.mold_info_id == SelMoldInfo.id
    count_stmt = select(func.count()).select_from(SelMoldHotRunnerSpec).join(SelMoldInfo, base_join)
    stmt = (
        select(SelMoldHotRunnerSpec, SelMoldInfo.mold_id, SelMoldInfo.manufacturer)
        .join(SelMoldInfo, base_join)
        .order_by(SelMoldInfo.mold_id.nulls_last(), SelMoldHotRunnerSpec.updated_at.desc())
        .offset(sk)
        .limit(lm)
    )
    if q and q.strip():
        pat = f"%{q.strip()}%"
        count_stmt = count_stmt.where(SelMoldInfo.mold_id.ilike(pat))
        stmt = stmt.where(SelMoldInfo.mold_id.ilike(pat))
    total = int(await db.scalar(count_stmt) or 0)
    result = await db.execute(stmt)
    items: list[SelMoldHotRunnerSpecListRead] = []
    for spec, mold_number, mold_manufacturer in result.all():
        items.append(await _hrspec_row_to_list_read(db, spec, mold_number, mold_manufacturer))
    return SelMoldHotRunnerSpecPage(items=items, total=total)


@router.get("/mold-hot-runner-specs/{spec_id}", response_model=SelMoldHotRunnerSpecListRead)
async def get_mold_hot_runner_spec(
    spec_id: UUID,
    db: Annotated[AsyncSession, Depends(get_db)],
    _: Annotated[User, Depends(require_permissions("selection:read"))],
) -> SelMoldHotRunnerSpecListRead:
    stmt = (
        select(SelMoldHotRunnerSpec, SelMoldInfo.mold_id, SelMoldInfo.manufacturer)
        .join(SelMoldInfo, SelMoldHotRunnerSpec.mold_info_id == SelMoldInfo.id)
        .where(SelMoldHotRunnerSpec.id == spec_id)
    )
    result = await db.execute(stmt)
    row_tuple = result.one_or_none()
    if row_tuple is None:
        raise HTTPException(status_code=404, detail="热流道规格不存在")
    spec, mold_number, mold_manufacturer = row_tuple
    return await _hrspec_row_to_list_read(db, spec, mold_number, mold_manufacturer)


@router.get("/mold-hot-runner-specs/{spec_id}/export.pdf")
async def export_mold_hot_runner_spec_pdf(
    spec_id: UUID,
    db: Annotated[AsyncSession, Depends(get_db)],
    _: Annotated[User, Depends(require_permissions("selection:read"))],
) -> Response:
    """导出热流道规格详情为 PDF（附件下载）。"""
    from app.services.hrspec_pdf_service import build_hot_runner_spec_pdf

    stmt = (
        select(SelMoldHotRunnerSpec, SelMoldInfo.mold_id, SelMoldInfo.manufacturer)
        .join(SelMoldInfo, SelMoldHotRunnerSpec.mold_info_id == SelMoldInfo.id)
        .where(SelMoldHotRunnerSpec.id == spec_id)
    )
    result = await db.execute(stmt)
    row_tuple = result.one_or_none()
    if row_tuple is None:
        raise HTTPException(status_code=404, detail="热流道规格不存在")
    spec, mold_number, mold_manufacturer = row_tuple
    read = await _hrspec_row_to_list_read(db, spec, mold_number, mold_manufacturer)
    flat = read.model_dump(mode="json")
    pdf_bytes = build_hot_runner_spec_pdf(flat)
    mold_no = flat.get("mold_number") or ""
    ascii_name = re.sub(r"[^A-Za-z0-9._-]+", "_", str(mold_no))[:60] or f"spec_{spec_id}"
    utf_name = f"热流道规格_{mold_no or spec_id}.pdf"
    cd = (
        f'attachment; filename="{ascii_name}.pdf"; '
        f"filename*=UTF-8''{quote(utf_name)}"
    )
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": cd},
    )


@router.patch("/mold-hot-runner-specs/{spec_id}", response_model=SelMoldHotRunnerSpecListRead)
async def patch_mold_hot_runner_spec(
    spec_id: UUID,
    body: SelMoldHotRunnerSpecPatch,
    db: Annotated[AsyncSession, Depends(get_db)],
    _: Annotated[User, Depends(require_permissions("selection:write"))],
) -> SelMoldHotRunnerSpecListRead:
    result = await db.execute(select(SelMoldHotRunnerSpec).where(SelMoldHotRunnerSpec.id == spec_id))
    spec = result.scalar_one_or_none()
    if spec is None:
        raise HTTPException(status_code=404, detail="热流道规格不存在")
    patch = body.model_dump(exclude_unset=True)
    await validate_hrspec_dict_fk_payload(db, patch)
    for k, v in patch.items():
        setattr(spec, k, v)
    await db.commit()
    await db.refresh(spec)
    mold_r = await db.execute(select(SelMoldInfo.mold_id, SelMoldInfo.manufacturer).where(SelMoldInfo.id == spec.mold_info_id))
    mold_number, mold_manufacturer = mold_r.one()
    return await _hrspec_row_to_list_read(db, spec, mold_number, mold_manufacturer)


@router.delete("/mold-hot-runner-specs/{spec_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_mold_hot_runner_spec(
    spec_id: UUID,
    db: Annotated[AsyncSession, Depends(get_db)],
    _: Annotated[User, Depends(require_permissions("selection:write"))],
) -> None:
    result = await db.execute(select(SelMoldHotRunnerSpec).where(SelMoldHotRunnerSpec.id == spec_id))
    spec = result.scalar_one_or_none()
    if spec is None:
        raise HTTPException(status_code=404, detail="热流道规格不存在")
    await db.delete(spec)
    await db.commit()


@router.get("/nozzle-configs", response_model=list[SelNozzleListRead])
async def list_nozzle_configs(
    db: Annotated[AsyncSession, Depends(get_db)],
    _: Annotated[User, Depends(require_permissions("selection:read"))],
    skip: int = 0,
    limit: int = 500,
) -> list[SelNozzleListRead]:
    """热咀配置扁平行 + 模具上下文。"""
    sk, lm = _paginate(skip, limit)
    stmt = (
        select(SelNozzleConfig, SelMoldInfo.mold_id, SelMoldInfo.manufacturer)
        .join(SelHotRunnerSystem, SelNozzleConfig.hot_runner_id == SelHotRunnerSystem.id)
        .join(SelMoldInfo, SelHotRunnerSystem.mold_info_id == SelMoldInfo.id)
        .order_by(SelMoldInfo.mold_id.nulls_last(), SelNozzleConfig.nozzle_index)
        .offset(sk)
        .limit(lm)
    )
    result = await db.execute(stmt)
    out: list[SelNozzleListRead] = []
    for nz, mold_number, mold_manufacturer in result.all():
        row = {c.key: getattr(nz, c.key) for c in SelNozzleConfig.__table__.columns}
        row["mold_number"] = mold_number
        row["mold_manufacturer"] = mold_manufacturer
        out.append(SelNozzleListRead.model_validate(row))
    return out


@router.get("/valve-pin-configs", response_model=list[SelValvePinListRead])
async def list_valve_pin_configs(
    db: Annotated[AsyncSession, Depends(get_db)],
    _: Annotated[User, Depends(require_permissions("selection:read"))],
    skip: int = 0,
    limit: int = 200,
) -> list[SelValvePinListRead]:
    """阀针配置扁平行 + 模具上下文。"""
    sk, lm = _paginate(skip, limit)
    stmt = (
        select(SelValvePinConfig, SelMoldInfo.mold_id, SelMoldInfo.manufacturer)
        .join(SelHotRunnerSystem, SelValvePinConfig.hot_runner_id == SelHotRunnerSystem.id)
        .join(SelMoldInfo, SelHotRunnerSystem.mold_info_id == SelMoldInfo.id)
        .order_by(SelMoldInfo.mold_id.nulls_last())
        .offset(sk)
        .limit(lm)
    )
    result = await db.execute(stmt)
    out: list[SelValvePinListRead] = []
    for vp, mold_number, mold_manufacturer in result.all():
        row = {c.key: getattr(vp, c.key) for c in SelValvePinConfig.__table__.columns}
        row["mold_number"] = mold_number
        row["mold_manufacturer"] = mold_manufacturer
        out.append(SelValvePinListRead.model_validate(row))
    return out


@router.get("/materials/by-abbrev/{abbreviation}", response_model=SelMaterialRead)
async def get_material_by_abbrev(
    abbreviation: str,
    db: Annotated[AsyncSession, Depends(get_db)],
    _: Annotated[User, Depends(require_permissions("selection:read"))],
) -> SelMaterial:
    result = await db.execute(
        select(SelMaterial)
        .where(SelMaterial.abbreviation == abbreviation)
        .options(selectinload(SelMaterial.property_row))
    )
    row = result.scalar_one_or_none()
    if row is None:
        raise HTTPException(status_code=404, detail="材料不存在")
    return row


@router.get("/association-rules", response_model=list[SelAssociationRuleRead])
async def list_association_rules(
    db: Annotated[AsyncSession, Depends(get_db)],
    _: Annotated[User, Depends(require_permissions("selection:read"))],
) -> list[SelAssociationRule]:
    result = await db.execute(
        select(SelAssociationRule).where(SelAssociationRule.is_active.is_(True)).order_by(SelAssociationRule.priority)
    )
    return list(result.scalars().all())


@router.get("/mold-infos", response_model=list[SelMoldInfoRead])
async def list_mold_infos(
    db: Annotated[AsyncSession, Depends(get_db)],
    _: Annotated[User, Depends(require_permissions("selection:read"))],
    skip: int = 0,
    limit: int = 100,
) -> list[SelMoldInfoRead]:
    result = await db.execute(
        select(SelMoldInfo)
        .order_by(SelMoldInfo.created_at.desc())
        .offset(max(skip, 0))
        .limit(min(max(limit, 1), 500))
    )
    out: list[SelMoldInfoRead] = []
    for m in result.scalars().all():
        flat = {
            **{c.key: getattr(m, c.key) for c in SelMoldInfo.__table__.columns},
            "product": None,
            "hot_runner": None,
            "material": None,
        }
        await enrich_mold_flat_with_labels(db, flat)
        out.append(SelMoldInfoRead.model_validate(flat))
    return out


@router.get("/mold-infos/{mold_id}", response_model=SelMoldInfoRead)
async def get_mold_info(
    mold_id: UUID,
    db: Annotated[AsyncSession, Depends(get_db)],
    _: Annotated[User, Depends(require_permissions("selection:read"))],
) -> SelMoldInfoRead:
    m = await get_mold_loaded(db, mold_id)
    if m is None:
        raise HTTPException(status_code=404, detail="模具记录不存在")
    return await _mold_to_read(db, m)


@router.post("/mold-infos", response_model=SelMoldInfoRead, status_code=status.HTTP_201_CREATED)
async def create_mold_info(
    body: SelMoldInfoCreate,
    db: Annotated[AsyncSession, Depends(get_db)],
    _: Annotated[User, Depends(require_permissions("selection:write"))],
) -> SelMoldInfoRead:
    flat = body.model_dump(exclude={"product", "hot_runner"})
    await validate_mold_dict_fk_payload(db, flat)
    await validate_mold_material_fk_payload(db, flat)
    if body.product is not None:
        await validate_product_dict_fk_payload(db, body.product.model_dump())
    m = await create_mold_bundle(db, body)
    loaded = await get_mold_loaded(db, m.id)
    assert loaded is not None
    return await _mold_to_read(db, loaded)


@router.patch("/mold-infos/{mold_id}", response_model=SelMoldInfoRead)
async def patch_mold_info(
    mold_id: UUID,
    body: SelMoldInfoPatch,
    db: Annotated[AsyncSession, Depends(get_db)],
    _: Annotated[User, Depends(require_permissions("selection:write"))],
) -> SelMoldInfoRead:
    m = await db.get(SelMoldInfo, mold_id)
    if m is None:
        raise HTTPException(status_code=404, detail="模具记录不存在")
    patch_flat = body.model_dump(exclude={"product", "hot_runner"}, exclude_unset=True)
    await validate_mold_dict_fk_payload(db, patch_flat)
    await validate_mold_material_fk_payload(db, patch_flat)
    if body.product is not None:
        await validate_product_dict_fk_payload(db, body.product.model_dump(exclude_unset=True))
    await patch_mold_bundle(db, m, body)
    loaded = await get_mold_loaded(db, mold_id)
    assert loaded is not None
    return await _mold_to_read(db, loaded)


@router.delete("/mold-infos/{mold_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_mold_info(
    mold_id: UUID,
    db: Annotated[AsyncSession, Depends(get_db)],
    _: Annotated[User, Depends(require_permissions("selection:write"))],
) -> None:
    m = await db.get(SelMoldInfo, mold_id)
    if m is None:
        raise HTTPException(status_code=404, detail="模具记录不存在")
    await db.delete(m)
    await db.commit()
