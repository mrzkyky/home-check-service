from sqlalchemy import Column, Integer, String, Boolean, Float, DateTime, ForeignKey, Text, Enum
from sqlalchemy.orm import relationship
from datetime import datetime
import enum
from app.database import Base

class PermitStatus(str, enum.Enum):
    PENDING = "PENDING"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"
    EXPIRED = "EXPIRED"
    CLOSED = "CLOSED"

class ServerRoom(Base):
    __tablename__ = "server_rooms"
    
    id = Column(Integer, primary_key=True, index=True)
    branch_unit = Column(String, index=True)
    room_name = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    monitorings = relationship("ServerRoomMonitoring", back_populates="room")
    inspections = relationship("ServerRoomInspection", back_populates="room")

class ServerRoomMonitoring(Base):
    __tablename__ = "server_room_monitorings"

    id = Column(Integer, primary_key=True, index=True)
    room_id = Column(Integer, ForeignKey("server_rooms.id"))
    temperature = Column(Float)
    humidity = Column(Float)
    room_status = Column(String) # Normal, High Temp, Alert
    technician_notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    room = relationship("ServerRoom", back_populates="monitorings")

class ServerRoomInspection(Base):
    __tablename__ = "server_room_inspections"

    id = Column(Integer, primary_key=True, index=True)
    room_id = Column(Integer, ForeignKey("server_rooms.id"))
    ac_status = Column(Boolean, default=True)
    ups_status = Column(Boolean, default=True)
    cctv_status = Column(Boolean, default=True)
    cleanliness = Column(Boolean, default=True)
    leakage_check = Column(Boolean, default=True)
    door_lock_status = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    room = relationship("ServerRoom", back_populates="inspections")

class AccessPermit(Base):
    __tablename__ = "access_permits"

    id = Column(Integer, primary_key=True, index=True)
    visitor_name = Column(String)
    company = Column(String)
    purpose = Column(Text)
    branch_unit = Column(String)
    room = Column(String)
    permit_date = Column(DateTime)
    start_time = Column(String)
    end_time = Column(String)
    status = Column(Enum(PermitStatus), default=PermitStatus.PENDING)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    history = relationship("PermitAuditTrail", back_populates="permit")

class PermitAuditTrail(Base):
    __tablename__ = "permit_audit_trails"

    id = Column(Integer, primary_key=True, index=True)
    permit_id = Column(Integer, ForeignKey("access_permits.id"))
    action = Column(String) # e.g. 'CREATED', 'EMAIL_SENT', 'APPROVED', 'REJECTED', 'CLOSED'
    timestamp = Column(DateTime, default=datetime.utcnow)

    permit = relationship("AccessPermit", back_populates="history")
