"""StockRecord entity: one row per (sku, location) with an on-hand quantity."""

from sqlalchemy import CheckConstraint, Column, Integer, String, UniqueConstraint

from app.database import Base


class StockRecord(Base):
    __tablename__ = "stock_records"
    __table_args__ = (
        UniqueConstraint("sku", "location", name="uq_stock_records_sku_location"),
        CheckConstraint("quantity >= 0", name="ck_stock_records_quantity_nonneg"),
    )

    id = Column(Integer, primary_key=True, autoincrement=True)
    sku = Column(String(128), nullable=False)
    location = Column(String(128), nullable=False)
    quantity = Column(Integer, nullable=False)
    inventory_code = Column(String(128), nullable=False)
