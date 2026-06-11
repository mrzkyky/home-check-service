from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime

from app.database import SessionLocal
from app.models.ac import ACMaster, ACMonitoring, ACPreventiveMaintenance, ACPMChecklist, ApprovalStatus
from app.schemas.ac import (
    ACMasterCreate, ACMasterResponse,
    ACMonitoringCreate, ACMonitoringResponse,
    ACPreventiveMaintenanceCreate, ACPreventiveMaintenanceResponse,
    PMApprovalRequest
)

router = APIRouter()

# Dependency
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.post("/", response_model=ACMasterResponse, status_code=status.HTTP_201_CREATED)
def create_ac_master(ac: ACMasterCreate, db: Session = Depends(get_db)):
    db_ac = db.query(ACMaster).filter(ACMaster.serial_number == ac.serial_number).first()
    if db_ac:
        raise HTTPException(status_code=400, detail="Serial number already registered")
    
    new_ac = ACMaster(**ac.model_dump())
    db.add(new_ac)
    db.commit()
    db.refresh(new_ac)
    return new_ac

@router.get("/", response_model=List[ACMasterResponse])
def get_ac_list(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return db.query(ACMaster).offset(skip).limit(limit).all()

@router.post("/{ac_id}/monitoring", response_model=ACMonitoringResponse, status_code=status.HTTP_201_CREATED)
def add_ac_monitoring(ac_id: int, monitoring: ACMonitoringCreate, db: Session = Depends(get_db)):
    ac = db.query(ACMaster).filter(ACMaster.id == ac_id).first()
    if not ac:
        raise HTTPException(status_code=404, detail="AC not found")
    
    new_monitoring = ACMonitoring(**monitoring.model_dump(), ac_id=ac_id)
    db.add(new_monitoring)
    db.commit()
    db.refresh(new_monitoring)
    return new_monitoring

@router.post("/{ac_id}/pm", response_model=ACPreventiveMaintenanceResponse, status_code=status.HTTP_201_CREATED)
def submit_ac_pm(ac_id: int, pm: ACPreventiveMaintenanceCreate, db: Session = Depends(get_db)):
    ac = db.query(ACMaster).filter(ACMaster.id == ac_id).first()
    if not ac:
        raise HTTPException(status_code=404, detail="AC not found")
    
    # Create PM record
    pm_data = pm.model_dump(exclude={"checklist"})
    new_pm = ACPreventiveMaintenance(**pm_data, ac_id=ac_id)
    db.add(new_pm)
    db.flush() # flush to get new_pm.id
    
    # Create Checklist record
    new_checklist = ACPMChecklist(**pm.checklist.model_dump(), pm_id=new_pm.id)
    db.add(new_checklist)
    db.commit()
    db.refresh(new_pm)
    return new_pm

@router.put("/pm/{pm_id}/approve", response_model=ACPreventiveMaintenanceResponse)
def approve_pm(pm_id: int, approval: PMApprovalRequest, db: Session = Depends(get_db)):
    pm = db.query(ACPreventiveMaintenance).filter(ACPreventiveMaintenance.id == pm_id).first()
    if not pm:
        raise HTTPException(status_code=404, detail="PM not found")
    
    pm.status = approval.status
    pm.supervisor_notes = approval.supervisor_notes
    pm.updated_at = datetime.utcnow()
    
    if approval.status == ApprovalStatus.APPROVED:
        pm.approved_at = datetime.utcnow()
    elif approval.status == ApprovalStatus.REJECTED:
        pm.rejected_at = datetime.utcnow()
        
    db.commit()
    db.refresh(pm)
    return pm
