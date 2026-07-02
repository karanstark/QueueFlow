"""Add queue config, job metrics, worker heartbeat

Revision ID: b3f1d2e4c5a6
Revises: ac2b00893f50
Create Date: 2026-07-02 14:00:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa


revision: str = 'b3f1d2e4c5a6'
down_revision: Union[str, Sequence[str], None] = 'ac2b00893f50'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Queue: add priority, concurrency_limit, retry_policy
    with op.batch_alter_table('queues') as batch_op:
        batch_op.add_column(sa.Column('priority', sa.String(), nullable=True, server_default='normal'))
        batch_op.add_column(sa.Column('concurrency_limit', sa.Integer(), nullable=True, server_default='5'))
        batch_op.add_column(sa.Column('retry_policy', sa.String(), nullable=True, server_default='exponential'))

    # Job: add priority, started_at, completed_at, duration_ms
    with op.batch_alter_table('jobs') as batch_op:
        batch_op.add_column(sa.Column('priority', sa.String(), nullable=True, server_default='normal'))
        batch_op.add_column(sa.Column('started_at', sa.DateTime(), nullable=True))
        batch_op.add_column(sa.Column('completed_at', sa.DateTime(), nullable=True))
        batch_op.add_column(sa.Column('duration_ms', sa.Float(), nullable=True))

    # Worker: add last_heartbeat
    with op.batch_alter_table('workers') as batch_op:
        batch_op.add_column(sa.Column('last_heartbeat', sa.DateTime(), nullable=True))


def downgrade() -> None:
    with op.batch_alter_table('workers') as batch_op:
        batch_op.drop_column('last_heartbeat')

    with op.batch_alter_table('jobs') as batch_op:
        batch_op.drop_column('duration_ms')
        batch_op.drop_column('completed_at')
        batch_op.drop_column('started_at')
        batch_op.drop_column('priority')

    with op.batch_alter_table('queues') as batch_op:
        batch_op.drop_column('retry_policy')
        batch_op.drop_column('concurrency_limit')
        batch_op.drop_column('priority')
