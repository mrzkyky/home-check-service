from pydantic import BaseModel, ConfigDict
from typing import Optional
from datetime import datetime

class InspectionBase(BaseModel):
    inspection_type: str
    area: str
    inspector: str
    inspection_date: datetime
    findings: Optional[str] = None
    status: str = "PASSED"

class InspectionCreate(InspectionBase):
    pass

class InspectionResponse(InspectionBase):
    id: int
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)
