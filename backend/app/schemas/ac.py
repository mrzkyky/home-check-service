from pydantic import BaseModel, ConfigDict
from typing import List, Optional
from datetime import datetime
from app.models.ac import ApprovalStatus

# ACMaster Schemas
class ACMasterBase(BaseModel):
    branch_unit: str
    room: str
    function: str
    brand: str
    type: str
    capacity: str
    serial_number: Optional[str] = None
    vendor: str

class ACMasterCreate(ACMasterBase):
    pass

class ACMasterResponse(ACMasterBase):
    id: int
    created_at: datetime
    updated_at: datetime
    model_config = ConfigDict(from_attributes=True)


# ACMonitoring Schemas
class ACMonitoringBase(BaseModel):
    temperature: float
    humidity: float
    unit_status: str
    alarm_status: str
    leakage_status: bool
    technician_notes: Optional[str] = None

class ACMonitoringCreate(ACMonitoringBase):
    pass

class ACMonitoringResponse(ACMonitoringBase):
    id: int
    ac_id: int
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)


# Checklist Schema
class ACPMChecklistBase(BaseModel):
    filter_status: bool = True
    evaporator_status: bool = True
    condenser_status: bool = True
    drainage_status: bool = True
    fan_motor_status: bool = True
    refrigerant_status: bool = True
    electrical_terminal_status: bool = True

class ACPMChecklistCreate(ACPMChecklistBase):
    pass

class ACPMChecklistResponse(ACPMChecklistBase):
    id: int
    model_config = ConfigDict(from_attributes=True)


# PM Schemas
class ACPreventiveMaintenanceBase(BaseModel):
    pm_schedule: datetime
    cleaning_schedule: datetime
    due_date: datetime

class ACPreventiveMaintenanceCreate(ACPreventiveMaintenanceBase):
    checklist: ACPMChecklistCreate

class ACPreventiveMaintenanceResponse(ACPreventiveMaintenanceBase):
    id: int
    ac_id: int
    status: ApprovalStatus
    supervisor_notes: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    checklist: Optional[ACPMChecklistResponse] = None
    model_config = ConfigDict(from_attributes=True)

class PMApprovalRequest(BaseModel):
    status: ApprovalStatus
    supervisor_notes: Optional[str] = None
