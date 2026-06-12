from sqlalchemy import Column, Integer, String, DateTime
from datetime import datetime
from app.database import Base

class ServerMaster(Base):
    __tablename__ = "server_master"

    id = Column(Integer, primary_key=True, index=True)
    srv_id = Column(String, index=True, unique=True)
    hostname = Column(String)
    os = Column(String)
    cpu = Column(String)
    ram = Column(String)
    storage = Column(String)
    status = Column(String, default="RUNNING") # RUNNING, STOPPED, MAINTENANCE
    branch_unit = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
