"""Stock JSON boundary. Validates input (field-named messages), delegates to the
service, returns JSON (R5). Never touches the ORM session directly."""

from fastapi import APIRouter, Depends, HTTPException, Query, Response
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.database import get_db
from app.services import stock_service
from app.services.stock_service import StockValidationError

router = APIRouter(prefix="/api/stock", tags=["stock"])


class FileStockRequest(BaseModel):
    sku: str | None = None
    location: str | None = None
    quantity: int | None = None
    inventory_code: str | None = None


class StockRecordResponse(BaseModel):
    id: int
    sku: str
    location: str
    quantity: int
    inventory_code: str


def _require(field: str, value) -> None:
    if value is None or (isinstance(value, str) and value.strip() == ""):
        raise HTTPException(
            status_code=422,
            detail={"field": field, "message": f"{field} is required"},
        )


@router.post("", response_model=StockRecordResponse)
def file_stock(payload: FileStockRequest, db: Session = Depends(get_db)):
    _require("sku", payload.sku)
    _require("location", payload.location)
    _require("quantity", payload.quantity)
    _require("inventory_code", payload.inventory_code)

    try:
        record = stock_service.file_stock(
            db,
            sku=payload.sku,
            location=payload.location,
            quantity=payload.quantity,
            inventory_code=payload.inventory_code,
        )
        db.commit()
    except StockValidationError as exc:
        db.rollback()
        raise HTTPException(
            status_code=422, detail={"field": exc.field, "message": exc.message}
        )

    return StockRecordResponse(
        id=record.id,
        sku=record.sku,
        location=record.location,
        quantity=record.quantity,
        inventory_code=record.inventory_code,
    )


@router.get("", response_model=StockRecordResponse)
def get_stock(
    sku: str = Query(...),
    location: str = Query(...),
    db: Session = Depends(get_db),
):
    record = stock_service.get_stock(db, sku=sku, location=location)
    if record is None:
        raise HTTPException(
            status_code=404,
            detail={"field": "sku", "message": "stock record not found"},
        )
    return StockRecordResponse(
        id=record.id,
        sku=record.sku,
        location=record.location,
        quantity=record.quantity,
        inventory_code=record.inventory_code,
    )


@router.delete("", status_code=204)
def delete_stock(
    sku: str = Query(...),
    location: str = Query(...),
    db: Session = Depends(get_db),
):
    stock_service.delete_stock(db, sku=sku, location=location)
    db.commit()
    return Response(status_code=204)
