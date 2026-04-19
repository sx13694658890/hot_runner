"""分表演示假数据：材料主/属性、模具及产品/热流道/热咀/阀针（TABLE-SEED-001）

Revision ID: 20260412_0003
Revises: 20260212_0002
Create Date: 2026-04-12

"""

from collections.abc import Sequence
from typing import Union

import sqlalchemy as sa
from alembic import op

revision: str = "20260412_0003"
down_revision: Union[str, None] = "20260212_0002"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

_SEED_MOLD_ID = "TABLE-SEED-001"
_MAT_ABBR_A = "DEMO-SEED-A"
_MAT_ABBR_B = "DEMO-SEED-B"


def upgrade() -> None:
    conn = op.get_bind()
    import uuid

    ma = uuid.uuid4()
    mb = uuid.uuid4()
    for mid, abbr in [(ma, _MAT_ABBR_A), (mb, _MAT_ABBR_B)]:
        conn.execute(
            sa.text("INSERT INTO sel_material (id, abbreviation, is_active) VALUES (:id, :abbr, true)"),
            {"id": mid, "abbr": abbr},
        )

    conn.execute(
        sa.text(
            """
            INSERT INTO sel_material_property (
              id, material_id, mold_temp, melt_temp, degradation_temp, molding_window,
              ejection_temp, crystallinity, moisture_absorption, viscosity, metal_corrosion,
              injection_pressure, residence_time
            ) VALUES (
              :id, :mid, :mt, :mel, :deg, :mw,
              :ej, :cryst, :moist, :visc, :corr,
              :inj, :res
            )
            """
        ),
        {
            "id": uuid.uuid4(),
            "mid": ma,
            "mt": "40~70",
            "mel": "180~210",
            "deg": ">230",
            "mw": 35,
            "ej": "60~80",
            "cryst": "弹性体",
            "moist": "0.1~0.3",
            "visc": "中",
            "corr": "无",
            "inj": "60~120",
            "res": "3~6",
        },
    )
    conn.execute(
        sa.text(
            """
            INSERT INTO sel_material_property (
              id, material_id, mold_temp, melt_temp, degradation_temp, molding_window,
              ejection_temp, crystallinity, moisture_absorption, viscosity, metal_corrosion,
              injection_pressure, residence_time
            ) VALUES (
              :id, :mid, :mt, :mel, :deg, :mw,
              :ej, :cryst, :moist, :visc, :corr,
              :inj, :res
            )
            """
        ),
        {
            "id": uuid.uuid4(),
            "mid": mb,
            "mt": "60~100",
            "mel": "240~270",
            "deg": ">290",
            "mw": 30,
            "ej": "90~110",
            "cryst": "高结晶",
            "moist": "<0.01",
            "visc": "低",
            "corr": "较强",
            "inj": "80~140",
            "res": "2~5",
        },
    )

    m = uuid.uuid4()
    hr = uuid.uuid4()
    conn.execute(
        sa.text(
            """
            INSERT INTO sel_mold_info (
              id, manufacturer, manager, mold_id, hot_runner_id,
              nozzle_count, cavity_count, mold_status, mold_type,
              hot_runner_type, driver_type, balance_requirement,
              cooling_medium, thermocouple_type,
              injection_machine_model, injection_machine_tonnage
            ) VALUES (
              :id, :manufacturer, :manager, :mold_id, :hr_sys_id,
              :nozzle_count, :cavity_count, :mold_status, :mold_type,
              :hr_type, :driver, :balance,
              :cooling, :tc_type,
              :imm, :ton
            )
            """
        ),
        {
            "id": m,
            "manufacturer": "演示·分表列表样例厂",
            "manager": "张工",
            "mold_id": _SEED_MOLD_ID,
            "hr_sys_id": "SYS-TABLE-SEED-9001",
            "nozzle_count": 6,
            "cavity_count": 1,
            "mold_status": "新模",
            "mold_type": "单色",
            "hr_type": "含分流板的开放式",
            "driver": "气动",
            "balance": "严格",
            "cooling": "常温水",
            "tc_type": "K",
            "imm": "海天 MA1600III/570",
            "ton": 160,
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
            "mid": m,
            "pname": "家电外壳盖板（列表演示）",
            "app": "消费电子",
            "w": "185.00",
            "wall": "常规件（1-3mm）",
            "color": "灰色",
            "surf": "火花纹",
            "prec": "常规件（公差±0.1mm）",
            "mech": "外观件",
            "eff": "均衡",
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
            "id": hr,
            "mid": m,
            "rrc": "1<X<3",
            "mnh": True,
            "mnm": "FDAC",
            "mnheat": "MCM",
            "mb": True,
            "mm": "SKD61",
            "mrd": "12.00",
            "mi": "M",
            "mce": True,
            "mp": "常规",
            "mrdg": "示意图-001",
        },
    )

    for idx, row in enumerate(
        [
            ("OA", "EPM", "2.20", "铍铜", "Ni"),
            ("SOE", "GPM", "1.80", "钨铜", None),
            ("VEP", "EPT", "2.50", "铍铜", "DLC"),
        ],
        start=1,
    ):
        st, heat, gd, tip, coat = row
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
                "hid": hr,
                "nidx": idx,
                "st": st,
                "h": heat,
                "gd": gd,
                "tip": tip,
                "coat": coat,
                "cap": "SKD61",
                "ins": "PEEK",
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
            "hid": hr,
            "sty": "T",
            "mat": "SKH51",
            "coat": "TiAlN",
        },
    )


def downgrade() -> None:
    conn = op.get_bind()
    conn.execute(sa.text("DELETE FROM sel_mold_info WHERE mold_id = :mid"), {"mid": _SEED_MOLD_ID})
    conn.execute(
        sa.text("DELETE FROM sel_material WHERE abbreviation IN (:a, :b)"),
        {"a": _MAT_ABBR_A, "b": _MAT_ABBR_B},
    )
