"""热流道规格 PDF 导出：字段顺序与详情页一致（中文标签 + model_dump 键名）。"""

from __future__ import annotations

# (展示名, SelMoldHotRunnerSpecListRead.model_dump() 中的键，取展示值)
HRSPEC_PDF_VALUE_KEYS: list[tuple[str, str]] = [
    ("系统存胶模数", "system_glue_storage_modulus_label"),
    ("主射咀加热", "main_nozzle_heating_label"),
    ("主射咀/热咀本体材质", "main_nozzle_body_material_label"),
    ("主射咀加热器", "main_nozzle_heater_label"),
    ("分流板搭桥", "manifold_bridge_label"),
    ("分流板材质", "manifold_material_label"),
    ("分流板流道直径", "manifold_channel_diameter_label"),
    ("分流板与热咀对接", "manifold_nozzle_connection_label"),
    ("分流板计算膨胀", "manifold_expansion_calc_label"),
    ("分流板堵头", "manifold_plug_label"),
    ("流道走向示意图", "channel_direction_diagram_label"),
    ("热咀结构", "hot_nozzle_structure_label"),
    ("热咀加热器", "hot_nozzle_heater_label"),
    ("浇口直径", "gate_diameter_label"),
    ("咀芯材质", "nozzle_core_material_label"),
    ("咀芯涂层", "nozzle_core_coating_label"),
    ("咀帽材质", "nozzle_cap_material_label"),
    ("隔热帽材质", "insulation_cap_material_label"),
    ("阀针样式", "valve_pin_style_label"),
    ("阀针材质", "valve_pin_material_label"),
    ("阀针镀层工艺", "valve_pin_plating_process_label"),
    ("出货运水套", "shipping_water_jacket_label"),
    ("出货保护套", "shipping_protective_sleeve_label"),
    ("可参考的系统编号", "reference_system_number"),
]
