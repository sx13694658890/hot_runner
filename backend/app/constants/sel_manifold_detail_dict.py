"""分流板大类 Excel/截图 扩展字典 → sel_dict_category.code 前缀 hrspec_mfld_。

与热流道规格扁平行字段（hrspec_*）独立，供分流板配置、报价或后续表结构挂载使用。
法向分流板与「分流板主体」选项一致，由前端复用同一批 category_code。
"""

from __future__ import annotations

# (code, 分类显示名, sort_order, [选项 label]) — 与截图「热流道系统」分流板表对齐
SEL_MANIFOLD_DICT_SEED: list[tuple[str, str, int, list[str]]] = [
    ("hrspec_mfld_process", "属性类-工艺", 8050, ["热处理", "流体抛光"]),
    ("hrspec_mfld_bridge_material", "属性类-分流板材质", 8051, []),
    ("hrspec_mfld_bridge_style", "桥板-分流板搭桥样式", 8052, ["板-转接环-板", "板-转接环-主射咀"]),
    ("hrspec_mfld_bridge_channel_diameter", "桥板-桥流道直径", 8053, ["φ5", "φ6", "φ8", "φ10", "φ15", "φ22"]),
    ("hrspec_mfld_manifold_thickness", "分流板厚度", 8054, ["40", "45", "50", "55", "60", "65"]),
    ("hrspec_mfld_runner_layout", "流道走向示意图（分流板主体）", 8055, ["常规", "按模流分析报告"]),
    ("hrspec_mfld_point_coding", "点位编码", 8056, ["我们公司的标准"]),
    (
        "hrspec_mfld_manifold_runner_diameter",
        "分流板流道直径（分流板主体）",
        8057,
        ["φ5", "φ6", "φ8", "φ10", "φ15", "φ22"],
    ),
    ("hrspec_mfld_runner_layers", "流道层数", 8058, ["1层", "2层"]),
    (
        "hrspec_mfld_spacer_block",
        "垫块",
        8059,
        ["φ20*5", "φ20*10", "φ29*5", "φ29*10", "反垫块", "垫块螺丝"],
    ),
    ("hrspec_mfld_plate_disc_spring", "板上碟簧", 8060, ["φ20", "φ30"]),
    ("hrspec_mfld_center_locating_pin", "中心定位销", 8061, ["H20", "H10"]),
    ("hrspec_mfld_anti_rotation_pin", "防转销", 8062, ["H20", "H10"]),
    (
        "hrspec_mfld_plug_regular",
        "堵头-常规堵头",
        8063,
        ["φ5", "φ6", "φ8", "φ10", "φ15", "φ22"],
    ),
    (
        "hrspec_mfld_plug_flat",
        "堵头-平面堵头",
        8064,
        ["φ5", "φ6", "φ8", "φ10", "φ15", "φ22"],
    ),
    ("hrspec_mfld_plug_insert_basic", "堵头-镶件堵头-基本型", 8065, ["φ5", "φ6", "φ8", "φ10", "φ15", "φ22"]),
    ("hrspec_mfld_plug_insert_t", "堵头-镶件堵头-T型", 8066, ["φ5", "φ6", "φ8", "φ10", "φ15", "φ22"]),
    ("hrspec_mfld_plug_insert_i", "堵头-镶件堵头-I型", 8067, ["φ5", "φ6", "φ8", "φ10", "φ15", "φ22"]),
    ("hrspec_mfld_plug_insert_l", "堵头-镶件堵头-L型", 8068, ["φ5", "φ6", "φ8", "φ10", "φ15", "φ22"]),
    ("hrspec_mfld_water_connector", "线架-水接头", 8069, ["PT4/1", "PT8/3", "G4/1", "G8/3"]),
    ("hrspec_mfld_oil_connector", "线架-油接头", 8070, ["PT4/1", "PT8/3", "G4/1", "G8/3"]),
    ("hrspec_mfld_rule_label", "线架-规格标牌", 8071, []),
    ("hrspec_mfld_water_page", "线架-水路版", 8072, []),
]

MANIFOLD_DETAIL_CATEGORY_CODES: frozenset[str] = frozenset(code for code, _, _, _ in SEL_MANIFOLD_DICT_SEED)
