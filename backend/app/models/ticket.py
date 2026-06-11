from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Text, Enum
from sqlalchemy.orm import relationship
from datetime import datetime
import enum
from app.database import Base

class TicketStatus(str, enum.Enum):
    OPEN = "OPEN"
    IN_PROGRESS = "IN PROGRESS"
    RESOLVED = "RESOLVED"
    CLOSED = "CLOSED"

class TicketPriority(str, enum.Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"

class Ticket(Base):
    __tablename__ = "tickets"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String)
    description = Column(Text)
    category = Column(String) # e.g. "AC", "SERVER", "NETWORK"
    location = Column(String)
    priority = Column(Enum(TicketPriority), default=TicketPriority.MEDIUM)
    status = Column(Enum(TicketStatus), default=TicketStatus.OPEN)
    
    # Auto-assignment
    assigned_to = Column(String, nullable=True) # Technician name or ID

    resolution_notes = Column(Text, nullable=True)
    resolution_photo_url = Column(String, nullable=True) # From MinIO

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    logs = relationship("TicketLog", back_populates="ticket", cascade="all, delete-orphan")

class TicketLog(Base):
    __tablename__ = "ticket_logs"

    id = Column(Integer, primary_key=True, index=True)
    ticket_id = Column(Integer, ForeignKey("tickets.id"))
    action = Column(String) # e.g. "CREATED", "ASSIGNED", "STATUS_CHANGED"
    details = Column(String, nullable=True)
    timestamp = Column(DateTime, default=datetime.utcnow)

    ticket = relationship("Ticket", back_populates="logs")
