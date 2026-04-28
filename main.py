import os
import shutil
from fastapi import FastAPI, UploadFile, File, Form, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from typing import Optional, List
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
app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")

# --- MODELS ---
class LoginRequest(BaseModel):
    email: str
    password: str

class RegisterRequest(BaseModel):
    email: str
    password: str
    name: str
    role: str = "Staff"

class UserProfileUpdate(BaseModel):
    name: str
    role: str

class AssetCreate(BaseModel):
    branch: str
    room: str
    ac_type: str
    details: str

class JobCreate(BaseModel):
    title: str
    branch: str
    assigned_to: int

# --- AUTH API ---
@app.post("/api/auth/login")
async def login(payload: LoginRequest):
    user = database.get_user_by_email(payload.email)
    if not user or user["password"] != payload.password:
        raise HTTPException(status_code=401, detail="Invalid email or password")
    return {"status": "success", "user": {"id": user["id"], "name": user["name"], "role": user["role"], "email": user["email"]}}

@app.post("/api/auth/register")
async def register(payload: RegisterRequest):
    user_id = database.create_user(payload.email, payload.password, payload.name, payload.role)
    if not user_id:
        raise HTTPException(status_code=400, detail="Email already registered")
    return {"status": "success", "user_id": user_id}

# --- USER API ---
@app.get("/api/user/{user_id}")
async def get_user_profile(user_id: int):
    user = database.get_user(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return {"status": "success", "data": user}

@app.put("/api/user/{user_id}")
async def update_user_profile(user_id: int, payload: UserProfileUpdate):
    database.update_user_profile(user_id, payload.name, payload.role)
    return {"status": "success"}

@app.post("/api/user/{user_id}/avatar")
async def upload_avatar(user_id: int, file: UploadFile = File(...)):
    ext = file.filename.split('.')[-1]
    filename = f"avatar_{user_id}_{uuid.uuid4().hex[:8]}.{ext}"
    filepath = os.path.join(UPLOAD_DIR, filename)
    with open(filepath, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    database.update_user_avatar(user_id, filename)
    return {"status": "success", "filename": filename}

# --- ASSET API ---
@app.post("/api/assets")
async def create_asset(payload: AssetCreate):
    asset_id = database.create_asset(payload.branch, payload.room, payload.ac_type, payload.details)
    return {"status": "success", "asset_id": asset_id}

@app.get("/api/assets")
async def get_assets(branch: Optional[str] = None):
    return {"status": "success", "data": database.get_assets_by_branch(branch)}

@app.put("/api/assets/{asset_id}")
async def update_asset(asset_id: int, payload: AssetCreate):
    database.update_asset(asset_id, payload.branch, payload.room, payload.ac_type, payload.details)
    return {"status": "success"}

@app.delete("/api/assets/{asset_id}")
async def delete_asset(asset_id: int):
    database.delete_asset(asset_id)
    return {"status": "success"}

# --- JOBS API ---
@app.post("/api/jobs")
async def create_job(payload: JobCreate):
    job_id = database.create_job(payload.title, payload.branch, payload.assigned_to)
    return {"status": "success", "job_id": job_id}

@app.get("/api/jobs")
async def get_jobs(user_id: Optional[int] = None, role: Optional[str] = None):
    return {"status": "success", "data": database.get_jobs(user_id, role)}

@app.get("/api/jobs/{job_id}")
async def get_job_details(job_id: int):
    data = database.get_job_details(job_id)
    if not data:
        raise HTTPException(status_code=404, detail="Job not found")
    return {"status": "success", "data": data}

@app.post("/api/jobs/{job_id}/progress")
async def submit_progress(job_id: int, asset_id: int = Form(...), notes: str = Form(""), before_photo: UploadFile = File(None), after_photo: UploadFile = File(None)):
    b_filename = ""
    a_filename = ""
    
    if before_photo:
        ext = before_photo.filename.split('.')[-1]
        b_filename = f"job{job_id}_b_{uuid.uuid4().hex[:8]}.{ext}"
        with open(os.path.join(UPLOAD_DIR, b_filename), "wb") as buffer:
            shutil.copyfileobj(before_photo.file, buffer)
            
    if after_photo:
        ext = after_photo.filename.split('.')[-1]
        a_filename = f"job{job_id}_a_{uuid.uuid4().hex[:8]}.{ext}"
        with open(os.path.join(UPLOAD_DIR, a_filename), "wb") as buffer:
            shutil.copyfileobj(after_photo.file, buffer)
            
    database.submit_progress(job_id, asset_id, b_filename, a_filename, notes)
    return {"status": "success"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
