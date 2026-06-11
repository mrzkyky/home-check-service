from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List

from app.database import SessionLocal
from app.models.assets import CCTVMaster
from app.schemas.assets import CCTVCreate, CCTVResponse

router = APIRouter()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.get("/", response_model=List[CCTVResponse])
def get_all_cctv(db: Session = Depends(get_db)):
    return db.query(CCTVMaster).all()

@router.post("/", response_model=CCTVResponse)
def create_cctv(cctv: CCTVCreate, db: Session = Depends(get_db)):
    new_cctv = CCTVMaster(**cctv.model_dump())
    db.add(new_cctv)
    db.commit()
    db.refresh(new_cctv)
    return new_cctv
