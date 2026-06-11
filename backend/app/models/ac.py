from sqlalchemy import Column, Integer, String, Boolean, Float, DateTime, ForeignKey, Text, Enum
from sqlalchemy.orm import relationship
from datetime import datetime
import enum
from app.database import Base

class ApprovalStatus(str, enum.Enum):
    SUBMITTED = "SUBMITTED"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"

class ACMaster(Base):
    __tablename__ = "ac_masters"

    id = Column(Integer, primary_key=True, index=True)
    branch_unit = Column(String, index=True)
    room = Column(String)
    function = Column(String) # e.g. Main, Backup
    brand = Column(String)
    type = Column(String)
    capacity = Column(String)
    serial_number = Column(String, unique=True, index=True)
    vendor = Column(String)
    
    # Audit trail
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    monitorings = relationship("ACMonitoring", back_populates="ac")
    preventive_maintenances = relationship("ACPreventiveMaintenance", back_populates="ac")


class ACMonitoring(Base):
    __tablename__ = "ac_monitorings"

    id = Column(Integer, primary_key=True, index=True)
    ac_id = Column(Integer, ForeignKey("ac_masters.id"))
    temperature = Column(Float)
    humidity = Column(Float)
    unit_status = Column(String) # Normal, Alarm, Down
    alarm_status = Column(String)
    leakage_status = Column(Boolean, default=False)
    technician_notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    ac = relationship("ACMaster", back_populates="monitorings")


class ACPreventiveMaintenance(Base):
    __tablename__ = "ac_pms"

    id = Column(Integer, primary_key=True, index=True)
    ac_id = Column(Integer, ForeignKey("ac_masters.id"))
    pm_schedule = Column(DateTime)
    cleaning_schedule = Column(DateTime)
    due_date = Column(DateTime)
    
    # Approval Workflow
    status = Column(Enum(ApprovalStatus), default=ApprovalStatus.SUBMITTED)
    supervisor_notes = Column(Text, nullable=True)
    
    # Audit History
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    approved_at = Column(DateTime, nullable=True)
    rejected_at = Column(DateTime, nullable=True)

    ac = relationship("ACMaster", back_populates="preventive_maintenances")
    checklist = relationship("ACPMChecklist", back_populates="pm", uselist=False)
    documentations = relationship("ACPMDocumentation", back_populates="pm")


class ACPMChecklist(Base):
    __tablename__ = "ac_pm_checklists"

    id = Column(Integer, primary_key=True, index=True)
    pm_id = Column(Integer, ForeignKey("ac_pms.id"))
    
    # Checklist Items (True = OK, False = Not OK / Needs Repair)
    filter_status = Column(Boolean, default=True)
    evaporator_status = Column(Boolean, default=True)
    condenser_status = Column(Boolean, default=True)
    drainage_status = Column(Boolean, default=True)
    fan_motor_status = Column(Boolean, default=True)
    refrigerant_status = Column(Boolean, default=True)
    electrical_terminal_status = Column(Boolean, default=True)

    pm = relationship("ACPreventiveMaintenance", back_populates="checklist")


class ACPMDocumentation(Base):
    __tablename__ = "ac_pm_documentations"

    id = Column(Integer, primary_key=True, index=True)
    pm_id = Column(Integer, ForeignKey("ac_pms.id"))
    photo_type = Column(String) # 'BEFORE' or 'AFTER'
    file_url = Column(String) # MinIO URL
    created_at = Column(DateTime, default=datetime.utcnow)

    pm = relationship("ACPreventiveMaintenance", back_populates="documentations")
