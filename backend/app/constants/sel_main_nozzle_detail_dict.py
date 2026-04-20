"""主射咀大类 Excel/截图 扩展字典 → sel_dict_category.code 前缀 hrspec_mnz_。

与热流道规格扁平行主射咀字段（hrspec_main_nozzle_*）独立，供主射咀配置、报价或后续表结构挂载使用。
"""

from __future__ import annotations

# (code, 分类显示名, sort_order, [选项 label]) — 与「主射咀大类」表对齐
SEL_MAIN_NOZZLE_DICT_SEED: list[tuple[str, str, int, list[str]]] = [
    (
        "hrspec_mnz_body_heated",
        "主射咀本体-加热型",
        8100,
        [
            "加热25",
            "加热30",
            "加热35",
            "单咀主射咀",
            "单阀主射咀",
            "主射咀本体 (搭桥)",
            "主射咀本体 (法向分流板)",
        ],
    ),
    ("hrspec_mnz_body_unheated", "主射咀本体-不加热型", 8101, ["30", "35"]),
    ("hrspec_mnz_adapter_ring_bridge", "主射咀转接环（搭桥）", 8102, ["Φ8", "Φ10"]),
    ("hrspec_mnz_adapter_ring_stack", "主射咀转接环（叠模）", 8103, []),
    (
        "hrspec_mnz_sr_ball",
        "SR球头",
        8104,
        [
            "SR11-Φ4",
            "SR11-Φ6",
            "SR11-Φ8",
            "SR16-Φ4",
            "SR16-Φ6",
            "SR16-Φ8",
            "SR21-Φ4",
            "SR21-Φ6",
            "SR21-Φ8",
        ],
    ),
    (
        "hrspec_mnz_main_heater",
        "主射咀加热器",
        8105,
        [
            "铜套加热器",
            "弹簧加热器",
            "镶嵌Φ1.0圆丝加热",
            "镶嵌Φ1.5圆丝加热",
            "镶嵌Φ1.8圆丝加热",
            "镶嵌4.2*2.2扁丝加热器",
        ],
    ),
    (
        "hrspec_mnz_thermocouple_style",
        "感温线样式",
        8106,
        [
            "打孔外挂",
            "Φ1.0镶嵌 L100+1000",
            "Φ1.0镶嵌 L150+1000",
            "Φ1.5镶嵌",
            "仅铜套附带的",
        ],
    ),
    ("hrspec_mnz_body_material", "主射咀本体材质", 8107, ["FS136", "4Cr13", "4Cr13H"]),
]

MAIN_NOZZLE_DETAIL_CATEGORY_CODES: frozenset[str] = frozenset(code for code, _, _, _ in SEL_MAIN_NOZZLE_DICT_SEED)
