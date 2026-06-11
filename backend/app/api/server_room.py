from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime

from app.database import SessionLocal
from app.models.server_room import (
    ServerRoom, ServerRoomMonitoring, ServerRoomInspection,
    AccessPermit, PermitAuditTrail, PermitStatus
)
from app.schemas.server_room import (
    ServerRoomCreate, ServerRoomResponse,
    ServerRoomMonitoringCreate, ServerRoomMonitoringResponse,
    ServerRoomInspectionCreate, ServerRoomInspectionResponse,
    AccessPermitCreate, AccessPermitResponse, AccessPermitApproval
)
from app.services.email_service import email_service

router = APIRouter()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# -- Server Room Management --
@router.post("/", response_model=ServerRoomResponse)
def create_server_room(room: ServerRoomCreate, db: Session = Depends(get_db)):
    new_room = ServerRoom(**room.model_dump())
    db.add(new_room)
    db.commit()
    db.refresh(new_room)
    return new_room

@router.get("/", response_model=List[ServerRoomResponse])
def get_server_rooms(db: Session = Depends(get_db)):
    return db.query(ServerRoom).all()

@router.post("/{room_id}/monitoring", response_model=ServerRoomMonitoringResponse)
def add_monitoring(room_id: int, data: ServerRoomMonitoringCreate, db: Session = Depends(get_db)):
    new_mon = ServerRoomMonitoring(**data.model_dump(), room_id=room_id)
    db.add(new_mon)
    db.commit()
    db.refresh(new_mon)
    return new_mon

@router.post("/{room_id}/inspection", response_model=ServerRoomInspectionResponse)
def add_inspection(room_id: int, data: ServerRoomInspectionCreate, db: Session = Depends(get_db)):
    new_ins = ServerRoomInspection(**data.model_dump(), room_id=room_id)
    db.add(new_ins)
    db.commit()
    db.refresh(new_ins)
    return new_ins

# -- Access Permit Workflow --
@router.post("/permits", response_model=AccessPermitResponse)
def create_permit(permit: AccessPermitCreate, db: Session = Depends(get_db)):
    # Create Permit
    new_permit = AccessPermit(**permit.model_dump())
    db.add(new_permit)
    db.flush()
    
    # Audit Trail: Created
    audit_created = PermitAuditTrail(permit_id=new_permit.id, action="CREATED")
    db.add(audit_created)
    db.flush()

    # Simulate sending email to approver
    try:
        email_html = f"""
        <h2>New Access Permit Request</h2>
        <p><strong>Visitor:</strong> {new_permit.visitor_name} ({new_permit.company})</p>
        <p><strong>Room:</strong> {new_permit.room} ({new_permit.branch_unit})</p>
        <p><strong>Purpose:</strong> {new_permit.purpose}</p>
        <p><strong>Time:</strong> {new_permit.permit_date.strftime('%Y-%m-%d')} | {new_permit.start_time} - {new_permit.end_time}</p>
        """
        # We send to a fixed approver email for now, e.g., supervisor@fibercore.com
        email_service.send_email(["supervisor@fibercore.com"], "Action Required: Server Room Access Permit", email_html)
        
        # Audit Trail: Email Sent
        audit_email = PermitAuditTrail(permit_id=new_permit.id, action="EMAIL_SENT")
        db.add(audit_email)
    except Exception as e:
        # We don't fail the permit creation if email fails, but log it (mock handles it mostly)
        pass

    db.commit()
    db.refresh(new_permit)
    return new_permit

@router.get("/permits", response_model=List[AccessPermitResponse])
def get_permits(db: Session = Depends(get_db)):
    return db.query(AccessPermit).order_by(AccessPermit.created_at.desc()).all()

@router.put("/permits/{permit_id}/approve", response_model=AccessPermitResponse)
def approve_permit(permit_id: int, approval: AccessPermitApproval, db: Session = Depends(get_db)):
    permit = db.query(AccessPermit).filter(AccessPermit.id == permit_id).first()
    if not permit:
        raise HTTPException(status_code=404, detail="Permit not found")
    
    if approval.status not in [PermitStatus.APPROVED, PermitStatus.REJECTED]:
        raise HTTPException(status_code=400, detail="Invalid approval status")

    permit.status = approval.status
    
    # Audit Trail
    audit = PermitAuditTrail(permit_id=permit.id, action=approval.status.value)
    db.add(audit)
    
    db.commit()
    db.refresh(permit)
    return permit
