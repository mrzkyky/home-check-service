from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime
from datetime import datetime
from app.database import Base

class UPSMaster(Base):
    __tablename__ = "ups_master"

    id = Column(Integer, primary_key=True, index=True)
    brand = Column(String)
    model = Column(String)
    capacity = Column(String) # e.g. "10 kVA"
    location = Column(String)
    ip_address = Column(String, nullable=True)
    status = Column(String, default="ONLINE") # ONLINE, ON_BATTERY, FAULT
    battery_level = Column(Float, default=100.0)
    current_load = Column(Float, default=0.0) # Percentage
    last_tested = Column(DateTime, nullable=True)

class CCTVMaster(Base):
    __tablename__ = "cctv_master"

    id = Column(Integer, primary_key=True, index=True)
    brand = Column(String)
    location = Column(String)
    ip_address = Column(String)
    rtsp_url = Column(String, nullable=True)
    status = Column(String, default="ONLINE") # ONLINE, OFFLINE, RECORDING_ERROR
    resolution = Column(String, default="1080p")
    last_ping = Column(DateTime, default=datetime.utcnow)

class NetworkDevice(Base):
    __tablename__ = "network_devices"

    id = Column(Integer, primary_key=True, index=True)
    device_type = Column(String) # ROUTER, SWITCH, FIREWALL
    brand = Column(String)
    model = Column(String)
    location = Column(String)
    ip_address = Column(String)
    mac_address = Column(String, nullable=True)
    status = Column(String, default="ONLINE")
    firmware_version = Column(String, nullable=True)
    last_seen = Column(DateTime, default=datetime.utcnow)
