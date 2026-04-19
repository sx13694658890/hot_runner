"""
产品信息（sel_product_info）字典：分类 code 与 ORM 列名 * _id 对应。
"""

from __future__ import annotations

# (分类 code, 管理展示名, 排序, [选项文案])
SEL_PRODUCT_DICT_SEED: list[tuple[str, str, int, list[str]]] = [
    ("product_application_field", "应用领域", 300, ["汽车", "家电", "医疗", "日化", "美妆"]),
    ("product_wall_thickness", "平均肉厚", 310, ["厚壁件 (>3mm)", "常规件 (1-3mm)", "薄壁件 (<1mm)"]),
    ("product_color", "颜色", 320, ["黑色", "白色", "透明", "浅色", "换色"]),
    (
        "product_surface_finish",
        "外观",
        330,
        ["高亮", "晒纹", "皮纹", "细皮纹", "厚植绒", "薄植绒", "换色", "一般"],
    ),
    (
        "product_precision_level",
        "尺寸精度",
        340,
        ["精密件（公差±0.02mm）", "常规件（公差±0.1mm）"],
    ),
    ("product_mechanical_requirement", "力学要求", 350, ["承载件", "耐高温"]),
    ("product_efficiency_requirement", "生产效率", 360, ["快速", "一般"]),
    (
        "product_production_batch",
        "生产批量",
        370,
        ["大批量（≥10万模次）", "中批量（1万-10万模次）", "小批量（<1万模次）"],
    ),
]

# sel_product_info 列名 → 字典分类 code
PRODUCT_DICT_COLUMN_TO_CATEGORY: dict[str, str] = {
    "application_field_id": "product_application_field",
    "wall_thickness_id": "product_wall_thickness",
    "color_id": "product_color",
    "surface_finish_id": "product_surface_finish",
    "precision_level_id": "product_precision_level",
    "mechanical_requirement_id": "product_mechanical_requirement",
    "efficiency_requirement_id": "product_efficiency_requirement",
    "production_batch_id": "product_production_batch",
}
