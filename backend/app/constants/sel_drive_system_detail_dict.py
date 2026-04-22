"""驱动系统 Excel/截图 扩展字典 → sel_dict_category.code 前缀 hrspec_drv_。

与扁平行阀针/阀针镀层等 hrspec_valve_* 规格字段独立；气缸板上开孔的驱动器按 HS40/FEP30/VC58～VC88 分型号存 BOM 零件选项。
"""

from __future__ import annotations

_PHI_SLEEVE = ["φ3", "φ4", "φ5", "φ6", "φ8", "φ10"]

_BOM_HS_VC = ["缸盖", "缸体", "活塞", "挂针块", "调节块"]
_BOM_FEP30 = ["缸盖", "缸体", "活塞", "挂针块", "调节块", "活塞外套"]

# (code, 分类显示名, sort_order, [选项 label])
SEL_DRIVE_SYSTEM_DICT_SEED: list[tuple[str, str, int, list[str]]] = [
    (
        "hrspec_drv_valve_pin_spec",
        "阀针-阀针规格",
        8300,
        ["φ3-Φ1.0", "φ3-Φ1.5", "φ4-Φ1.5", "φ4-Φ2.0"],
    ),
    ("hrspec_drv_valve_pin_material", "阀针-阀针材质", 8301, ["SKD61", "SKH51", "H13"]),
    (
        "hrspec_drv_valve_pin_coating",
        "阀针-阀针镀层工艺",
        8302,
        [
            "氮化钛",
            "氟化铬",
            "氮化铬",
            "类金刚石",
            "氮化钛铝",
            "氮化铬铝",
            "氮化钛+类金刚石",
            "氮化铬+类金刚石",
            "氮化硅钛",
        ],
    ),
    ("hrspec_drv_sleeve_regular", "阀套-常规阀套", 8303, list(_PHI_SLEEVE)),
    ("hrspec_drv_sleeve_color_change", "阀套-换色阀套", 8304, list(_PHI_SLEEVE)),
    ("hrspec_drv_plate_actuator_hs40", "HS40", 8305, list(_BOM_HS_VC)),
    ("hrspec_drv_plate_actuator_fep30", "FEP30", 8306, list(_BOM_FEP30)),
    ("hrspec_drv_plate_actuator_vc58", "VC58", 8307, list(_BOM_HS_VC)),
    ("hrspec_drv_plate_actuator_vc68", "VC68", 8308, list(_BOM_HS_VC)),
    ("hrspec_drv_plate_actuator_vc78", "VC78", 8309, list(_BOM_HS_VC)),
    ("hrspec_drv_plate_actuator_vc88", "VC88", 8310, list(_BOM_HS_VC)),
    (
        "hrspec_drv_manifold_pneumatic_connector",
        "固定在分流板上-整体式气缸-接头",
        8311,
        ["180°接头", "135°接头", "90°接头"],
    ),
    (
        "hrspec_drv_manifold_hydraulic_connector",
        "固定在分流板上-整体式油缸-接头",
        8312,
        ["180°接头", "135°接头", "90°接头"],
    ),
    ("hrspec_drv_manifold_tubing", "固定在分流板上-管材类型", 8313, ["铁氟龙管", "铁管"]),
    (
        "hrspec_drv_single_point_base_parts",
        "单点针阀补充零件",
        8314,
        ["分流体", "防转销", "密封铜环", "叠模母模转接环"],
    ),
    ("hrspec_drv_guide_sleeve", "导向套-规格", 8315, list(_PHI_SLEEVE)),
]

DRIVE_SYSTEM_DETAIL_CATEGORY_CODES: frozenset[str] = frozenset(code for code, _, _, _ in SEL_DRIVE_SYSTEM_DICT_SEED)
