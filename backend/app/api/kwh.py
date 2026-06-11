from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.database import SessionLocal
from app.models.kwh import KWHReading
from app.schemas.kwh import KWHReadingCreate, KWHReadingResponse

router = APIRouter()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

HIGH_CONSUMPTION_THRESHOLD = 500.0 # Example arbitrary threshold

@router.post("/", response_model=KWHReadingResponse)
def submit_reading(reading: KWHReadingCreate, db: Session = Depends(get_db)):
    # Find the latest reading for this meter to get previous_reading
    last_reading = db.query(KWHReading).filter(
        KWHReading.meter_number == reading.meter_number
    ).order_by(KWHReading.reading_date.desc()).first()

    previous = last_reading.current_reading if last_reading else 0.0
    
    # Ensure current is >= previous (meters only go up, unless reset)
    if reading.current_reading < previous:
        # In reality, meters might reset, but for now we raise error or handle it.
        # Let's assume a reset if it's much lower, but normally raise error.
        # For simplicity, if current < prev, we set prev = 0.
        previous = 0.0

    consumption = reading.current_reading - previous
    is_high = consumption > HIGH_CONSUMPTION_THRESHOLD

    new_kwh = KWHReading(
        branch_unit=reading.branch_unit,
        location=reading.location,
        meter_number=reading.meter_number,
        previous_reading=previous,
        current_reading=reading.current_reading,
        consumption=consumption,
        is_high_consumption=is_high
    )

    db.add(new_kwh)
    db.commit()
    db.refresh(new_kwh)
    return new_kwh

@router.get("/", response_model=List[KWHReadingResponse])
def get_readings(db: Session = Depends(get_db)):
    return db.query(KWHReading).order_by(KWHReading.reading_date.desc()).all()
