"""sel_material_property：material_id 改为 plastic_grade_id（指向塑料牌号）

Revision ID: 20260426_0001
Revises: 20260425_0001
Create Date: 2026-04-26

"""

from __future__ import annotations

from collections.abc import Sequence

import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

from alembic import op

revision: str = "20260426_0001"
down_revision: str | None = "20260425_0001"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    bind = op.get_bind()
    insp = sa.inspect(bind)

    op.add_column(
        "sel_material_property",
        sa.Column("plastic_grade_id", postgresql.UUID(as_uuid=True), nullable=True),
    )
    op.create_foreign_key(
        "fk_sel_material_property_plastic_grade_id",
        "sel_material_property",
        "sel_plastic_grade",
        ["plastic_grade_id"],
        ["id"],
        ondelete="CASCADE",
    )

    # 先去掉 material_id 唯一约束，否则同一材料无法插入多行（每牌号一行）
    for uq in insp.get_unique_constraints("sel_material_property") or []:
        if uq.get("column_names") == ["material_id"]:
            op.drop_constraint(uq["name"], "sel_material_property", type_="unique")
            break

    conn = bind
    # 每条原「按材料」属性行，按该材料下启用的塑料牌号拆成多行（数据与迁移前一致）
    conn.execute(
        sa.text(
            """
            INSERT INTO sel_material_property (
              id, plastic_grade_id, material_id,
              mold_temp, melt_temp, degradation_temp, molding_window,
              ejection_temp, crystallinity, moisture_absorption, viscosity, metal_corrosion,
              injection_pressure, residence_time, created_at
            )
            SELECT gen_random_uuid(), pg.id, mp.material_id,
              mp.mold_temp, mp.melt_temp, mp.degradation_temp, mp.molding_window,
              mp.ejection_temp, mp.crystallinity, mp.moisture_absorption,
              mp.viscosity, mp.metal_corrosion,
              mp.injection_pressure, mp.residence_time, mp.created_at
            FROM sel_material_property mp
            INNER JOIN sel_plastic_grade pg
              ON pg.material_id = mp.material_id AND pg.is_active IS true
            WHERE mp.plastic_grade_id IS NULL
            """
        )
    )
    conn.execute(sa.text("DELETE FROM sel_material_property WHERE plastic_grade_id IS NULL"))

    op.alter_column("sel_material_property", "plastic_grade_id", nullable=False)

    for fk in insp.get_foreign_keys("sel_material_property") or []:
        if (
            fk.get("constrained_columns") == ["material_id"]
            and fk.get("referred_table") == "sel_material"
        ):
            op.drop_constraint(fk["name"], "sel_material_property", type_="foreignkey")
            break
    op.drop_column("sel_material_property", "material_id")

    op.create_unique_constraint(
        "uq_sel_material_property_plastic_grade_id",
        "sel_material_property",
        ["plastic_grade_id"],
    )


def downgrade() -> None:
    raise NotImplementedError(
        "升级后每条属性对应一个塑料牌号，无法无损恢复为「每材料一行」；请手工迁移数据后再调整迁移脚本。"
    )
