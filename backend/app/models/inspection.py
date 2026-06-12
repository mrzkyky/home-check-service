from sqlalchemy import Column, Integer, String, DateTime, Text
from datetime import datetime
from app.database import Base

class FacilityInspection(Base):
    __tablename__ = "facility_inspections"

    id = Column(Integer, primary_key=True, index=True)
    inspection_type = Column(String, index=True)  # APAR, ROOM, SERVER_ROOM, ELECTRICAL
    area = Column(String)
    inspector = Column(String)
    inspection_date = Column(DateTime, default=datetime.utcnow)
    findings = Column(Text, nullable=True)
    status = Column(String, default="PASSED")  # PASSED, WARNING, FAILED
    created_at = Column(DateTime, default=datetime.utcnow)
