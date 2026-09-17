"""Domain entities / ORM mappings (one module per entity).

Imported for its side effect by alembic/env.py so Base.metadata sees every table.
"""

from app.models.stock_record import StockRecord

__all__ = ["StockRecord"]
