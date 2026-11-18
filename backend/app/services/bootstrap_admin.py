"""Secure CLI bootstrap script for creating the initial Vishnu Priya administrator.

Usage:
  ADMIN_EMAIL=manager@vishnupriyafunctionhall.in ADMIN_PASSWORD=<strong-password> python -m app.services.bootstrap_admin
"""
import asyncio
import os
import sys
from sqlalchemy import select
from app.core.database import AsyncSessionLocal
from app.core.security import hash_password
from app.models.domain import Admin, AdminRole


async def bootstrap() -> None:
    email = os.environ.get("ADMIN_EMAIL", "").strip().lower()
    password = os.environ.get("ADMIN_PASSWORD", "")
    full_name = os.environ.get("ADMIN_NAME", "Hall Management Desk").strip()

    if not email or len(password) < 12:
        print("Error: Provide ADMIN_EMAIL and ADMIN_PASSWORD (min 12 chars).", file=sys.stderr)
        sys.exit(1)

    async with AsyncSessionLocal() as db:
        existing = (
            await db.execute(select(Admin).where(Admin.email == email))
        ).scalar_one_or_none()
        if existing:
            print(f"Administrator {email} already exists.")
            return

        admin = Admin(
            email=email,
            full_name=full_name,
            password_hash=hash_password(password),
            role=AdminRole.SUPER_ADMIN.value,
            is_active=True,
        )
        db.add(admin)
        await db.commit()
        print(f"Bootstrapped initial SUPER_ADMIN account: {email}")


if __name__ == "__main__":
    asyncio.run(bootstrap())
