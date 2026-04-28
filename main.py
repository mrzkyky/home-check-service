import os
import shutil
from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from typing import Optional
import database
import uuid

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

UPLOAD_DIR = os.path.join(os.path.dirname(__file__), "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)

# Mount folder uploads agar foto bisa diakses via URL
app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")

class JobCreate(BaseModel):
    title: str
    type: str

class JobReport(BaseModel):
    status: str
    notes: Optional[str] = ""
    lat: Optional[float] = 0.0
    lng: Optional[float] = 0.0
    branch: Optional[str] = ""
    room: Optional[str] = ""
    agenda: Optional[str] = ""
    job_date: Optional[str] = ""
    due_date: Optional[str] = ""
    technician_name: Optional[str] = ""

class UserProfileUpdate(BaseModel):
    name: str

@app.get("/api/jobs")
async def get_jobs():
    return {"status": "success", "data": database.get_jobs()}

@app.get("/api/jobs/{job_id}")
async def get_job(job_id: int):
    job = database.get_job_by_id(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    return {"status": "success", "data": job}

@app.post("/api/jobs")
async def create_job(payload: JobCreate):
    job_id = database.create_job(payload.title, payload.type)
    return {"status": "success", "message": "Job created", "job_id": job_id}

@app.put("/api/jobs/{job_id}")
async def update_job(job_id: int, payload: JobReport):
    database.update_job_report(
        job_id, payload.status, payload.notes, payload.lat, payload.lng,
        payload.branch, payload.room, payload.agenda, payload.job_date, payload.due_date, payload.technician_name
    )
    return {"status": "success", "message": "Job updated"}

@app.post("/api/jobs/{job_id}/upload")
async def upload_photo(job_id: int, type: str = Form(...), file: UploadFile = File(...)):
    # type is 'before' or 'after'
    if type not in ["before", "after"]:
        raise HTTPException(status_code=400, detail="Type must be before or after")
        
    ext = file.filename.split('.')[-1]
    filename = f"{job_id}_{type}_{uuid.uuid4().hex[:8]}.{ext}"
    filepath = os.path.join(UPLOAD_DIR, filename)
    
    with open(filepath, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    database.add_photo(job_id, type, filename)
    return {"status": "success", "message": f"{type} photo uploaded", "filename": filename}

@app.get("/api/user/{user_id}")
async def get_user_profile(user_id: int):
    user = database.get_user(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return {"status": "success", "data": user}

@app.put("/api/user/{user_id}")
async def update_user_profile(user_id: int, payload: UserProfileUpdate):
    user = database.get_user(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    database.update_user_profile(user_id, payload.name)
    return {"status": "success", "message": "Profile updated"}

@app.post("/api/user/{user_id}/avatar")
async def upload_avatar(user_id: int, file: UploadFile = File(...)):
    user = database.get_user(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    ext = file.filename.split('.')[-1]
    filename = f"avatar_{user_id}_{uuid.uuid4().hex[:8]}.{ext}"
    filepath = os.path.join(UPLOAD_DIR, filename)
    
    with open(filepath, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    database.update_user_avatar(user_id, filename)
    return {"status": "success", "message": "Avatar uploaded", "filename": filename}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
