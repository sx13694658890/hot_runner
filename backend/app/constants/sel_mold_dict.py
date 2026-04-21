"""
模具根部字段 ↔ 选型字典分类 code（与 sel_dict_category.code 一致）。
用于 API 校验、标签解析；种子数据也在 Alembic 迁移中复制一份。
"""

from __future__ import annotations

# (分类 code, 分类管理展示名, 排序, [选项文案…])
SEL_MOLD_DICT_SEED: list[tuple[str, str, int, list[str]]] = [
    ("mold_status", "模具状态", 10, ["新模", "旧模改制"]),
    ("mold_type", "模具类型", 20, ["单色", "双色", "叠模"]),
    ("locating_ring_eccentric", "定位环偏心", 30, ["允许", "不允许"]),
    ("order_requirement", "订单需求", 40, ["方案", "模流", "方案+模流"]),
    ("hot_runner_type", "热流道类型", 50, ["单咀", "单点针阀", "含分流板的开放式", "含分流板的针阀式"]),
    (
        "hot_runner_system_ownership",
        "热流道系统所有权",
        55,
        ["本公司的订单", "使用客户标准为客户代工"],
    ),
    ("point_numbering_rule", "点位编号规则", 60, ["客户指定", "我司标准"]),
    ("driver_type", "驱动器", 70, ["气动", "油压"]),
    ("solenoid_valve", "电磁阀", 80, ["气动电磁阀", "油动电磁阀", "不需要电磁阀"]),
    ("solenoid_valve_position", "电磁阀位置", 90, ["操作侧", "非操作侧", "天侧", "地侧"]),
    ("gate_system_desc", "进胶系统描述", 100, ["正灌", "倒灌", "法向"]),
    ("balance_requirement", "平衡性要求", 110, ["严格", "一般", "无"]),
    ("runner_plate_style", "流道板样式", 120, ["整块板下面留铁", "通框", "拼接块"]),
    ("solenoid_valve_socket", "电磁阀插座型号", 130, ["小16芯公插"]),
    ("signal_wiring_method", "信号线接线方式", 140, ["1关2开", "1关9开"]),
    ("cooling_medium", "模具冷却介质", 150, ["常温水", "冰水", "油"]),
    ("water_oil_connector_position", "水路油路接头位置", 160, ["操作侧", "非操作侧", "地侧"]),
    ("has_temp_controller", "客户是否有温控器", 170, ["有", "没有", "需要我司提供"]),
    ("has_sequence_controller", "客户是否有时序控制器", 180, ["有", "没有", "需要我司提供"]),
    ("has_booster_pump", "客户是否有增压泵", 190, ["有", "没有", "需要我司提供"]),
    ("has_multiple_oil_pumps", "客户是否有多个油压泵", 200, ["有", "没有", "需要我司提供"]),
    ("junction_box_position", "接线盒位置", 210, ["天侧", "非操作侧", "操作侧", "地侧"]),
    ("socket_type", "插座类型", 220, ["公插", "母插", "公母插合用"]),
    ("socket_pin_count", "插座芯数", 230, ["24", "16"]),
    ("thermocouple_type", "感温线型号", 240, ["J", "K"]),
    ("delivery_wiring_method", "交付接线方式", 250, ["H/T:1~12 T/C:13~24", "H/T:1&2 T/C:3&4"]),
    ("debug_wiring_method", "调机接线方式", 260, ["H/T:1~12 T/C:13~24", "H/T:1&2 T/C:3&4", "与交付接线方式一致"]),
    (
        "injection_machine_brand",
        "注塑机品牌",
        265,
        ["海天", "弘塑", "恩格尔", "发那科", "克劳斯玛菲", "东洋", "日精", "其它"],
    ),
    (
        "customer_equipment_library",
        "客户设备库",
        266,
        ["A机器", "B机器", "C机器"],
    ),
]

# sel_mold_info 列名 → 字典分类 code（列名去掉 _id 后缀即为 code）
MOLD_DICT_COLUMN_TO_CATEGORY: dict[str, str] = {
    "mold_status_id": "mold_status",
    "mold_type_id": "mold_type",
    "locating_ring_eccentric_id": "locating_ring_eccentric",
    "order_requirement_id": "order_requirement",
    "hot_runner_type_id": "hot_runner_type",
    "hot_runner_system_ownership_id": "hot_runner_system_ownership",
    "point_numbering_rule_id": "point_numbering_rule",
    "driver_type_id": "driver_type",
    "solenoid_valve_id": "solenoid_valve",
    "solenoid_valve_position_id": "solenoid_valve_position",
    "gate_system_desc_id": "gate_system_desc",
    "balance_requirement_id": "balance_requirement",
    "runner_plate_style_id": "runner_plate_style",
    "solenoid_valve_socket_id": "solenoid_valve_socket",
    "signal_wiring_method_id": "signal_wiring_method",
    "cooling_medium_id": "cooling_medium",
    "water_oil_connector_position_id": "water_oil_connector_position",
    "has_temp_controller_id": "has_temp_controller",
    "has_sequence_controller_id": "has_sequence_controller",
    "has_booster_pump_id": "has_booster_pump",
    "has_multiple_oil_pumps_id": "has_multiple_oil_pumps",
    "junction_box_position_id": "junction_box_position",
    "socket_type_id": "socket_type",
    "socket_pin_count_id": "socket_pin_count",
    "thermocouple_type_id": "thermocouple_type",
    "delivery_wiring_method_id": "delivery_wiring_method",
    "debug_wiring_method_id": "debug_wiring_method",
    "injection_machine_brand_id": "injection_machine_brand",
    "customer_equipment_library_id": "customer_equipment_library",
}

MOLD_LABEL_SUFFIX = "_label"
