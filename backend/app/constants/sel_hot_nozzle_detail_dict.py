"""热咀大类 Excel/截图 扩展字典 → sel_dict_category.code 前缀 hrspec_hnz_。

与扁平行热流道规格中的热咀相关字段（hrspec_hot_nozzle_*、hrspec_gate_* 等）独立；热咀结构代码按「开放式/针阀式 × 大水口/点胶口」拆为四个分类，选项为结构代号扁平码表。
"""

from __future__ import annotations

_GATE_PHI = [
    "Φ1.0",
    "Φ1.2",
    "Φ1.5",
    "Φ1.8",
    "Φ2",
    "Φ2.5",
    "Φ3.0",
    "Φ3.5",
    "Φ4.0",
    "Φ5.0",
    "Φ6.0",
    "Φ7.0",
]

_SECTION_SIZES = ["20", "25", "30", "35", "45"]

# (code, 分类显示名, sort_order, [选项 label])
SEL_HOT_NOZZLE_DICT_SEED: list[tuple[str, str, int, list[str]]] = [
    ("hrspec_hnz_body_base_type", "热咀本体-底座类型", 8200, ["扳手出", "螺牙", "针孔"]),
    ("hrspec_hnz_heaters_per_body", "热咀本体-单个本体加热器数", 8201, ["1", "2", "3"]),
    (
        "hrspec_hnz_body_heater",
        "热咀本体-热咀加热器",
        8202,
        [
            "弹簧加热器",
            "蜂窝加热器",
            "绕线Φ1.0圆丝加热",
            "绕线Φ1.5圆丝加热",
            "绕线Φ1.6圆丝加热",
            "绕线4.2*2.2扁丝加热",
        ],
    ),
    ("hrspec_hnz_body_material", "热咀本体-热咀本体材质", 8203, ["FS136", "4Cr13", "4Cr13H"]),
    ("hrspec_hnz_section_coiled", "垫圈-镶嵌用", 8204, list(_SECTION_SIZES)),
    ("hrspec_hnz_section_beryllium", "垫圈-铜套用", 8205, list(_SECTION_SIZES)),
    ("hrspec_hnz_body_length", "本体碟簧", 8206, list(_SECTION_SIZES)),
    (
        "hrspec_hnz_structure_open_large",
        "热咀咀头-结构代码-开放式-大水口",
        8207,
        ["TOE", "SOE", "TLS", "OA", "PLT", "PLS", "TLC", "SLC"],
    ),
    (
        "hrspec_hnz_structure_open_dot",
        "热咀咀头-结构代码-开放式-点胶口",
        8208,
        ["CS", "TAC", "SAC", "SCC", "CC", "CCH", "CA", "CT", "CTC"],
    ),
    (
        "hrspec_hnz_structure_valve_large",
        "热咀咀头-结构代码-针阀式-大水口",
        8209,
        ["STVL", "TVL"],
    ),
    (
        "hrspec_hnz_structure_valve_dot",
        "热咀咀头-结构代码-针阀式-点胶口",
        8210,
        ["EVV", "SVV", "VV", "TVA", "TVAP", "VA", "STVA"],
    ),
    ("hrspec_hnz_gate_diameter", "热咀咀头-胶口直径", 8211, list(_GATE_PHI)),
    ("hrspec_hnz_core_material", "热咀咀头-咀芯材质", 8212, ["SKD61", "钛钢", "铍合金", "铍铜", "DC53"]),
    ("hrspec_hnz_core_coating", "热咀咀头-咀芯涂层工艺", 8213, ["铬", "氮化", "铬+氮化"]),
    ("hrspec_hnz_nozzle_cap", "热咀咀头-咀帽", 8214, ["SKD61", "铍合金", "Cr12MoV"]),
    ("hrspec_hnz_insulation_ring", "热咀咀头-隔热圈", 8215, ["PI", "PEEK", "铍合金"]),
    ("hrspec_hnz_valve_bushing", "热咀咀头-阀口套", 8216, list(_GATE_PHI)),
    ("hrspec_hnz_outer_circlip", "热咀咀头-外卡簧", 8217, list(_SECTION_SIZES)),
    ("hrspec_hnz_bushing", "衬套", 8218, []),
    (
        "hrspec_hnz_water_jacket",
        "运水套",
        8219,
        [
            "不锈钢法兰运水套",
            "密封式运水套",
            "3D打印水套",
            "运水套配件",
            "密封圈",
            "压块",
            "螺丝",
        ],
    ),
]

HOT_NOZZLE_DETAIL_CATEGORY_CODES: frozenset[str] = frozenset(code for code, _, _, _ in SEL_HOT_NOZZLE_DICT_SEED)
