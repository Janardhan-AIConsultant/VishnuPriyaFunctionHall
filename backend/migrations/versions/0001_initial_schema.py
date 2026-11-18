"""Initial PostgreSQL schema for Vishnu Priya Function Hall

Revision ID: 0001_initial_schema
Revises:
Create Date: 2026-11-18 10:00:00.000000
"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = "0001_initial_schema"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "admins",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("email", sa.String(255), nullable=False, unique=True),
        sa.Column("full_name", sa.String(120), nullable=False),
        sa.Column("password_hash", sa.String(255), nullable=False),
        sa.Column("role", sa.String(32), nullable=False),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index("ix_admins_email", "admins", ["email"], unique=True)

    op.create_table(
        "customers",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("full_name", sa.String(120), nullable=False),
        sa.Column("phone_number", sa.String(24), nullable=False, unique=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index("ix_customers_phone_number", "customers", ["phone_number"], unique=True)

    booking_status_enum = sa.Enum("PENDING", "CONFIRMED", "REJECTED", "CANCELLED", name="booking_status_enum")
    calendar_sync_enum = sa.Enum("NOT_SYNCED", "SYNCED", "FAILED", "CANCELLED", name="calendar_sync_status_enum")
    notif_status_enum = sa.Enum("PENDING", "SENT", "FAILED", "SKIPPED", name="notification_status_enum")

    op.create_table(
        "bookings",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("booking_reference", sa.String(32), nullable=False, unique=True),
        sa.Column("customer_id", sa.String(36), sa.ForeignKey("customers.id", ondelete="SET NULL"), nullable=True),
        sa.Column("customer_name", sa.String(120), nullable=False),
        sa.Column("phone_number", sa.String(24), nullable=False),
        sa.Column("event_type", sa.String(80), nullable=False),
        sa.Column("event_date", sa.Date(), nullable=False),
        sa.Column("event_start_time", sa.String(10), nullable=False),
        sa.Column("event_end_time", sa.String(10), nullable=False),
        sa.Column("additional_requirements", sa.Text(), nullable=True),
        sa.Column("booking_status", booking_status_enum, nullable=False),
        sa.Column("rejection_reason", sa.Text(), nullable=True),
        sa.Column("approved_by", sa.String(36), sa.ForeignKey("admins.id", ondelete="SET NULL"), nullable=True),
        sa.Column("rejected_by", sa.String(36), sa.ForeignKey("admins.id", ondelete="SET NULL"), nullable=True),
        sa.Column("approved_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("rejected_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("google_calendar_event_id", sa.String(255), nullable=True),
        sa.Column("calendar_sync_status", calendar_sync_enum, nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index("ix_bookings_booking_reference", "bookings", ["booking_reference"], unique=True)
    op.create_index("ix_bookings_event_date", "bookings", ["event_date"])
    op.create_index("ix_bookings_booking_status", "bookings", ["booking_status"])
    op.create_index("ix_bookings_date_status", "bookings", ["event_date", "booking_status"])

    op.create_table(
        "date_reservations",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("event_date", sa.Date(), nullable=False),
        sa.Column("booking_id", sa.String(36), sa.ForeignKey("bookings.id", ondelete="CASCADE"), nullable=False, unique=True),
        sa.Column("reserved_by_admin_id", sa.String(36), sa.ForeignKey("admins.id", ondelete="SET NULL"), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.UniqueConstraint("event_date", name="uq_date_reservations_event_date"),
    )
    op.create_index("ix_date_reservations_event_date", "date_reservations", ["event_date"], unique=True)

    op.create_table(
        "notification_logs",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("booking_id", sa.String(36), sa.ForeignKey("bookings.id", ondelete="CASCADE"), nullable=False),
        sa.Column("booking_reference", sa.String(32), nullable=False),
        sa.Column("recipient_phone", sa.String(24), nullable=False),
        sa.Column("event_type", sa.String(64), nullable=False),
        sa.Column("channel", sa.String(24), nullable=False),
        sa.Column("whatsapp_message_id", sa.String(255), nullable=True),
        sa.Column("status", notif_status_enum, nullable=False),
        sa.Column("retry_count", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("error_message", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index("ix_notification_logs_booking_id", "notification_logs", ["booking_id"])

    op.create_table(
        "audit_logs",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("booking_id", sa.String(36), sa.ForeignKey("bookings.id", ondelete="CASCADE"), nullable=False),
        sa.Column("booking_reference", sa.String(32), nullable=False),
        sa.Column("actor_id", sa.String(36), sa.ForeignKey("admins.id", ondelete="SET NULL"), nullable=True),
        sa.Column("actor_email", sa.String(255), nullable=False),
        sa.Column("action", sa.String(64), nullable=False),
        sa.Column("details", sa.Text(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index("ix_audit_logs_booking_id", "audit_logs", ["booking_id"])

    op.create_table(
        "business_information",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("name", sa.String(160), nullable=False),
        sa.Column("tagline", sa.String(255), nullable=False),
        sa.Column("address", sa.Text(), nullable=False),
        sa.Column("phone", sa.String(32), nullable=False),
        sa.Column("seating_capacity", sa.String(64), nullable=False),
        sa.Column("operating_hours", sa.String(64), nullable=False),
        sa.Column("timezone", sa.String(64), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
    )

    op.create_table(
        "faqs",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("question", sa.Text(), nullable=False),
        sa.Column("answer", sa.Text(), nullable=False),
        sa.Column("display_order", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.true()),
    )

    op.create_table(
        "gallery_images",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("title", sa.String(160), nullable=False),
        sa.Column("category", sa.String(64), nullable=False),
        sa.Column("caption", sa.Text(), nullable=False),
        sa.Column("image_url", sa.Text(), nullable=False),
        sa.Column("display_order", sa.Integer(), nullable=False, server_default="0"),
    )

    op.create_table(
        "integration_jobs",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("booking_id", sa.String(36), sa.ForeignKey("bookings.id", ondelete="CASCADE"), nullable=False),
        sa.Column("job_type", sa.String(64), nullable=False),
        sa.Column("idempotency_key", sa.String(128), nullable=False, unique=True),
        sa.Column("status", sa.String(32), nullable=False),
        sa.Column("attempts", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("last_error", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
    )


def downgrade() -> None:
    for table in [
        "integration_jobs",
        "gallery_images",
        "faqs",
        "business_information",
        "audit_logs",
        "notification_logs",
        "date_reservations",
        "bookings",
        "customers",
        "admins",
    ]:
        op.drop_table(table)
