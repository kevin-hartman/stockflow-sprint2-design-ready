"""Persistence for StockRecord. The only layer that touches the ORM session."""

from sqlalchemy.orm import Session

from app.models.stock_record import StockRecord


def list_stock(db: Session, location: str | None = None) -> list[StockRecord]:
    """Return every stock record, optionally scoped to a single location."""
    query = db.query(StockRecord)
    if location is not None:
        query = query.filter(StockRecord.location == location)
    return query.order_by(StockRecord.sku, StockRecord.location).all()


def get_by_sku_location(db: Session, sku: str, location: str) -> StockRecord | None:
    return (
        db.query(StockRecord)
        .filter(StockRecord.sku == sku, StockRecord.location == location)
        .one_or_none()
    )


def delete_by_sku_location(db: Session, sku: str, location: str) -> bool:
    """Delete the row for (sku, location) if present. Returns True when a row was
    removed. Flushes; the caller (service) owns the commit."""
    record = get_by_sku_location(db, sku, location)
    if record is None:
        return False
    db.delete(record)
    db.flush()
    return True


def add_or_update_stock(
    db: Session, sku: str, location: str, quantity: int, inventory_code: str
) -> StockRecord:
    """Upsert on (sku, location): update in place when the pair exists, else insert.

    Flushes so a subsequent read in the same transaction sees the write; the
    caller (service) owns the commit.
    """
    record = get_by_sku_location(db, sku, location)
    if record is None:
        record = StockRecord(
            sku=sku, location=location, quantity=quantity, inventory_code=inventory_code
        )
        db.add(record)
    else:
        record.quantity = quantity
        record.inventory_code = inventory_code
    db.flush()
    return record
