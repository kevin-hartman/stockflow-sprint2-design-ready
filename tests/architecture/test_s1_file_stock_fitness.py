"""
Architecture / fitness tests for S1-file-stock.
T1, T2, T3, T4, T5, T6, T7, T8, T9
"""
import uuid
from pathlib import Path
from unittest.mock import MagicMock, patch

import pytest
import sqlalchemy as sa
from sqlalchemy import text
from sqlalchemy.exc import IntegrityError

from app.database import SessionLocal, make_engine, resolved_url


# ── helpers ──────────────────────────────────────────────────────────────────

def _new_session():
    return SessionLocal()


def _unique_sku():
    return f"SKU-{uuid.uuid4()}"


def _unique_loc():
    return f"LOC-{uuid.uuid4()}"


def _insert_row(conn, sku, location, quantity=10, inventory_code="INV-001"):
    conn.execute(
        text(
            "INSERT INTO stock_records (sku, location, quantity, inventory_code) "
            "VALUES (:sku, :location, :quantity, :inventory_code)"
        ),
        {"sku": sku, "location": location, "quantity": quantity, "inventory_code": inventory_code},
    )


def _delete_row(conn, sku, location):
    conn.execute(
        text("DELETE FROM stock_records WHERE sku = :sku AND location = :location"),
        {"sku": sku, "location": location},
    )


# ── T1: migration reversibility ───────────────────────────────────────────────

@pytest.mark.migration
def test_T1_migration_reversible_stock_records_recreated():
    """After downgrade -1 then upgrade head, stock_records table and its
    columns + constraints exist again (schema-recreation, not data-survival)."""
    from alembic import command
    from alembic.config import Config

    ini = str(Path(__file__).resolve().parents[2] / "alembic.ini")
    cfg = Config(ini)

    command.downgrade(cfg, "-1")
    command.upgrade(cfg, "head")

    engine = make_engine()
    insp = sa.inspect(engine)

    assert insp.has_table("stock_records"), "stock_records table missing after upgrade"

    col_names = {c["name"] for c in insp.get_columns("stock_records")}
    for col in ("id", "sku", "location", "quantity", "inventory_code"):
        assert col in col_names, f"column '{col}' missing from stock_records"

    # Verify unique constraint on (sku, location) exists
    uqs = insp.get_unique_constraints("stock_records")
    uc_cols = [frozenset(u["column_names"]) for u in uqs]
    assert frozenset({"sku", "location"}) in uc_cols, \
        "unique constraint on (sku, location) missing after upgrade"

    # Verify CHECK constraint by attempting a violating insert
    with engine.connect() as conn:
        with pytest.raises(Exception):  # IntegrityError or ProgrammingError
            conn.execute(
                text(
                    "INSERT INTO stock_records (sku, location, quantity, inventory_code) "
                    "VALUES ('chk-sku', 'chk-loc', -1, 'INV-CHK')"
                )
            )
            conn.commit()


# ── T2: sku NOT NULL ──────────────────────────────────────────────────────────

def test_T2_sku_null_raises_integrity_error():
    """INSERT with sku=NULL raises IntegrityError from DB."""
    with _new_session() as session:
        with pytest.raises(IntegrityError):
            session.execute(
                text(
                    "INSERT INTO stock_records (sku, location, quantity, inventory_code) "
                    "VALUES (NULL, :location, 5, 'INV-001')"
                ),
                {"location": _unique_loc()},
            )
            session.commit()


# ── T3: location NOT NULL ─────────────────────────────────────────────────────

def test_T3_location_null_raises_integrity_error():
    """INSERT with location=NULL raises IntegrityError from DB."""
    with _new_session() as session:
        with pytest.raises(IntegrityError):
            session.execute(
                text(
                    "INSERT INTO stock_records (sku, location, quantity, inventory_code) "
                    "VALUES (:sku, NULL, 5, 'INV-001')"
                ),
                {"sku": _unique_sku()},
            )
            session.commit()


# ── T4: quantity NOT NULL ─────────────────────────────────────────────────────

