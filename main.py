import os
import shutil
from datetime import datetime, timedelta
from collections import defaultdict
from fastapi import FastAPI, UploadFile, File, Form, HTTPException, Depends, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel
from typing import Optional, List
from jose import JWTError, jwt
from dotenv import load_dotenv
import database
import uuid

load_dotenv()

JWT_SECRET    = os.getenv("JWT_SECRET_KEY", "fallback-secret")
JWT_ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")
JWT_EXPIRE_H  = int(os.getenv("JWT_EXPIRE_HOURS", "8"))

security = HTTPBearer()

# Rate limiting: maks 5 login gagal per 15 menit per IP
_login_attempts: dict = defaultdict(list)

def get_client_ip(request: Request) -> str:
    forwarded = request.headers.get("X-Forwarded-For")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.client.host if request.client else "unknown"

def check_rate_limit(ip: str) -> bool:
    now = datetime.utcnow()
    _login_attempts[ip] = [t for t in _login_attempts[ip] if (now - t).total_seconds() < 900]
    if len(_login_attempts[ip]) >= 5:
        return False
    _login_attempts[ip].append(now)
    return True

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(hours=JWT_EXPIRE_H)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, JWT_SECRET, algorithm=JWT_ALGORITHM)

def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    token = credentials.credentials
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        return payload
    except JWTError:
        raise HTTPException(status_code=401, detail="Token tidak valid atau sudah expired")


app = FastAPI()

# Auto-initialize database on startup
@app.on_event("startup")
def startup_event():
    database.init_db()

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

class ServerAccessRequestModel(BaseModel):
    requester_name: str
    jabatan: str
    requester_email: str
    server_id: int
    server_info: str
    purpose: str
    access_date: str

class ServerAccessReviewModel(BaseModel):
    status: str
    reject_reason: str = ""

# --- AUTH API ---
@app.post("/api/auth/login")
async def login(payload: LoginRequest, request: Request):
    ip = get_client_ip(request)
    if not check_rate_limit(ip):
        raise HTTPException(status_code=429, detail="Terlalu banyak percobaan login. Coba lagi dalam 15 menit.")

    user = database.get_user_by_email(payload.email)
    if not user or not database.check_password(payload.password, user["password"]):
        database.log_action(0, payload.email, "LOGIN_FAILED", f"Percobaan login gagal dari {ip}", ip)
        raise HTTPException(status_code=401, detail="Invalid email or password")

    user_data = {
        "id": user["id"],
        "name": user["name"],
        "role": user["role"],
        "email": user["email"],
        "avatar_filename": user.get("avatar_filename", "")
    }
    token = create_access_token(user_data)
    database.log_action(user["id"], user["name"], "LOGIN", f"Login berhasil", ip)
    return {"status": "success", "access_token": token, "user": user_data}

@app.post("/api/auth/register")
async def register(payload: RegisterRequest):
    user_id = database.create_user(payload.email, payload.password, payload.name, payload.role)
    if not user_id:
        raise HTTPException(status_code=400, detail="Email already registered")
    return {"status": "success", "user_id": user_id}

