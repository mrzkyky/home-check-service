from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import SessionLocal

from app.models.ac import ACMaster
from app.models.server_room import ServerRoom, AccessPermit, PermitStatus
from app.models.apar import APARMaster, APARStatus
from app.models.kwh import KWHReading
from app.models.ticket import Ticket, TicketStatus

router = APIRouter()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.get("/stats")
def get_dashboard_stats(db: Session = Depends(get_db)):
    # Total Branches (Assuming unique branch_unit across ACMaster or ServerRoom)
    ac_branches = {ac.branch_unit for ac in db.query(ACMaster.branch_unit).distinct()}
    sr_branches = {sr.branch_unit for sr in db.query(ServerRoom.branch_unit).distinct()}
    total_branches = len(ac_branches.union(sr_branches))

    total_rooms = db.query(ServerRoom).count()

    active_permits = db.query(AccessPermit).filter(AccessPermit.status == PermitStatus.APPROVED).count()
    pending_approvals = db.query(AccessPermit).filter(AccessPermit.status == PermitStatus.PENDING).count()

    # Note: APAR Status is calculated dynamically in the model right now, so we have to fetch all
    apars = db.query(APARMaster).all()
    apar_expired = sum(1 for a in apars if a.current_status == APARStatus.EXPIRED)
    apar_expiring_soon = sum(1 for a in apars if a.current_status == APARStatus.EXPIRING_SOON)

    high_temp_alerts = 0 # Placeholder for actual logic checking ServerRoomMonitoring latest status
    
    high_kwh_alerts = db.query(KWHReading).filter(KWHReading.is_high_consumption == True).count()

    total_open_tickets = db.query(Ticket).filter(Ticket.status.in_([TicketStatus.OPEN, TicketStatus.IN_PROGRESS])).count()

    return {
        "total_branches": total_branches,
        "total_rooms": total_rooms,
        "active_permits": active_permits,
        "pending_approvals": pending_approvals,
        "apar_expired": apar_expired,
        "apar_due_inspection": apar_expiring_soon,
        "high_temp_alerts": high_temp_alerts,
        "high_consumption_alerts": high_kwh_alerts,
        "total_open_tickets": total_open_tickets
    }
