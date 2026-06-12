from pydantic import BaseModel, ConfigDict
from typing import Optional
from datetime import datetime

class ServerBase(BaseModel):
    hostname: str
    os: str
    cpu: str
    ram: str
    storage: str
    branch_unit: Optional[str] = None

class ServerCreate(ServerBase):
    pass

class ServerResponse(ServerBase):
    id: int
    srv_id: str
    status: str
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)
