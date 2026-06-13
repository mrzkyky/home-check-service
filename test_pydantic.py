from pydantic import BaseModel
from typing import Optional

try:
    class ACMasterBase(BaseModel):
        branch_unit: str
        room: str
        function: str
        brand: str
        type: str
        capacity: str
        serial_number: Optional[str] = None
        vendor: str
    print("Class created successfully")
except Exception as e:
    print(f"Error creating class: {e}")
