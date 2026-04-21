"""SelMaterial ORM → API 读模型：属性行挂在塑料牌号上，接口仍返回「材料 + 代表性属性」。"""

from __future__ import annotations

from app.models.selection_catalog import SelMaterial, SelMaterialProperty
from app.schemas.selection_catalog import SelMaterialPropertyRead, SelMaterialRead


def first_grade_property_row(m: SelMaterial) -> SelMaterialProperty | None:
    """按排序取第一个带有属性行的塑料牌号（与列表下拉顺序一致）。"""
    grades = sorted(m.plastic_grades, key=lambda g: (g.sort_order, g.label or ""))
    for g in grades:
        if g.property_row is not None:
            return g.property_row
    return None


def sel_material_to_read(m: SelMaterial) -> SelMaterialRead:
    pr = first_grade_property_row(m)
    return SelMaterialRead(
        id=m.id,
        abbreviation=m.abbreviation,
        is_active=m.is_active,
        material_property=SelMaterialPropertyRead.model_validate(pr) if pr else None,
    )
