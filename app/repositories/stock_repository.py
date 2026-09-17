"""Persistence for StockRecord. The only layer that touches the ORM session."""

from sqlalchemy.orm import Session

from app.models.stock_record import StockRecord


def get_by_sku_location(db: Session, sku: str, location: str) -> StockRecord | None:
    return (
        db.query(StockRecord)
        .filter(StockRecord.sku == sku, StockRecord.location == location)
        .one_or_none()
    )


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
