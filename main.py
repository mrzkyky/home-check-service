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

class ServerAssetCreate(BaseModel):
    branch: str
    server_location: str

class AparAssetCreate(BaseModel):
    branch: str
    apar_location: str
    fill_date: str
    expiry_date: str

class KwhAssetCreate(BaseModel):
    branch: str
    kwh_location: str

class UserPasswordUpdate(BaseModel):
    password: str

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
    return {"status": "success", "user": {"id": user["id"], "name": user["name"], "role": user["role"], "email": user["email"], "avatar_filename": user.get("avatar_filename", "")}}

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

@app.put("/api/user/{user_id}/password")
async def update_user_password(user_id: int, payload: UserPasswordUpdate):
    database.update_user_password(user_id, payload.password)
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

# --- SERVER ASSET API ---
@app.post("/api/server_assets")
async def create_server_asset(payload: ServerAssetCreate):
    asset_id = database.create_server_asset(payload.branch, payload.server_location)
    return {"status": "success", "asset_id": asset_id}

@app.get("/api/server_assets")
async def get_server_assets():
    return {"status": "success", "data": database.get_server_assets()}

@app.delete("/api/server_assets/{asset_id}")
async def delete_server_asset(asset_id: int):
    database.delete_server_asset(asset_id)
    return {"status": "success"}

# --- APAR ASSET API ---
@app.post("/api/apar_assets")
async def create_apar_asset(payload: AparAssetCreate):
    asset_id = database.create_apar_asset(payload.branch, payload.apar_location, payload.fill_date, payload.expiry_date)
    return {"status": "success", "asset_id": asset_id}

@app.get("/api/apar_assets")
async def get_apar_assets():
    return {"status": "success", "data": database.get_apar_assets()}

@app.delete("/api/apar_assets/{asset_id}")
async def delete_apar_asset(asset_id: int):
    database.delete_apar_asset(asset_id)
    return {"status": "success"}

class AparAssetUpdate(BaseModel):
    fill_date: str
    expiry_date: str

@app.put("/api/apar_assets/{asset_id}")
async def update_apar_asset(asset_id: int, payload: AparAssetUpdate):
    database.update_apar_asset(asset_id, payload.fill_date, payload.expiry_date)
    return {"status": "success"}


# --- KWH ASSET API ---
@app.post("/api/kwh_assets")
async def create_kwh_asset(payload: KwhAssetCreate):
    asset_id = database.create_kwh_asset(payload.branch, payload.kwh_location)
    return {"status": "success", "asset_id": asset_id}

@app.get("/api/kwh_assets")
async def get_kwh_assets():
    return {"status": "success", "data": database.get_kwh_assets()}

@app.delete("/api/kwh_assets/{asset_id}")
async def delete_kwh_asset(asset_id: int):
    database.delete_kwh_asset(asset_id)
    return {"status": "success"}

# --- JOBS API ---
@app.post("/api/jobs")
async def create_job(payload: JobCreate):
    job_id = database.create_job(payload.title, payload.branch, payload.assigned_to)
    return {"status": "success", "job_id": job_id}

@app.delete("/api/jobs/{job_id}")
async def delete_job(job_id: int):
    database.delete_job(job_id)
    return {"status": "success"}

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

import smtplib
from email.message import EmailMessage

@app.post("/api/kwh-email")
async def send_kwh_email(
    sender_name: str = Form(...),
    sender_email: str = Form(...),
    kwh_location: str = Form(...),
    recipient_email: str = Form(...),
    photo: UploadFile = File(...)
):
    # Setup dummy/central credentials here
    SMTP_SERVER = "smtp.gmail.com"
    SMTP_PORT = 587
    SMTP_USER = "morizkynurfadil8@gmail.com" # USER SHOULD CHANGE THIS
    SMTP_PASS = "***REMOVED***"   # App Password tanpa spasi
    
    # Save photo temporarily to attach
    ext = photo.filename.split('.')[-1]
    filename = f"kwh_req_{uuid.uuid4().hex[:8]}.{ext}"
    filepath = os.path.join(UPLOAD_DIR, filename)
    with open(filepath, "wb") as buffer:
        shutil.copyfileobj(photo.file, buffer)
    
    msg = EmailMessage()
    msg['Subject'] = f"Pengajuan Pulsa Listrik KWH - {kwh_location}"
    msg['From'] = f"{sender_name} <{SMTP_USER}>"
    msg['To'] = recipient_email
    
    content = f"""Halo,

Terdapat pengajuan pengisian pulsa listrik (token) untuk KWH meter berikut:
Lokasi KWH: {kwh_location}
Diajukan oleh: {sender_name} ({sender_email})

Terlampir adalah foto bukti meteran KWH saat ini.

Terima kasih,
Tim Home-Service
"""
    msg.set_content(content)
    
    # Attach photo
    with open(filepath, 'rb') as f:
        img_data = f.read()
    msg.add_attachment(img_data, maintype='image', subtype=ext, filename=photo.filename)
    
    try:
        server = smtplib.SMTP(SMTP_SERVER, SMTP_PORT)
        server.starttls()
        server.login(SMTP_USER, SMTP_PASS)
        server.send_message(msg)
        server.quit()
        return {"status": "success", "detail": "Email berhasil dikirim!"}
    except Exception as e:
        return {"status": "error", "detail": str(e)}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
