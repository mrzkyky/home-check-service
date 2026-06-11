from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.database import SessionLocal
from app.models.apar import APARMaster, APARInspection
from app.schemas.apar import (
    APARMasterCreate, APARMasterResponse,
    APARInspectionCreate, APARInspectionResponse
)

router = APIRouter()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.post("/", response_model=APARMasterResponse)
def create_apar(apar: APARMasterCreate, db: Session = Depends(get_db)):
    new_apar = APARMaster(**apar.model_dump())
    db.add(new_apar)
    db.commit()
    db.refresh(new_apar)
    return new_apar

@router.get("/", response_model=List[APARMasterResponse])
def get_apars(db: Session = Depends(get_db)):
    # Property current_status is dynamically calculated
    return db.query(APARMaster).all()

@router.post("/{apar_id}/inspect", response_model=APARInspectionResponse)
def inspect_apar(apar_id: int, inspection: APARInspectionCreate, db: Session = Depends(get_db)):
    apar = db.query(APARMaster).filter(APARMaster.id == apar_id).first()
    if not apar:
        raise HTTPException(status_code=404, detail="APAR not found")
        
    new_inspection = APARInspection(**inspection.model_dump(), apar_id=apar_id)
    db.add(new_inspection)
    db.commit()
    db.refresh(new_inspection)
    return new_inspection

@router.get("/{apar_id}/inspections", response_model=List[APARInspectionResponse])
def get_apar_inspections(apar_id: int, db: Session = Depends(get_db)):
    return db.query(APARInspection).filter(APARInspection.apar_id == apar_id).order_by(APARInspection.inspection_date.desc()).all()