# --- USER API ---
@app.get("/api/user/{user_id}")
async def get_user_profile(user_id: int, _u: dict = Depends(get_current_user)):
    user = database.get_user(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return {"status": "success", "data": user}

@app.put("/api/user/{user_id}")
async def update_user_profile(user_id: int, payload: UserProfileUpdate, _u: dict = Depends(get_current_user)):
    database.update_user_profile(user_id, payload.name, payload.role)
    return {"status": "success"}

@app.put("/api/user/{user_id}/password")
async def update_user_password(user_id: int, payload: UserPasswordUpdate, _u: dict = Depends(get_current_user)):
    database.update_user_password(user_id, payload.password)
    return {"status": "success"}

@app.post("/api/user/{user_id}/avatar")
async def upload_avatar(user_id: int, file: UploadFile = File(...), _u: dict = Depends(get_current_user)):
    ext = file.filename.split('.')[-1]
    filename = f"avatar_{user_id}_{uuid.uuid4().hex[:8]}.{ext}"
    filepath = os.path.join(UPLOAD_DIR, filename)
    with open(filepath, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    database.update_user_avatar(user_id, filename)
    return {"status": "success", "filename": filename}

# --- ASSET API ---
@app.post("/api/assets")
async def create_asset(payload: AssetCreate, _u: dict = Depends(get_current_user)):
    asset_id = database.create_asset(payload.branch, payload.room, payload.ac_type, payload.details)
    return {"status": "success", "asset_id": asset_id}

@app.get("/api/assets")
async def get_assets(branch: Optional[str] = None, _u: dict = Depends(get_current_user)):
    return {"status": "success", "data": database.get_assets_by_branch(branch)}

@app.put("/api/assets/{asset_id}")
async def update_asset(asset_id: int, payload: AssetCreate, _u: dict = Depends(get_current_user)):
    database.update_asset(asset_id, payload.branch, payload.room, payload.ac_type, payload.details)
    return {"status": "success"}

@app.delete("/api/assets/{asset_id}")
async def delete_asset(asset_id: int, _u: dict = Depends(get_current_user)):
    database.delete_asset(asset_id)
    return {"status": "success"}

# --- SERVER ASSET API ---
@app.post("/api/server_assets")
async def create_server_asset(payload: ServerAssetCreate, _u: dict = Depends(get_current_user)):
    asset_id = database.create_server_asset(payload.branch, payload.server_location)
    return {"status": "success", "asset_id": asset_id}

@app.get("/api/server_assets")
async def get_server_assets(_u: dict = Depends(get_current_user)):
    return {"status": "success", "data": database.get_server_assets()}

@app.delete("/api/server_assets/{asset_id}")
async def delete_server_asset(asset_id: int, _u: dict = Depends(get_current_user)):
    database.delete_server_asset(asset_id)
    return {"status": "success"}

# --- APAR ASSET API ---
@app.post("/api/apar_assets")
async def create_apar_asset(payload: AparAssetCreate, _u: dict = Depends(get_current_user)):
    asset_id = database.create_apar_asset(payload.branch, payload.apar_location, payload.fill_date, payload.expiry_date)
    return {"status": "success", "asset_id": asset_id}

@app.get("/api/apar_assets")
async def get_apar_assets(_u: dict = Depends(get_current_user)):
    return {"status": "success", "data": database.get_apar_assets()}

@app.delete("/api/apar_assets/{asset_id}")
async def delete_apar_asset(asset_id: int, _u: dict = Depends(get_current_user)):
    database.delete_apar_asset(asset_id)
    return {"status": "success"}

class AparAssetUpdate(BaseModel):
    fill_date: str
    expiry_date: str

@app.put("/api/apar_assets/{asset_id}")
async def update_apar_asset(asset_id: int, payload: AparAssetUpdate, _u: dict = Depends(get_current_user)):
    database.update_apar_asset(asset_id, payload.fill_date, payload.expiry_date)
    return {"status": "success"}

# --- KWH ASSET API ---
@app.post("/api/kwh_assets")
async def create_kwh_asset(payload: KwhAssetCreate, _u: dict = Depends(get_current_user)):
    asset_id = database.create_kwh_asset(payload.branch, payload.kwh_location)
    return {"status": "success", "asset_id": asset_id}

@app.get("/api/kwh_assets")
async def get_kwh_assets(_u: dict = Depends(get_current_user)):
    return {"status": "success", "data": database.get_kwh_assets()}

@app.delete("/api/kwh_assets/{asset_id}")
async def delete_kwh_asset(asset_id: int, _u: dict = Depends(get_current_user)):
    database.delete_kwh_asset(asset_id)
    return {"status": "success"}

# --- JOBS API ---
@app.post("/api/jobs")
async def create_job(payload: JobCreate, current_user: dict = Depends(get_current_user)):
    job_id = database.create_job(payload.title, payload.branch, payload.assigned_to)
    database.log_action(current_user.get("id", 0), current_user.get("name", ""), "SPK_CREATED",
                        f"SPK '{payload.title}' untuk cabang {payload.branch}")
    return {"status": "success", "job_id": job_id}

@app.delete("/api/jobs/{job_id}")
async def delete_job(job_id: int, current_user: dict = Depends(get_current_user)):
    database.log_action(current_user.get("id", 0), current_user.get("name", ""), "SPK_DELETED",
                        f"SPK ID #{job_id} dihapus")
    database.delete_job(job_id)
    return {"status": "success"}

@app.get("/api/jobs")
async def get_jobs(user_id: Optional[int] = None, role: Optional[str] = None, _u: dict = Depends(get_current_user)):
    return {"status": "success", "data": database.get_jobs(user_id, role)}

@app.get("/api/jobs/{job_id}")
async def get_job_details(job_id: int, _u: dict = Depends(get_current_user)):
    data = database.get_job_details(job_id)
    if not data:
        raise HTTPException(status_code=404, detail="Job not found")
    return {"status": "success", "data": data}

@app.post("/api/jobs/{job_id}/progress")
async def submit_progress(job_id: int, asset_id: int = Form(...), notes: str = Form(""), before_photo: UploadFile = File(None), after_photo: UploadFile = File(None), _u: dict = Depends(get_current_user)):
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

def send_email_helper(to_email: str, subject: str, content: str, attachment_filepath: str = None, attachment_filename: str = None):
    SMTP_SERVER = os.getenv("SMTP_SERVER", "smtp.gmail.com")
    SMTP_PORT   = int(os.getenv("SMTP_PORT", "465"))
    SMTP_USER   = os.getenv("SMTP_USER", "")
    SMTP_PASS   = os.getenv("SMTP_PASS", "")
    
    msg = EmailMessage()
    msg['Subject'] = subject
    msg['From'] = f"Sistem HCS <{SMTP_USER}>"
    msg['To'] = to_email
    
    # Send as HTML if content contains HTML tags, else plain text
    if "<html>" in content or "<b>" in content:
        msg.add_alternative(content, subtype='html')
    else:
        msg.set_content(content)
        
    if attachment_filepath and os.path.exists(attachment_filepath):
        ext = attachment_filename.split('.')[-1] if attachment_filename else 'bin'
        with open(attachment_filepath, 'rb') as f:
            file_data = f.read()
        msg.add_attachment(file_data, maintype='image', subtype=ext, filename=attachment_filename)
        
    try:
        import ssl
        context = ssl.create_default_context()
        with smtplib.SMTP_SSL(SMTP_SERVER, SMTP_PORT, context=context) as server:
            server.login(SMTP_USER, SMTP_PASS)
            server.send_message(msg)
        return True, "Email berhasil dikirim!"
    except Exception as e:
        return False, str(e)

@app.post("/api/kwh-email")
async def send_kwh_email(
    sender_name: str = Form(...),
    sender_email: str = Form(...),
    kwh_location: str = Form(...),
    recipient_email: str = Form(...),
    photo: UploadFile = File(...),
    _u: dict = Depends(get_current_user)
):
    # Save photo temporarily to attach
    ext = photo.filename.split('.')[-1]
    filename = f"kwh_req_{uuid.uuid4().hex[:8]}.{ext}"
    filepath = os.path.join(UPLOAD_DIR, filename)
    with open(filepath, "wb") as buffer:
        shutil.copyfileobj(photo.file, buffer)
        
    subject = f"Pengajuan Pulsa Listrik KWH - {kwh_location}"
    content = f"""Halo,

Terdapat pengajuan pengisian pulsa listrik (token) untuk KWH meter berikut:
Lokasi KWH: {kwh_location}
Diajukan oleh: {sender_name} ({sender_email})

Terlampir adalah foto bukti meteran KWH saat ini.

Terima kasih,
Tim Home-Service
"""
    success, msg = send_email_helper(recipient_email, subject, content, filepath, photo.filename)
    if success:
        return {"status": "success", "detail": msg}
    else:
        return {"status": "error", "detail": msg}

# --- SERVER ACCESS PERMIT API ---
@app.post("/api/server-access/request")
async def request_server_access(payload: ServerAccessRequestModel):
    # Simpan ke DB
    res = database.create_access_request(
        payload.requester_name, payload.jabatan, payload.requester_email,
        payload.server_id, payload.server_info, payload.purpose, payload.access_date
    )
    token = res["token"]
    
    # Ambil superadmin/admin emails untuk notifikasi (ambil semua Superadmin/Admin dari DB)
    conn = database.sqlite3.connect(database.DB_PATH)
    cur = conn.cursor()
    cur.execute("SELECT email FROM users WHERE role IN ('Superadmin', 'Admin')")
    admins = [row[0] for row in cur.fetchall() if row[0]]
    conn.close()
    
    # Kirim email ke semua admin
    for admin_email in admins:
        subj = f"HCS - Pengajuan Izin Akses Server Baru"
        html = f"""
        <html><body>
        <h3>Pengajuan Izin Akses Server</h3>
        <p>Ada pengajuan akses server baru dari <b>{payload.requester_name}</b> ({payload.jabatan}).</p>
        <ul>
            <li><b>Server:</b> {payload.server_info}</li>
            <li><b>Keperluan:</b> {payload.purpose}</li>
            <li><b>Tgl Akses:</b> {payload.access_date}</li>
        </ul>
        <p>Silakan login ke <a href="https://hcs.yourdomain.com">Sistem HCS</a> (Admin Panel) untuk meninjau permintaan ini.</p>
        </body></html>
        """
        send_email_helper(admin_email, subj, html)
        
    return {"status": "success", "token": token}

@app.get("/api/server-access/status/{token}")
async def get_server_access_status(token: str):
    data = database.get_request_by_token(token)
    if not data:
        raise HTTPException(status_code=404, detail="Token permit tidak ditemukan.")
    return {"status": "success", "data": data}

@app.get("/api/server-access/requests")
async def get_all_server_requests(status: Optional[str] = None, current_user: dict = Depends(get_current_user)):
    if current_user.get("role") not in ["Superadmin", "Admin"]:
        raise HTTPException(status_code=403, detail="Akses ditolak - Hanya Admin")
    return {"status": "success", "data": database.get_all_access_requests(status)}

@app.post("/api/server-access/{req_id}/review")
async def review_server_access(req_id: int, payload: ServerAccessReviewModel, current_user: dict = Depends(get_current_user)):
    if current_user.get("role") not in ["Superadmin", "Admin"]:
        raise HTTPException(status_code=403, detail="Akses ditolak - Hanya Admin")
        
    req = database.get_request_by_id(req_id)
    if not req:
        raise HTTPException(status_code=404, detail="Permit tidak ditemukan")
        
    database.update_request_status(req_id, payload.status, current_user.get("name"), payload.reject_reason)
    database.log_action(current_user.get("id"), current_user.get("name"), f"PERMIT_REVIEW", f"Permit {req_id} {payload.status}")
    
    # Kirim email ke requester
    subj = f"HCS - Status Izin Akses Server: {payload.status.upper()}"
    status_color = "green" if payload.status == "approved" else "red"
    
    html = f"""
    <html><body>
    <h3>Update Status Izin Akses Server</h3>
    <p>Halo {req['requester_name']},</p>
    <p>Pengajuan izin akses server Anda telah direview oleh <b>{current_user.get('name')}</b>.</p>
    <p>Status: <b style="color:{status_color};">{payload.status.upper()}</b></p>
    """
    if payload.status == "rejected":
        html += f"<p><b>Alasan Penolakan:</b> {payload.reject_reason}</p>"
        
    html += """
    <p>Terima kasih,<br>Tim Home-Service</p>
    </body></html>
    """
    send_email_helper(req['requester_email'], subj, html)
    
    return {"status": "success"}

# --- AUDIT LOG API (Superadmin Only) ---
@app.get("/api/audit-log")
async def get_audit_log(current_user: dict = Depends(get_current_user)):
    if current_user.get("role") not in ["Superadmin", "Admin"]:
        raise HTTPException(status_code=403, detail="Akses ditolak - Admin only")
    return {"status": "success", "data": database.get_audit_log()}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
