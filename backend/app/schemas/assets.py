from pydantic import BaseModel, ConfigDict
from typing import Optional
from datetime import datetime

# UPS
class UPSBase(BaseModel):
    brand: str
    model: str
    capacity: str
    location: str
    ip_address: Optional[str] = None

class UPSCreate(UPSBase):
    pass

class UPSResponse(UPSBase):
    id: int
    status: str
    battery_level: float
    current_load: float
    last_tested: Optional[datetime]
    model_config = ConfigDict(from_attributes=True)

# CCTV
class CCTVBase(BaseModel):
    brand: str
    location: str
    ip_address: str
    rtsp_url: Optional[str] = None
    resolution: str

class CCTVCreate(CCTVBase):
    pass

class CCTVResponse(CCTVBase):
    id: int
    status: str
    last_ping: datetime
    model_config = ConfigDict(from_attributes=True)

# Network
class NetworkBase(BaseModel):
    device_type: str
    brand: str
    model: str
    location: str
    ip_address: str
    mac_address: Optional[str] = None
    firmware_version: Optional[str] = None

class NetworkCreate(NetworkBase):
    pass

class NetworkResponse(NetworkBase):
    id: int
    status: str
    last_seen: datetime
    model_config = ConfigDict(from_attributes=True)
