from pydantic import BaseModel, ConfigDict
from typing import List, Optional
from datetime import datetime, date
from app.models.apar import APARStatus

class APARMasterBase(BaseModel):
    branch_unit: str
    location: str
    type: str
    capacity: str
    expiration_date: date

class APARMasterCreate(APARMasterBase):
    pass

class APARMasterResponse(APARMasterBase):
    id: int
    current_status: APARStatus
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)

class APARInspectionBase(BaseModel):
    seal_status: bool = True
    pin_status: bool = True
    pressure_status: bool = True
    hose_status: bool = True
    cylinder_status: bool = True
    label_status: bool = True
    inspector_notes: Optional[str] = None

class APARInspectionCreate(APARInspectionBase):
    pass

class APARInspectionResponse(APARInspectionBase):
    id: int
    apar_id: int
    inspection_date: datetime
    model_config = ConfigDict(from_attributes=True)
