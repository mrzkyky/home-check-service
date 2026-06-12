from pydantic import BaseModel, ConfigDict
from typing import Optional
from datetime import datetime

class MaintenanceBase(BaseModel):
    asset_type: str
    asset_name: str
    task_description: str
    scheduled_date: datetime
    frequency: str

class MaintenanceCreate(MaintenanceBase):
    pass

class MaintenanceUpdate(BaseModel):
    status: Optional[str] = None
    completed_at: Optional[datetime] = None

class MaintenanceResponse(MaintenanceBase):
    id: int
    status: str
    completed_at: Optional[datetime]
    created_at: datetime
    updated_at: datetime
    model_config = ConfigDict(from_attributes=True)
