from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List

from app.database import SessionLocal
from app.models.assets import UPSMaster
from app.schemas.assets import UPSCreate, UPSResponse

router = APIRouter()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.get("/", response_model=List[UPSResponse])
def get_all_ups(db: Session = Depends(get_db)):
    return db.query(UPSMaster).all()

@router.post("/", response_model=UPSResponse)
def create_ups(ups: UPSCreate, db: Session = Depends(get_db)):
    new_ups = UPSMaster(**ups.model_dump())
    db.add(new_ups)
    db.commit()
    db.refresh(new_ups)
    return new_ups
