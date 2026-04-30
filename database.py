import sqlite3
import os
import bcrypt
from cryptography.fernet import Fernet
from dotenv import load_dotenv

load_dotenv()

# --- ENCRYPTION HELPERS ---
_fernet_key = os.getenv("FIELD_ENCRYPT_KEY", "").encode()
_fernet = Fernet(_fernet_key) if _fernet_key else None

def encrypt(text: str) -> str:
    if not _fernet or not text:
        return text
    return _fernet.encrypt(text.encode()).decode()

def decrypt(text: str) -> str:
    if not _fernet or not text:
        return text
    try:
        return _fernet.decrypt(text.encode()).decode()
    except Exception:
        return text  # Data lama yang belum dienkripsi, kembalikan apa adanya

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()

def check_password(plain: str, hashed: str) -> bool:
    try:
        return bcrypt.checkpw(plain.encode(), hashed.encode())
    except Exception:
        return plain == hashed  # Fallback untuk data lama (plaintext)

DATA_DIR = os.path.join(os.path.dirname(__file__), "data")
os.makedirs(DATA_DIR, exist_ok=True)
DB_PATH = os.path.join(DATA_DIR, "homeservice_v3.db")

def init_db():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    # Table Users (dengan Email & Password)
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            email TEXT UNIQUE,
            password TEXT,
            name TEXT,
            role TEXT DEFAULT 'Staff',
            avatar_filename TEXT
        )
    ''')

    # Table Master AC Assets
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS ac_assets (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            branch TEXT,
            room TEXT,
            ac_type TEXT,
            details TEXT
        )
    ''')

    # Table Master Server Assets
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS server_assets (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            branch TEXT,
            server_location TEXT
        )
    ''')

    # Table Master APAR Assets
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS apar_assets (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            branch TEXT,
            apar_location TEXT,
            fill_date TEXT,
            expiry_date TEXT
        )
    ''')

    # Table Master KWH Assets
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS kwh_assets (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            branch TEXT,
            kwh_location TEXT
        )
    ''')

    # Table Master Tugas (SPK)
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS jobs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT,
            branch TEXT,
            assigned_to INTEGER,
            status TEXT DEFAULT 'pending',
            target_qty INTEGER DEFAULT 0,
            completed_qty INTEGER DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')

    # Table Job Progress (Per AC)
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS job_progress (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            job_id INTEGER,
            asset_id INTEGER,
            before_photo TEXT,
            after_photo TEXT,
            notes TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    # Init Superadmin jika belum ada
    cursor.execute("SELECT COUNT(*) FROM users")
    if cursor.fetchone()[0] == 0:
        cursor.execute("INSERT INTO users (email, password, name, role) VALUES (?, ?, ?, ?)", 
                       ('superadminhcs@homeservice.com', 'admin123', 'Bos Superadmin', 'Superadmin'))
        cursor.execute("INSERT INTO users (email, password, name, role) VALUES (?, ?, ?, ?)", 
                       ('teknisi@homeservice.com', 'teknisi123', 'Agus Teknisi', 'Staff'))
    else:
        # Cek apakah superadmin baru sudah ada, kalau belum tambahkan
        cursor.execute("SELECT COUNT(*) FROM users WHERE email='superadminhcs@homeservice.com'")
        if cursor.fetchone()[0] == 0:
             cursor.execute("INSERT INTO users (email, password, name, role) VALUES (?, ?, ?, ?)", 
                           ('superadminhcs@homeservice.com', 'admin123', 'Bos Superadmin', 'Superadmin'))
        
    conn.commit()
    conn.close()    

# --- USER AUTHENTICATION & PROFILE ---
def get_user_by_email(email: str):
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("SELECT id, email, password, name, role, avatar_filename FROM users WHERE email=?", (email,))
    r = cursor.fetchone()
    conn.close()
    if r:
        return {
            "id": r[0],
            "email": r[1],
            "password": r[2],
            "name": decrypt(r[3]),   # Dekripsi nama saat dibaca
            "role": r[4],
            "avatar_filename": r[5]
        }
    return None

def create_user(email, password, name, role):
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    try:
        hashed_pw = hash_password(password)   # Hash password
        enc_name  = encrypt(name)             # Enkripsi nama
        cursor.execute("INSERT INTO users (email, password, name, role) VALUES (?, ?, ?, ?)",
                       (email, hashed_pw, enc_name, role))
        conn.commit()
        user_id = cursor.lastrowid
        conn.close()
        return user_id
    except sqlite3.IntegrityError:
        conn.close()
        return None

def get_user(user_id: int):
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("SELECT id, email, name, role, avatar_filename FROM users WHERE id=?", (user_id,))
    r = cursor.fetchone()
    conn.close()
    if r:
        return {
            "id": r[0],
            "email": r[1],
            "name": decrypt(r[2]),   # Dekripsi nama saat dibaca
            "role": r[3],
            "avatar_filename": r[4]
        }
    return None

def update_user_profile(user_id: int, name: str, role: str):
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    enc_name = encrypt(name)    # Enkripsi nama sebelum simpan
    cursor.execute("UPDATE users SET name=?, role=? WHERE id=?", (enc_name, role, user_id))
    conn.commit()
    conn.close()
    return True

def update_user_password(user_id: int, new_password: str):
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    hashed = hash_password(new_password)    # Hash password sebelum simpan
    cursor.execute("UPDATE users SET password=? WHERE id=?", (hashed, user_id))
    conn.commit()
    conn.close()
    return True

def update_user_avatar(user_id: int, filename: str):
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("UPDATE users SET avatar_filename=? WHERE id=?", (filename, user_id))
    conn.commit()
    conn.close()
    return True

# --- ASSETS MANAGEMENT ---
def create_asset(branch: str, room: str, ac_type: str, details: str):
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("INSERT INTO ac_assets (branch, room, ac_type, details) VALUES (?, ?, ?, ?)", (branch, room, ac_type, details))
    conn.commit()
    asset_id = cursor.lastrowid
    conn.close()
    return asset_id

def get_assets_by_branch(branch: str):
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    if branch:
        cursor.execute("SELECT * FROM ac_assets WHERE branch=?", (branch,))
    else:
        cursor.execute("SELECT * FROM ac_assets")
    rows = cursor.fetchall()
    conn.close()
    return [{"id": r[0], "branch": r[1], "room": r[2], "ac_type": r[3], "details": r[4]} for r in rows]

def update_asset(asset_id: int, branch: str, room: str, ac_type: str, details: str):
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("UPDATE ac_assets SET branch=?, room=?, ac_type=?, details=? WHERE id=?", 
                   (branch, room, ac_type, details, asset_id))
    conn.commit()
    conn.close()
    return True

def delete_asset(asset_id: int):
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("DELETE FROM ac_assets WHERE id=?", (asset_id,))
    conn.commit()
    conn.close()
    return True

# --- SERVER ASSETS ---
def create_server_asset(branch: str, server_location: str):
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("INSERT INTO server_assets (branch, server_location) VALUES (?, ?)", (branch, server_location))
    conn.commit()
    asset_id = cursor.lastrowid
    conn.close()
    return asset_id

def get_server_assets():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM server_assets")
    rows = cursor.fetchall()
    conn.close()
    return [{"id": r[0], "branch": r[1], "server_location": r[2]} for r in rows]

def delete_server_asset(asset_id: int):
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("DELETE FROM server_assets WHERE id=?", (asset_id,))
    conn.commit()
    conn.close()
    return True

# --- APAR ASSETS ---
def create_apar_asset(branch: str, apar_location: str, fill_date: str, expiry_date: str):
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("INSERT INTO apar_assets (branch, apar_location, fill_date, expiry_date) VALUES (?, ?, ?, ?)", 
                   (branch, apar_location, fill_date, expiry_date))
    conn.commit()
    asset_id = cursor.lastrowid
    conn.close()
    return asset_id

def get_apar_assets():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM apar_assets")
    rows = cursor.fetchall()
    conn.close()
    return [{"id": r[0], "branch": r[1], "apar_location": r[2], "fill_date": r[3], "expiry_date": r[4]} for r in rows]

def delete_apar_asset(asset_id: int):
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("DELETE FROM apar_assets WHERE id=?", (asset_id,))
    conn.commit()
    conn.close()
    return True

def update_apar_asset(asset_id: int, fill_date: str, expiry_date: str):
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("UPDATE apar_assets SET fill_date=?, expiry_date=? WHERE id=?", 
                   (fill_date, expiry_date, asset_id))
    conn.commit()
    conn.close()
    return True


# --- KWH ASSETS ---
def create_kwh_asset(branch: str, kwh_location: str):
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("INSERT INTO kwh_assets (branch, kwh_location) VALUES (?, ?)", (branch, kwh_location))
    conn.commit()
    asset_id = cursor.lastrowid
    conn.close()
    return asset_id

def get_kwh_assets():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM kwh_assets")
    rows = cursor.fetchall()
    conn.close()
    return [{"id": r[0], "branch": r[1], "kwh_location": r[2]} for r in rows]

def delete_kwh_asset(asset_id: int):
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("DELETE FROM kwh_assets WHERE id=?", (asset_id,))
    conn.commit()
    conn.close()
    return True

# --- SPK / JOBS MANAGEMENT ---
def create_job(title: str, branch: str, assigned_to: int):
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    # Hitung target qty dari branch
    cursor.execute("SELECT COUNT(*) FROM ac_assets WHERE branch=?", (branch,))
    target_qty = cursor.fetchone()[0]
    
    cursor.execute("INSERT INTO jobs (title, branch, assigned_to, target_qty, completed_qty, status) VALUES (?, ?, ?, ?, ?, ?)", 
                   (title, branch, assigned_to, target_qty, 0, 'pending'))
    conn.commit()
    job_id = cursor.lastrowid
    conn.close()
    return job_id

def get_jobs(user_id: int = None, role: str = None):
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    if role == 'Superadmin':
        cursor.execute("SELECT * FROM jobs ORDER BY id DESC")
    else:
        cursor.execute("SELECT * FROM jobs WHERE assigned_to=? ORDER BY id DESC", (user_id,))
    rows = cursor.fetchall()
    conn.close()
    
    jobs = []
    for r in rows:
        jobs.append({
            "id": r[0], "title": r[1], "branch": r[2], "assigned_to": r[3], 
            "status": r[4], "target_qty": r[5], "completed_qty": r[6], "created_at": r[7]
        })
    return jobs

def get_job_details(job_id: int):
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM jobs WHERE id=?", (job_id,))
    r = cursor.fetchone()
    if not r:
        conn.close()
        return None
    
    job_data = {
        "id": r[0], "title": r[1], "branch": r[2], "assigned_to": r[3], 
        "status": r[4], "target_qty": r[5], "completed_qty": r[6], "created_at": r[7]
    }
    
    # Fetch progress
    cursor.execute("SELECT asset_id, before_photo, after_photo, notes FROM job_progress WHERE job_id=?", (job_id,))
    progress_rows = cursor.fetchall()
    progress_dict = {p[0]: {"before_photo": p[1], "after_photo": p[2], "notes": p[3]} for p in progress_rows}
    
    conn.close()
    return {"job": job_data, "progress": progress_dict}

def submit_progress(job_id: int, asset_id: int, before_photo: str, after_photo: str, notes: str):
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    # Cek apakah progress sudah ada untuk asset ini di job ini
    cursor.execute("SELECT id FROM job_progress WHERE job_id=? AND asset_id=?", (job_id, asset_id))
    existing = cursor.fetchone()
    
    if existing:
        cursor.execute("UPDATE job_progress SET before_photo=?, after_photo=?, notes=? WHERE id=?", 
                       (before_photo, after_photo, notes, existing[0]))
    else:
        cursor.execute("INSERT INTO job_progress (job_id, asset_id, before_photo, after_photo, notes) VALUES (?, ?, ?, ?, ?)",
                       (job_id, asset_id, before_photo, after_photo, notes))
        
        # Increment completed_qty
        cursor.execute("UPDATE jobs SET completed_qty = completed_qty + 1 WHERE id=?", (job_id,))
        
    # Cek apakah sudah selesai semua
    cursor.execute("SELECT target_qty, completed_qty FROM jobs WHERE id=?", (job_id,))
    qty = cursor.fetchone()
    if qty[0] > 0 and qty[1] >= qty[0]:
        cursor.execute("UPDATE jobs SET status='completed' WHERE id=?", (job_id,))
    else:
        cursor.execute("UPDATE jobs SET status='pending' WHERE id=?", (job_id,))
        
    conn.commit()
    conn.close()
    return True
def delete_job(job_id: int):
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("DELETE FROM jobs WHERE id=?", (job_id,))
    cursor.execute("DELETE FROM job_progress WHERE job_id=?", (job_id,))
    conn.commit()
    conn.close()
    return True

# Inisialisasi otomatis
init_db()
