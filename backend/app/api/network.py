from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List

from app.database import SessionLocal
from app.models.assets import NetworkDevice
from app.schemas.assets import NetworkCreate, NetworkResponse

router = APIRouter()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.get("/", response_model=List[NetworkResponse])
def get_all_network(db: Session = Depends(get_db)):
    return db.query(NetworkDevice).all()

@router.post("/", response_model=NetworkResponse)
def create_network(net: NetworkCreate, db: Session = Depends(get_db)):
    new_net = NetworkDevice(**net.model_dump())
    db.add(new_net)
    db.commit()
    db.refresh(new_net)
    return new_net
