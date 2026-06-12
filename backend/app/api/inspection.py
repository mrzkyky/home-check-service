from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional

from app.database import SessionLocal
from app.models.inspection import FacilityInspection
from app.schemas.inspection import InspectionCreate, InspectionResponse

router = APIRouter()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.get("/", response_model=List[InspectionResponse])
def get_all_inspections(inspection_type: Optional[str] = None, db: Session = Depends(get_db)):
    query = db.query(FacilityInspection)
    if inspection_type:
        query = query.filter(FacilityInspection.inspection_type == inspection_type)
    return query.order_by(FacilityInspection.created_at.desc()).all()

@router.post("/", response_model=InspectionResponse, status_code=201)
def create_inspection(data: InspectionCreate, db: Session = Depends(get_db)):
    new_inspection = FacilityInspection(**data.model_dump())
    db.add(new_inspection)
    db.commit()
    db.refresh(new_inspection)
    return new_inspection

@router.get("/stats")
def get_inspection_stats(db: Session = Depends(get_db)):
    total = db.query(func.count(FacilityInspection.id)).scalar() or 0
    passed = db.query(func.count(FacilityInspection.id)).filter(FacilityInspection.status == "PASSED").scalar() or 0
    warning = db.query(func.count(FacilityInspection.id)).filter(FacilityInspection.status == "WARNING").scalar() or 0
    failed = db.query(func.count(FacilityInspection.id)).filter(FacilityInspection.status == "FAILED").scalar() or 0
    return {"total": total, "passed": passed, "warning": warning, "failed": failed}
