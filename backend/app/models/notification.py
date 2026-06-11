from sqlalchemy import Column, Integer, String, Boolean, DateTime
from datetime import datetime
from app.database import Base

class SystemNotification(Base):
    __tablename__ = "system_notifications"

    id = Column(Integer, primary_key=True, index=True)
    user_role = Column(String, default="all") # Specific user or role
    title = Column(String)
    message = Column(String)
    type = Column(String) # 'INFO', 'WARNING', 'ALERT', 'APPROVAL'
    is_read = Column(Boolean, default=False)
    reference_link = Column(String, nullable=True) # E.g., /assets/servers/1
    created_at = Column(DateTime, default=datetime.utcnow)
