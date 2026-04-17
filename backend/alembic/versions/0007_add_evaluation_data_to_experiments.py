"""add evaluation_data column to experiments

Revision ID: 0007
Revises: 0006
Create Date: 2026-04-17

"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision: str = "0007"
down_revision: str = "0006"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column(
        "experiments",
        sa.Column("evaluation_data", sa.JSON(), nullable=True),
    )


def downgrade() -> None:
    op.drop_column("experiments", "evaluation_data")
