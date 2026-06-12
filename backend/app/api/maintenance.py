from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime

from app.database import SessionLocal
from app.models.maintenance import MaintenanceSchedule
from app.schemas.maintenance import MaintenanceCreate, MaintenanceResponse, MaintenanceUpdate

router = APIRouter()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.get("/", response_model=List[MaintenanceResponse])
def get_all_schedules(status: Optional[str] = None, db: Session = Depends(get_db)):
    query = db.query(MaintenanceSchedule)
    if status:
        query = query.filter(MaintenanceSchedule.status == status)
    return query.order_by(MaintenanceSchedule.scheduled_date.asc()).all()

@router.post("/", response_model=MaintenanceResponse, status_code=201)
def create_schedule(data: MaintenanceCreate, db: Session = Depends(get_db)):
    new_schedule = MaintenanceSchedule(**data.model_dump())
    db.add(new_schedule)
    db.commit()
    db.refresh(new_schedule)
    return new_schedule

@router.put("/{schedule_id}", response_model=MaintenanceResponse)
def update_schedule(schedule_id: int, update: MaintenanceUpdate, db: Session = Depends(get_db)):
    schedule = db.query(MaintenanceSchedule).filter(MaintenanceSchedule.id == schedule_id).first()
    if not schedule:
        raise HTTPException(status_code=404, detail="Schedule not found")
    
    if update.status:
        schedule.status = update.status
        if update.status == "COMPLETED":
            schedule.completed_at = datetime.utcnow()
    if update.completed_at:
        schedule.completed_at = update.completed_at
    
    schedule.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(schedule)
    return schedule

@router.delete("/{schedule_id}")
def delete_schedule(schedule_id: int, db: Session = Depends(get_db)):
    schedule = db.query(MaintenanceSchedule).filter(MaintenanceSchedule.id == schedule_id).first()
    if not schedule:
        raise HTTPException(status_code=404, detail="Schedule not found")
    db.delete(schedule)
    db.commit()
    return {"message": "Schedule deleted"}