def test_T4_quantity_null_raises_integrity_error():
    """INSERT with quantity=NULL raises IntegrityError from DB."""
    with _new_session() as session:
        with pytest.raises(IntegrityError):
            session.execute(
                text(
                    "INSERT INTO stock_records (sku, location, quantity, inventory_code) "
                    "VALUES (:sku, :location, NULL, 'INV-001')"
                ),
                {"sku": _unique_sku(), "location": _unique_loc()},
            )
            session.commit()


# ── T5: inventory_code NOT NULL ───────────────────────────────────────────────

def test_T5_inventory_code_null_raises_integrity_error():
    """INSERT with inventory_code=NULL raises IntegrityError from DB."""
    with _new_session() as session:
        with pytest.raises(IntegrityError):
            session.execute(
                text(
                    "INSERT INTO stock_records (sku, location, quantity, inventory_code) "
                    "VALUES (:sku, :location, 5, NULL)"
                ),
                {"sku": _unique_sku(), "location": _unique_loc()},
            )
            session.commit()


# ── T6: unique (sku, location) constraint ─────────────────────────────────────

def test_T6_duplicate_sku_location_raises_integrity_error():
    """Inserting a second row with the same (sku, location) raises IntegrityError."""
    sku = _unique_sku()
    loc = _unique_loc()
    session = _new_session()
    try:
        session.execute(
            text(
                "INSERT INTO stock_records (sku, location, quantity, inventory_code) "
                "VALUES (:sku, :location, 10, 'INV-001')"
            ),
            {"sku": sku, "location": loc},
        )
        session.commit()

        with pytest.raises(IntegrityError):
            session.execute(
                text(
                    "INSERT INTO stock_records (sku, location, quantity, inventory_code) "
                    "VALUES (:sku, :location, 20, 'INV-002')"
                ),
                {"sku": sku, "location": loc},
            )
            session.commit()
    finally:
        session.rollback()
        session.execute(
            text("DELETE FROM stock_records WHERE sku = :sku AND location = :location"),
            {"sku": sku, "location": loc},
        )
        session.commit()
        session.close()


# ── T7: CHECK constraint – quantity non-negative ──────────────────────────────

def test_T7_negative_quantity_raises_integrity_error():
    """INSERT with quantity=-1 raises IntegrityError from CHECK constraint."""
    with _new_session() as session:
        with pytest.raises(IntegrityError):
            session.execute(
                text(
                    "INSERT INTO stock_records (sku, location, quantity, inventory_code) "
                    "VALUES (:sku, :location, -1, 'INV-001')"
                ),
                {"sku": _unique_sku(), "location": _unique_loc()},
            )
            session.commit()


# ── T8: service rejects negative quantity before repository ───────────────────

def test_T8_service_rejects_negative_quantity_before_repository():
    """Service-layer guard rejects negative quantity; repository write never called."""
    from app.services.stock_service import file_stock  # noqa: F401 – will fail until Driver adds it

    mock_db = MagicMock()
    with patch("app.repositories.stock_repository.add_or_update_stock") as mock_repo:
        with pytest.raises(Exception):
            file_stock(
                db=mock_db,
                sku="SKU-TEST",
                location="LOC-A",
                quantity=-5,
                inventory_code="INV-001",
            )
        mock_repo.assert_not_called()


# ── T9: upsert – second file for same (sku, location) stores exactly one row ──

def test_T9_upsert_same_sku_location_stores_one_row():
    """Filing a stock record twice for same (sku, location) keeps exactly one row."""
    from app.services.stock_service import file_stock  # noqa: F401 – will fail until Driver adds it

    sku = _unique_sku()
    loc = _unique_loc()
    session = _new_session()
    try:
        file_stock(db=session, sku=sku, location=loc, quantity=10, inventory_code="INV-A")
        file_stock(db=session, sku=sku, location=loc, quantity=25, inventory_code="INV-B")
        session.commit()

        row = session.execute(
            text(
                "SELECT quantity, inventory_code FROM stock_records "
                "WHERE sku = :sku AND location = :location"
            ),
            {"sku": sku, "location": loc},
        ).fetchall()

        assert len(row) == 1, "expected exactly one row after two files for the same (sku, location)"
        assert row[0][0] == 25, "quantity should reflect the latest file"
    finally:
        session.execute(
            text("DELETE FROM stock_records WHERE sku = :sku AND location = :location"),
            {"sku": sku, "location": loc},
        )
        session.commit()
        session.close()
