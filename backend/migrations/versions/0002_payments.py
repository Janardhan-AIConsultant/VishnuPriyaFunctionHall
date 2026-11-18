"""Add payments table for PhonePe, Google Pay, and WhatsApp UPI gateway

Revision ID: 0002_payments
Revises: 0001_initial_schema
Create Date: 2026-11-18 10:50:00.000000
"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = "0002_payments"
down_revision: Union[str, None] = "0001_initial_schema"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    payment_method_enum = sa.Enum(
        "PHONEPE", "GOOGLE_PAY", "WHATSAPP_UPI", name="payment_method_enum"
    )
    payment_status_enum = sa.Enum(
        "INITIATED", "PENDING", "SUCCESS", "FAILED", name="payment_status_enum"
    )

    op.create_table(
        "payments",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("merchant_transaction_id", sa.String(64), nullable=False, unique=True),
        sa.Column(
            "booking_id",
            sa.String(36),
            sa.ForeignKey("bookings.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("booking_reference", sa.String(32), nullable=False),
        sa.Column("amount_inr", sa.Integer(), nullable=False),
        sa.Column("payment_method", payment_method_enum, nullable=False),
        sa.Column("payment_status", payment_status_enum, nullable=False),
        sa.Column("provider_transaction_id", sa.String(128), nullable=True),
        sa.Column("upi_intent_url", sa.Text(), nullable=False),
        sa.Column("whatsapp_pay_url", sa.Text(), nullable=False),
        sa.Column("confirmation_message", sa.Text(), nullable=True),
        sa.Column("paid_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index("ix_payments_merchant_transaction_id", "payments", ["merchant_transaction_id"], unique=True)
    op.create_index("ix_payments_booking_id", "payments", ["booking_id"])
    op.create_index("ix_payments_booking_reference", "payments", ["booking_reference"])
    op.create_index("ix_payments_payment_status", "payments", ["payment_status"])


def downgrade() -> None:
    op.drop_table("payments")
    sa.Enum(name="payment_status_enum").drop(op.get_bind(), checkfirst=True)
    sa.Enum(name="payment_method_enum").drop(op.get_bind(), checkfirst=True)
