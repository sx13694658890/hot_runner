"""模具选型领域：创建 / 更新聚合（不写入选型引擎 docs/*.py）。"""

from __future__ import annotations

from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.selection_catalog import (
    SelHotRunnerSystem,
    SelInjectionMachineModel,
    SelMaterial,
    SelMoldInfo,
    SelNozzleConfig,
    SelPlasticGrade,
    SelProductInfo,
    SelValvePinConfig,
)
from app.schemas.selection_catalog import SelHotRunnerWrite, SelMoldInfoCreate, SelMoldInfoPatch


async def create_mold_bundle(
    db: AsyncSession, body: SelMoldInfoCreate, *, root_flat: dict | None = None
) -> SelMoldInfo:
    flat = root_flat if root_flat is not None else body.model_dump(exclude={"product", "hot_runner"})
    mold = SelMoldInfo(**flat)
    db.add(mold)
    await db.flush()

    if body.product:
        db.add(SelProductInfo(mold_info_id=mold.id, **body.product.model_dump(exclude_unset=True)))
    if body.hot_runner:
        await _add_hot_runner(db, mold.id, body.hot_runner)

    await db.commit()
    await db.refresh(mold)
    return mold


async def _add_hot_runner(db: AsyncSession, mold_info_id, hr: SelHotRunnerWrite) -> None:
    hr_data = hr.model_dump(exclude={"nozzles", "valve_pin"})
    sys = SelHotRunnerSystem(mold_info_id=mold_info_id, **hr_data)
    db.add(sys)
    await db.flush()
    for nz in hr.nozzles:
        nd = nz.model_dump()
        db.add(SelNozzleConfig(hot_runner_id=sys.id, **nd))
    if hr.valve_pin:
        db.add(SelValvePinConfig(hot_runner_id=sys.id, **hr.valve_pin.model_dump(exclude_unset=True)))


async def patch_mold_bundle(
    db: AsyncSession, mold: SelMoldInfo, body: SelMoldInfoPatch, *, root_flat: dict | None = None
) -> SelMoldInfo:
    flat = (
        root_flat
        if root_flat is not None
        else body.model_dump(exclude={"product", "hot_runner"}, exclude_unset=True)
    )
    for k, v in flat.items():
        setattr(mold, k, v)

    if body.product is not None:
        existing = await db.execute(select(SelProductInfo).where(SelProductInfo.mold_info_id == mold.id))
        row = existing.scalar_one_or_none()
        pdata = body.product.model_dump(exclude_unset=True)
        if row is None:
            db.add(SelProductInfo(mold_info_id=mold.id, **pdata))
        else:
            for k, v in pdata.items():
                setattr(row, k, v)

    if body.hot_runner is not None:
        await db.execute(delete(SelHotRunnerSystem).where(SelHotRunnerSystem.mold_info_id == mold.id))
        await db.flush()
        await _add_hot_runner(db, mold.id, body.hot_runner)

    await db.commit()
    await db.refresh(mold)
    return mold


async def get_mold_loaded(db: AsyncSession, mold_id) -> SelMoldInfo | None:
    result = await db.execute(
        select(SelMoldInfo)
        .where(SelMoldInfo.id == mold_id)
        .options(
            selectinload(SelMoldInfo.material).selectinload(SelMaterial.plastic_grades).selectinload(
                SelPlasticGrade.property_row
            ),
            selectinload(SelMoldInfo.injection_machine_catalog_model).selectinload(
                SelInjectionMachineModel.spec
            ),
            selectinload(SelMoldInfo.product),
            selectinload(SelMoldInfo.hot_runner).selectinload(SelHotRunnerSystem.nozzles),
            selectinload(SelMoldInfo.hot_runner).selectinload(SelHotRunnerSystem.valve_pin),
        )
    )
    return result.scalar_one_or_none()
