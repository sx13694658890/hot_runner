"""模型建设

Revision ID: ecca140b6824
Revises: 32241f27eba6
Create Date: 2026-04-18 18:37:05.134499

"""
from typing import Sequence, Union


revision: str = "ecca140b6824"
down_revision: Union[str, None] = "32241f27eba6"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """占位：与前置 revision 重复 DDL 链兼容，无独立 DDL。"""
    pass


def downgrade() -> None:
    pass
