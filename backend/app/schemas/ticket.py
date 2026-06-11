from pydantic import BaseModel, ConfigDict
from typing import List, Optional
from datetime import datetime
from app.models.ticket import TicketStatus, TicketPriority

class TicketBase(BaseModel):
    title: str
    description: str
    category: str
    location: str
    priority: TicketPriority

class TicketCreate(TicketBase):
    pass

class TicketLogResponse(BaseModel):
    id: int
    action: str
    details: Optional[str]
    timestamp: datetime
    model_config = ConfigDict(from_attributes=True)

class TicketResponse(TicketBase):
    id: int
    status: TicketStatus
    assigned_to: Optional[str]
    resolution_notes: Optional[str]
    resolution_photo_url: Optional[str]
    created_at: datetime
    updated_at: datetime
    logs: List[TicketLogResponse] = []
    model_config = ConfigDict(from_attributes=True)

class TicketUpdate(BaseModel):
    status: Optional[TicketStatus] = None
    resolution_notes: Optional[str] = None
    resolution_photo_url: Optional[str] = None
