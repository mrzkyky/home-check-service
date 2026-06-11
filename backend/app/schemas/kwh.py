from pydantic import BaseModel, ConfigDict
from typing import List, Optional
from datetime import datetime

class KWHReadingBase(BaseModel):
    branch_unit: str
    location: str
    meter_number: str
    current_reading: float

class KWHReadingCreate(KWHReadingBase):
    pass

class KWHReadingResponse(KWHReadingBase):
    id: int
    previous_reading: float
    consumption: float
    is_high_consumption: bool
    reading_date: datetime
    model_config = ConfigDict(from_attributes=True)
