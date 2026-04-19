"""模型建设

Revision ID: 32241f27eba6
Revises: 4298f2223457
Create Date: 2026-04-18 18:32:46.083118

"""
from typing import Sequence, Union


# revision identifiers, used by Alembic.
revision: str = "32241f27eba6"
down_revision: Union[str, None] = "4298f2223457"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """与 `4298f2223457` 中索引/唯一约束改版重复；线性链路上 DDL 已在先决 revision 执行，此处勿重复。"""
    pass


def downgrade() -> None:
    pass
