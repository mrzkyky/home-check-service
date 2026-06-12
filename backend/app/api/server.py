from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List

from app.database import SessionLocal
from app.models.server import ServerMaster
from app.schemas.server import ServerCreate, ServerResponse

router = APIRouter()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.get("/", response_model=List[ServerResponse])
def get_servers(db: Session = Depends(get_db)):
    return db.query(ServerMaster).all()

@router.post("/", response_model=ServerResponse, status_code=201)
def create_server(data: ServerCreate, db: Session = Depends(get_db)):
    count = db.query(ServerMaster).count()
    srv_id = f"SRV-{(count+1):03d}"
    
    new_server = ServerMaster(**data.model_dump(), srv_id=srv_id)
    db.add(new_server)
    db.commit()
    db.refresh(new_server)
    return new_server
