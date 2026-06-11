from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Date
from sqlalchemy.orm import relationship
from datetime import datetime, date
import enum
from app.database import Base

class APARStatus(str, enum.Enum):
    ACTIVE = "ACTIVE"
    EXPIRING_SOON = "EXPIRING SOON"
    EXPIRED = "EXPIRED"

class APARMaster(Base):
    __tablename__ = "apar_masters"

    id = Column(Integer, primary_key=True, index=True)
    branch_unit = Column(String, index=True)
    location = Column(String)
    type = Column(String) # Dry Chemical, CO2, Foam
    capacity = Column(String) # e.g., 3 kg, 6 kg
    expiration_date = Column(Date)
    created_at = Column(DateTime, default=datetime.utcnow)

    inspections = relationship("APARInspection", back_populates="apar")

    @property
    def current_status(self):
        today = date.today()
        if today > self.expiration_date:
            return APARStatus.EXPIRED
        delta = self.expiration_date - today
        if delta.days <= 30:
            return APARStatus.EXPIRING_SOON
        return APARStatus.ACTIVE

class APARInspection(Base):
    __tablename__ = "apar_inspections"

    id = Column(Integer, primary_key=True, index=True)
    apar_id = Column(Integer, ForeignKey("apar_masters.id"))
    seal_status = Column(Boolean, default=True)
    pin_status = Column(Boolean, default=True)
    pressure_status = Column(Boolean, default=True)
    hose_status = Column(Boolean, default=True)
    cylinder_status = Column(Boolean, default=True)
    label_status = Column(Boolean, default=True)
    inspection_date = Column(DateTime, default=datetime.utcnow)
    inspector_notes = Column(String, nullable=True)

    apar = relationship("APARMaster", back_populates="inspections")
