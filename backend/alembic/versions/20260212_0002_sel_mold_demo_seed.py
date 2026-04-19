"""演示数据：sel_mold_info 及嵌套（产品 / 热流道 / 热咀 / 阀针）

Revision ID: 20260212_0002
Revises: 20260206_0001
Create Date: 2026-02-12

"""

from collections.abc import Sequence
from typing import Union

import sqlalchemy as sa
from alembic import op

revision: str = "20260212_0002"
down_revision: Union[str, None] = "20260206_0001"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

# 便于降级：仅删除 mold_id 以此前缀开头的记录（级联子表）
_SEED_PREFIX = "DEMO-SEED-"


def upgrade() -> None:
    conn = op.get_bind()
    import uuid

    # ---------- 样本 1：汽车保险杠 + 完整嵌套 ----------
    m1 = uuid.uuid4()
    hr1 = uuid.uuid4()
    conn.execute(
        sa.text(
            """
            INSERT INTO sel_mold_info (
              id, manufacturer, manager, manager_phone, mold_id, hot_runner_id,
              nozzle_count, cavity_count, mold_status, mold_type, locating_ring_eccentric,
              order_requirement, hot_runner_type, point_numbering_rule, driver_type,
              solenoid_valve, solenoid_valve_position, gate_system_desc,
              mold_core_eject, balance_requirement, plate_thickness_adjustable,
              runner_plate_style, wire_frame_needed, solenoid_valve_socket, signal_wiring_method,
              cooling_medium, water_oil_connector_position, has_mold_temp_controller,
              has_temp_controller, has_sequence_controller, has_booster_pump, has_multiple_oil_pumps,
              junction_box_position, socket_type, socket_pin_count, thermocouple_type,
              delivery_wiring_method, debug_wiring_method,
              injection_machine_model, injection_machine_tonnage, barrel_sphere_radius, barrel_orifice
            ) VALUES (
              :id, :manufacturer, :manager, :phone, :mold_id, :hr_sys_id,
              :nozzle_count, :cavity_count, :mold_status, :mold_type, :ring,
              :order_req, :hr_type, :point_rule, :driver,
              :solenoid, :solenoid_pos, :gate,
              :core_eject, :balance, :plate_adj,
              :runner_style, :wire, :socket_model, :signal_wire,
              :cooling, :water_side, :has_mtc,
              :has_tc, :has_seq, :has_boost, :has_multi_pump,
              :jbox, :sock_type, :sock_pins, :tc_type,
              :del_wire, :dbg_wire,
              :imm, :ton, :bsr, :bo
            )
            """
        ),
        {
            "id": m1,
            "manufacturer": "华东精密塑胶模具有限公司",
            "manager": "李伟",
            "phone": "13800138001",
            "mold_id": f"{_SEED_PREFIX}001",
            "hr_sys_id": "SYS-HR-2026-0889",
            "nozzle_count": 8,
            "cavity_count": 2,
            "mold_status": "新模",
            "mold_type": "单色",
            "ring": "不允许",
            "order_req": "方案+模流",
            "hr_type": "含分流板的开放式",
            "point_rule": "我司标准",
            "driver": "气动",
            "solenoid": "气动电磁阀",
            "solenoid_pos": "非操作侧",
            "gate": "正灌",
            "core_eject": False,
            "balance": "严格",
            "plate_adj": True,
            "runner_style": "整块板下面留铁",
            "wire": True,
            "socket_model": "小16芯公插",
            "signal_wire": "1关9开",
            "cooling": "冰水",
            "water_side": "操作侧",
            "has_mtc": True,
            "has_tc": "有",
            "has_seq": "有",
            "has_boost": "没有",
            "has_multi_pump": "没有",
            "jbox": "天侧",
            "sock_type": "公插",
            "sock_pins": 24,
            "tc_type": "K",
            "del_wire": "H/T:1~12 T/C:13~24",
            "dbg_wire": "与交付接线方式一致",
            "imm": "海天 MA3800III/5100",
            "ton": 380,
            "bsr": "55.00",
            "bo": "95.00",
        },
    )

    conn.execute(
        sa.text(
            """
            INSERT INTO sel_product_info (
              id, mold_info_id, product_name, application_field, weight, wall_thickness,
              color, surface_finish, precision_level, mechanical_requirement,
              efficiency_requirement, production_batch
            ) VALUES (
              :id, :mid, :pname, :app, :w, :wall,
              :color, :surf, :prec, :mech,
              :eff, :batch
            )
            """
        ),
        {
            "id": uuid.uuid4(),
            "mid": m1,
            "pname": "前保险杠本体（演示）",
            "app": "汽车",
            "w": "2850.00",
            "wall": "常规件（1-3mm）",
            "color": "黑色",
            "surf": "晒纹",
            "prec": "常规件（公差±0.1mm）",
            "mech": "承载件",
            "eff": "快速",
            "batch": "大批量（≥10万模次）",
        },
    )

    conn.execute(
        sa.text(
            """
            INSERT INTO sel_hot_runner_system (
              id, mold_info_id, resin_retention_cycles,
              main_nozzle_heating, main_nozzle_material, main_nozzle_heater,
              manifold_bridging, manifold_material, manifold_runner_diameter,
              manifold_interface, manifold_calculate_expansion, manifold_plug, manifold_runner_diagram
            ) VALUES (
              :id, :mid, :rrc,
              :mnh, :mnm, :mnheat,
              :mb, :mm, :mrd,
              :mi, :mce, :mp, :mrdg
            )
            """
        ),
        {
            "id": hr1,
            "mid": m1,
            "rrc": "1<X<3",
            "mnh": True,
            "mnm": "FS136",
            "mnheat": "MCM",
            "mb": True,
            "mm": "FS136",
            "mrd": "10.00",
            "mi": "M",
            "mce": True,
            "mp": "常规",
            "mrdg": "按模流分析报告",
        },
    )

    for idx, (struct, heat, gd, tip, coat) in enumerate(
        [
            ("OA", "EPM", "2.50", "铍铜", "Ni"),
            ("SOE", "GPM", "2.00", "钨铜", "DLC"),
        ],
        start=1,
    ):
        conn.execute(
            sa.text(
                """
                INSERT INTO sel_nozzle_config (
                  id, hot_runner_id, nozzle_index, structure, heater, gate_diameter,
                  tip_material, tip_coating, cap_material, insulator_material
                ) VALUES (
                  :id, :hid, :nidx, :st, :h, :gd,
                  :tip, :coat, :cap, :ins
                )
                """
            ),
            {
                "id": uuid.uuid4(),
                "hid": hr1,
                "nidx": idx,
                "st": struct,
                "h": heat,
                "gd": gd,
                "tip": tip,
                "coat": coat,
                "cap": "SKD61",
                "ins": "钛合金",
            },
        )

    conn.execute(
        sa.text(
            """
            INSERT INTO sel_valve_pin_config (id, hot_runner_id, style, material, coating)
            VALUES (:id, :hid, :sty, :mat, :coat)
            """
        ),
        {
            "id": uuid.uuid4(),
            "hid": hr1,
            "sty": "T",
            "mat": "SKD61",
            "coat": "DLC",
        },
    )

    # ---------- 样本 2：医疗透明件 + 针阀热流道 ----------
    m2 = uuid.uuid4()
    hr2 = uuid.uuid4()
    conn.execute(
        sa.text(
            """
            INSERT INTO sel_mold_info (
              id, manufacturer, manager, mold_id, hot_runner_id,
              nozzle_count, cavity_count, mold_status, mold_type,
              hot_runner_type, driver_type, solenoid_valve,
              balance_requirement, cooling_medium, thermocouple_type,
              injection_machine_model, injection_machine_tonnage
            ) VALUES (
              :id, :manufacturer, :manager, :mold_id, :hr_sys_id,
              :nozzle_count, :cavity_count, :mold_status, :mold_type,
              :hr_type, :driver, :solenoid,
              :balance, :cooling, :tc_type,
              :imm, :ton
            )
            """
        ),
        {
            "id": m2,
            "manufacturer": "苏州凯瑞医疗塑胶",
            "manager": "王芳",
            "mold_id": f"{_SEED_PREFIX}002",
            "hr_sys_id": "SYS-HR-MED-2201",
            "nozzle_count": 4,
            "cavity_count": 1,
            "mold_status": "新模",
            "mold_type": "单色",
            "hr_type": "含分流板的针阀式",
            "driver": "气动",
            "solenoid": "气动电磁阀",
            "balance": "严格",
            "cooling": "常温水",
            "tc_type": "K",
            "imm": "Engel e-victory 310H",
            "ton": 310,
        },
    )

    conn.execute(
        sa.text(
            """
            INSERT INTO sel_product_info (
              id, mold_info_id, product_name, application_field, weight, wall_thickness,
              color, surface_finish, precision_level, production_batch
            ) VALUES (
              :id, :mid, :pname, :app, :w, :wall,
              :color, :surf, :prec, :batch
            )
            """
        ),
        {
            "id": uuid.uuid4(),
            "mid": m2,
            "pname": "透明观察窗（演示）",
            "app": "医疗",
            "w": "42.50",
            "wall": "薄壁件（＜1mm）",
            "color": "透明",
            "surf": "高亮",
            "prec": "精密件（公差±0.02mm）",
            "batch": "中批量（1万-10万模次）",
        },
    )

    conn.execute(
        sa.text(
            """
            INSERT INTO sel_hot_runner_system (
              id, mold_info_id, resin_retention_cycles,
              main_nozzle_heating, main_nozzle_material, main_nozzle_heater,
              manifold_bridging, manifold_material, manifold_runner_diameter,
              manifold_interface, manifold_calculate_expansion, manifold_plug
            ) VALUES (
              :id, :mid, :rrc,
              :mnh, :mnm, :mnheat,
              :mb, :mm, :mrd,
              :mi, :mce, :mp
            )
            """
        ),
        {
            "id": hr2,
            "mid": m2,
            "rrc": "X<1",
            "mnh": True,
            "mnm": "FS136",
            "mnheat": "MCM",
            "mb": False,
            "mm": "SKD61",
            "mrd": "8.00",
            "mi": "平压斜孔",
            "mce": True,
            "mp": "镶件+BALA",
        },
    )

    conn.execute(
        sa.text(
            """
            INSERT INTO sel_nozzle_config (
              id, hot_runner_id, nozzle_index, structure, heater, gate_diameter,
              tip_material, tip_coating
            ) VALUES (
              :id, :hid, :nidx, :st, :h, :gd, :tip, :coat
            )
            """
        ),
        {
            "id": uuid.uuid4(),
            "hid": hr2,
            "nidx": 1,
            "st": "PLT",
            "h": "EPT",
            "gd": "1.20",
            "tip": "铍铜",
            "coat": "Ni",
        },
    )

    conn.execute(
        sa.text(
            """
            INSERT INTO sel_valve_pin_config (id, hot_runner_id, style, material, coating)
            VALUES (:id, :hid, :sty, :mat, :coat)
            """
        ),
        {
            "id": uuid.uuid4(),
            "hid": hr2,
            "sty": "S",
            "mat": "SKH51",
            "coat": "TiAlN",
        },
    )

    # ---------- 样本 3：仅根部（无产品/热流道），用于列表占位 ----------
    m3 = uuid.uuid4()
    conn.execute(
        sa.text(
            """
            INSERT INTO sel_mold_info (
              id, manufacturer, mold_id, mold_status, mold_type, hot_runner_type,
              order_requirement, injection_machine_tonnage
            ) VALUES (
              :id, :manufacturer, :mold_id, :mold_status, :mold_type, :hr_type,
              :order_req, :ton
            )
            """
        ),
        {
            "id": m3,
            "manufacturer": "演示客户（仅档案壳）",
            "mold_id": f"{_SEED_PREFIX}003",
            "mold_status": "旧模改制",
            "mold_type": "双色",
            "hr_type": "单咀",
            "order_req": "方案",
            "ton": 650,
        },
    )


def downgrade() -> None:
    op.execute(
        sa.text("DELETE FROM sel_mold_info WHERE mold_id LIKE 'DEMO-SEED-%'"),
    )
