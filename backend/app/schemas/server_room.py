from pydantic import BaseModel, ConfigDict
from typing import List, Optional
from datetime import datetime
from app.models.server_room import PermitStatus

# Server Room Base
class ServerRoomBase(BaseModel):
    branch_unit: str
    room_name: str

class ServerRoomCreate(ServerRoomBase):
    pass

class ServerRoomResponse(ServerRoomBase):
    id: int
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)

# Monitoring
class ServerRoomMonitoringBase(BaseModel):
    temperature: float
    humidity: float
    room_status: str
    technician_notes: Optional[str] = None

class ServerRoomMonitoringCreate(ServerRoomMonitoringBase):
    pass

class ServerRoomMonitoringResponse(ServerRoomMonitoringBase):
    id: int
    room_id: int
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)

# Inspection
class ServerRoomInspectionBase(BaseModel):
    ac_status: bool = True
    ups_status: bool = True
    cctv_status: bool = True
    cleanliness: bool = True
    leakage_check: bool = True
    door_lock_status: bool = True

class ServerRoomInspectionCreate(ServerRoomInspectionBase):
    pass

class ServerRoomInspectionResponse(ServerRoomInspectionBase):
    id: int
    room_id: int
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)

# Access Permit
class AccessPermitBase(BaseModel):
    visitor_name: str
    company: str
    purpose: str
    branch_unit: str
    room: str
    permit_date: datetime
    start_time: str
    end_time: str

class AccessPermitCreate(AccessPermitBase):
    pass

class PermitAuditTrailResponse(BaseModel):
    id: int
    action: str
    timestamp: datetime
    model_config = ConfigDict(from_attributes=True)

class AccessPermitResponse(AccessPermitBase):
    id: int
    status: PermitStatus
    created_at: datetime
    updated_at: datetime
    history: List[PermitAuditTrailResponse] = []
    model_config = ConfigDict(from_attributes=True)

class AccessPermitApproval(BaseModel):
    status: PermitStatus # APPROVED or REJECTED
