from sqlalchemy import Column, Integer, String, DateTime, Text
from datetime import datetime
from app.database import Base

class MaintenanceSchedule(Base):
    __tablename__ = "maintenance_schedules"

    id = Column(Integer, primary_key=True, index=True)
    asset_type = Column(String, index=True)  # AC, UPS, NETWORK, SERVER, CCTV, APAR, KWH
    asset_name = Column(String)
    task_description = Column(Text)
    scheduled_date = Column(DateTime)
    frequency = Column(String)  # Harian, Mingguan, Bulanan, Kuartalan, Tahunan
    status = Column(String, default="UPCOMING")  # UPCOMING, OVERDUE, COMPLETED
    completed_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
