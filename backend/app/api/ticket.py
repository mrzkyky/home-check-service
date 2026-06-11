from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List
from datetime import datetime

from app.database import SessionLocal
from app.models.ticket import Ticket, TicketLog, TicketStatus
from app.schemas.ticket import TicketCreate, TicketResponse, TicketUpdate

router = APIRouter()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Mock list of technicians for auto-assignment
TECHNICIANS = ["Tech Andi", "Tech Budi", "Tech Citra", "Tech Dani"]

def get_least_loaded_technician(db: Session) -> str:
    # Auto-Assignment Logic: find the technician with the least OPEN or IN_PROGRESS tickets
    tech_loads = {tech: 0 for tech in TECHNICIANS}
    
    active_tickets = db.query(Ticket.assigned_to, func.count(Ticket.id)).filter(
        Ticket.status.in_([TicketStatus.OPEN, TicketStatus.IN_PROGRESS]),
        Ticket.assigned_to.isnot(None)
    ).group_by(Ticket.assigned_to).all()

    for assigned_to, count in active_tickets:
        if assigned_to in tech_loads:
            tech_loads[assigned_to] = count

    # Pick the one with min load
    best_tech = min(tech_loads, key=tech_loads.get)
    return best_tech

@router.post("/", response_model=TicketResponse)
def create_ticket(ticket: TicketCreate, db: Session = Depends(get_db)):
    # 1. Create the Ticket
    new_ticket = Ticket(**ticket.model_dump())
    
    # 2. Auto-Assignment Automation
    best_tech = get_least_loaded_technician(db)
    new_ticket.assigned_to = best_tech
    
    db.add(new_ticket)
    db.flush() # flush to get the ID

    # 3. Create Logs
    log_created = TicketLog(ticket_id=new_ticket.id, action="CREATED", details=f"Ticket created.")
    log_assigned = TicketLog(ticket_id=new_ticket.id, action="AUTO_ASSIGNED", details=f"Auto-assigned to {best_tech}.")
    
    db.add(log_created)
    db.add(log_assigned)

    db.commit()
    db.refresh(new_ticket)
    return new_ticket

@router.get("/", response_model=List[TicketResponse])
def get_tickets(db: Session = Depends(get_db)):
    return db.query(Ticket).order_by(Ticket.created_at.desc()).all()

@router.get("/{ticket_id}", response_model=TicketResponse)
def get_ticket(ticket_id: int, db: Session = Depends(get_db)):
    ticket = db.query(Ticket).filter(Ticket.id == ticket_id).first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
    return ticket

@router.put("/{ticket_id}", response_model=TicketResponse)
def update_ticket(ticket_id: int, update_data: TicketUpdate, db: Session = Depends(get_db)):
    ticket = db.query(Ticket).filter(Ticket.id == ticket_id).first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")

    old_status = ticket.status
    
    if update_data.status:
        ticket.status = update_data.status
        log = TicketLog(ticket_id=ticket.id, action="STATUS_CHANGED", details=f"{old_status} -> {update_data.status}")
        db.add(log)

    if update_data.resolution_notes is not None:
        ticket.resolution_notes = update_data.resolution_notes
        log = TicketLog(ticket_id=ticket.id, action="NOTES_ADDED", details="Resolution notes updated.")
        db.add(log)

    if update_data.resolution_photo_url is not None:
        ticket.resolution_photo_url = update_data.resolution_photo_url
        log = TicketLog(ticket_id=ticket.id, action="PHOTO_UPLOADED", details="Resolution photo attached.")
        db.add(log)

    ticket.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(ticket)
    return ticket
