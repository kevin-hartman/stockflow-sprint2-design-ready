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


def _field_error(status: int, field: str, message: str) -> HTTPException:
    """Build the boundary's field-named error response (R5)."""
    return HTTPException(
        status_code=status, detail={"field": field, "message": message}
    )


def _require(field: str, value) -> None:
    if value is None or (isinstance(value, str) and value.strip() == ""):
        raise _field_error(422, field, f"{field} is required")


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
    except StockValidationError as exc:
        raise _field_error(422, exc.field, exc.message)

    return StockRecordResponse(
        id=record.id,
        sku=record.sku,
        location=record.location,
        quantity=record.quantity,
        inventory_code=record.inventory_code,
    )


@router.get("/list", response_model=list[StockRecordResponse])
def list_stock(
    location: str | None = Query(default=None),
    db: Session = Depends(get_db),
):
    records = stock_service.list_stock(db, location=location)
    return [
        StockRecordResponse(
            id=r.id,
            sku=r.sku,
            location=r.location,
            quantity=r.quantity,
            inventory_code=r.inventory_code,
        )
        for r in records
    ]


@router.get("", response_model=StockRecordResponse)
def get_stock(
    sku: str = Query(...),
    location: str = Query(...),
    db: Session = Depends(get_db),
):
    record = stock_service.get_stock(db, sku=sku, location=location)
    if record is None:
        raise _field_error(404, "sku", "stock record not found")
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
    return Response(status_code=204)


@router.delete("/{sku}/{location}", status_code=204)
def delete_stock_by_path(
    sku: str,
    location: str,
    db: Session = Depends(get_db),
):
    stock_service.delete_stock(db, sku=sku, location=location)
    return Response(status_code=204)
