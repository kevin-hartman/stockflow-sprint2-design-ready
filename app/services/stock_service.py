"""Business rules for filing stock: validate, then create-or-update-in-place."""

from sqlalchemy.orm import Session

from app.models.stock_record import StockRecord
from app.repositories import stock_repository


class StockValidationError(ValueError):
    """A business-rule violation; carries the offending field name."""

    def __init__(self, field: str, message: str):
        self.field = field
        self.message = message
        super().__init__(message)


def file_stock(
    db: Session, sku: str, location: str, quantity: int, inventory_code: str
) -> StockRecord:
    """File a stock record. Rejects a negative quantity BEFORE any repository
    write (R2 no-negative). Owns the transaction boundary: commits on success,
    rolls back on failure. The boundary never touches the session."""
    if quantity is None or quantity < 0:
        raise StockValidationError("quantity", "quantity must be zero or greater")

    try:
        record = stock_repository.add_or_update_stock(
            db,
            sku=sku,
            location=location,
            quantity=quantity,
            inventory_code=inventory_code,
        )
        db.commit()
        return record
    except Exception:
        db.rollback()
        raise


def get_stock(db: Session, sku: str, location: str) -> StockRecord | None:
    """Read the stock record for a (sku, location) pair, or None if absent."""
    return stock_repository.get_by_sku_location(db, sku, location)


def delete_stock(db: Session, sku: str, location: str) -> bool:
    """Delete the stock record for a (sku, location) pair. Owns the transaction
    boundary: commits the removal. Returns True when a row was removed."""
    removed = stock_repository.delete_by_sku_location(db, sku, location)
    db.commit()
    return removed
