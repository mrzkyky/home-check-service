from sqlalchemy import Column, Integer, String, Float, DateTime, Boolean
from datetime import datetime
from app.database import Base

class KWHReading(Base):
    __tablename__ = "kwh_readings"

    id = Column(Integer, primary_key=True, index=True)
    branch_unit = Column(String, index=True)
    location = Column(String)
    meter_number = Column(String, index=True)
    previous_reading = Column(Float, default=0.0)
    current_reading = Column(Float)
    consumption = Column(Float) # Calculated: current - previous
    reading_date = Column(DateTime, default=datetime.utcnow)
    
    # We can flag high consumption based on logic
    is_high_consumption = Column(Boolean, default=False)
