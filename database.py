import sqlite3
import os
import bcrypt
import uuid
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
            details TEXT,
            regional TEXT,
            building TEXT,
            ac_brand TEXT,
            ac_pk REAL,
            ac_vendor TEXT,
            install_date TEXT
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

    # Table Audit Log
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS audit_log (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            user_name TEXT,
            action TEXT,
            detail TEXT,
            ip TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')

    # Table Server Access Requests (Permit Izin Masuk Server)
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS server_access_requests (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            requester_name TEXT NOT NULL,
            jabatan TEXT,
            requester_email TEXT NOT NULL,
            server_id INTEGER,
            server_info TEXT,
            purpose TEXT,
            access_date TEXT,
            status TEXT DEFAULT 'pending',
            token TEXT UNIQUE,
            reviewed_by TEXT,
            reviewed_at TEXT,
            reject_reason TEXT,
            whatsapp_number TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')

    # Table Settings
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS settings (
            key TEXT PRIMARY KEY,
            value TEXT
        )
    ''')

    # CMMS: Monitoring Harian
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS monitoring_harian (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            tanggal TEXT NOT NULL,
            id_ac INTEGER,
            suhu REAL,
            kelembaban REAL,
            status_unit TEXT,
            kebocoran BOOLEAN,
            catatan TEXT,
            petugas TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(id_ac) REFERENCES ac_assets(id) ON DELETE CASCADE
        )
    ''')

    # CMMS: Jadwal PM
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS jadwal_pm (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            id_ac INTEGER,
            lokasi TEXT,
            jenis_pm TEXT,
            frekuensi_bulan INTEGER,
            pm_terakhir TEXT,
            next_pm TEXT,
            status TEXT DEFAULT 'Scheduled',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(id_ac) REFERENCES ac_assets(id) ON DELETE CASCADE
        )
    ''')

    # CMMS: Checklist PM
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS checklist_pm (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            tanggal TEXT NOT NULL,
            id_ac INTEGER,
            filter_status TEXT,
            evaporator TEXT,
            kondensor TEXT,
            drainase TEXT,
            fan_motor TEXT,
            refrigerant TEXT,
            terminal TEXT,
            status_pm TEXT,
            petugas TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(id_ac) REFERENCES ac_assets(id) ON DELETE CASCADE
        )
    ''')

    # CMMS: Dokumentasi
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS dokumentasi (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            tanggal TEXT NOT NULL,
            id_ac INTEGER,
            jenis_kegiatan TEXT,
            link_foto_before TEXT,
            link_foto_after TEXT,
            keterangan TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(id_ac) REFERENCES ac_assets(id) ON DELETE CASCADE
        )
    ''')

    # CMMS: Approval
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS approval (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            tanggal TEXT NOT NULL,
            id_ac INTEGER,
            pekerjaan TEXT,
            pelaksana TEXT,
            supervisor TEXT,
            engineering_support TEXT,
            status TEXT DEFAULT 'Pending',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(id_ac) REFERENCES ac_assets(id) ON DELETE CASCADE
        )
    ''')

    # Alter table ac_assets untuk data lama
    new_cols = {
        'regional': 'TEXT', 'building': 'TEXT', 'ac_brand': 'TEXT',
        'ac_pk': 'REAL', 'ac_vendor': 'TEXT', 'install_date': 'TEXT'
    }
    for col, ctype in new_cols.items():
        try:
            cursor.execute(f"ALTER TABLE ac_assets ADD COLUMN {col} {ctype}")
        except sqlite3.OperationalError:
            pass

    # Alter table untuk data lama (tambah whatsapp_number jika belum ada)
    try:
        cursor.execute("ALTER TABLE server_access_requests ADD COLUMN whatsapp_number TEXT")
    except sqlite3.OperationalError:
        pass  # Kolom sudah ada

    # Init Superadmin jika belum ada
    cursor.execute("SELECT COUNT(*) FROM users")
    if cursor.fetchone()[0] == 0:
        cursor.execute("INSERT INTO users (email, password, name, role) VALUES (?, ?, ?, ?)",
                       ('superadminhcs@homeservice.com', hash_password('admin123'), encrypt('Bos Superadmin'), 'Superadmin'))
        cursor.execute("INSERT INTO users (email, password, name, role) VALUES (?, ?, ?, ?)",
                       ('teknisi@homeservice.com', hash_password('teknisi123'), encrypt('Agus Teknisi'), 'Staff'))
    else:
        cursor.execute("SELECT COUNT(*) FROM users WHERE email='superadminhcs@homeservice.com'")
        if cursor.fetchone()[0] == 0:
            cursor.execute("INSERT INTO users (email, password, name, role) VALUES (?, ?, ?, ?)",
                           ('superadminhcs@homeservice.com', hash_password('admin123'), encrypt('Bos Superadmin'), 'Superadmin'))

    conn.commit()
    conn.close()

# --- AUDIT LOG ---
def log_action(user_id: int, user_name: str, action: str, detail: str, ip: str = ""):
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("INSERT INTO audit_log (user_id, user_name, action, detail, ip) VALUES (?, ?, ?, ?, ?)",
                   (user_id, user_name, action, detail, ip))
    conn.commit()
    conn.close()

def get_audit_log(limit: int = 200):
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("SELECT id, user_id, user_name, action, detail, ip, created_at FROM audit_log ORDER BY id DESC LIMIT ?", (limit,))
    rows = cursor.fetchall()
    conn.close()
    return [{"id": r[0], "user_id": r[1], "user_name": r[2], "action": r[3], "detail": r[4], "ip": r[5], "created_at": r[6]} for r in rows]

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
def create_asset(branch: str, room: str, ac_type: str, details: str, regional: str = "", building: str = "", ac_brand: str = "", ac_pk: float = 0.0, ac_vendor: str = "", install_date: str = ""):
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO ac_assets (branch, room, ac_type, details, regional, building, ac_brand, ac_pk, ac_vendor, install_date) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""", 
        (branch, room, ac_type, details, regional, building, ac_brand, ac_pk, ac_vendor, install_date))
    conn.commit()
    asset_id = cursor.lastrowid
    conn.close()
    return asset_id

def get_assets_by_branch(branch: str = None):
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    if branch:
        cursor.execute("SELECT * FROM ac_assets WHERE branch=?", (branch,))
    else:
        cursor.execute("SELECT * FROM ac_assets")
    rows = cursor.fetchall()
    conn.close()
    
    # Menangani baris lama yang mungkin kurang kolom
    result = []
    for r in rows:
        regional = r[5] if len(r) > 5 else ""
        building = r[6] if len(r) > 6 else ""
        ac_brand = r[7] if len(r) > 7 else ""
        ac_pk = r[8] if len(r) > 8 else 0.0
        ac_vendor = r[9] if len(r) > 9 else ""
        install_date = r[10] if len(r) > 10 else ""
        result.append({
            "id": r[0], "branch": r[1], "room": r[2], "ac_type": r[3], "details": r[4], 
            "regional": regional, "building": building, "ac_brand": ac_brand, "ac_pk": ac_pk, "ac_vendor": ac_vendor, "install_date": install_date
        })
    return result

def update_asset(asset_id: int, branch: str, room: str, ac_type: str, details: str, regional: str = "", building: str = "", ac_brand: str = "", ac_pk: float = 0.0, ac_vendor: str = "", install_date: str = ""):
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("""
        UPDATE ac_assets 
        SET branch=?, room=?, ac_type=?, details=?, regional=?, building=?, ac_brand=?, ac_pk=?, ac_vendor=?, install_date=? 
        WHERE id=?""", 
        (branch, room, ac_type, details, regional, building, ac_brand, ac_pk, ac_vendor, install_date, asset_id))
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

# --- CMMS API: Monitoring Harian ---
def create_monitoring(tanggal: str, id_ac: int, suhu: float, kelembaban: float, status_unit: str, kebocoran: bool, catatan: str, petugas: str):
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO monitoring_harian (tanggal, id_ac, suhu, kelembaban, status_unit, kebocoran, catatan, petugas)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    """, (tanggal, id_ac, suhu, kelembaban, status_unit, kebocoran, catatan, petugas))
    conn.commit()
    m_id = cursor.lastrowid
    conn.close()
    return m_id

def get_monitoring(branch: str = None, limit: int = 100):
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    query = """
        SELECT m.id, m.tanggal, m.id_ac, a.room, a.ac_brand, m.suhu, m.kelembaban, m.status_unit, m.kebocoran, m.catatan, m.petugas 
        FROM monitoring_harian m
        JOIN ac_assets a ON m.id_ac = a.id
    """
    params = []
    if branch:
        query += " WHERE a.branch = ?"
        params.append(branch)
    query += " ORDER BY m.id DESC LIMIT ?"
    params.append(limit)
    cursor.execute(query, tuple(params))
    rows = cursor.fetchall()
    conn.close()
    return [{"id": r[0], "tanggal": r[1], "id_ac": r[2], "room": r[3], "ac_brand": r[4] if r[4] else "", "suhu": r[5], "kelembaban": r[6], "status_unit": r[7], "kebocoran": bool(r[8]), "catatan": r[9], "petugas": r[10]} for r in rows]

# --- CMMS API: Jadwal PM ---
def create_jadwal_pm(id_ac: int, lokasi: str, jenis_pm: str, frekuensi_bulan: int, pm_terakhir: str, next_pm: str, status: str = 'Scheduled'):
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO jadwal_pm (id_ac, lokasi, jenis_pm, frekuensi_bulan, pm_terakhir, next_pm, status)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    """, (id_ac, lokasi, jenis_pm, frekuensi_bulan, pm_terakhir, next_pm, status))
    conn.commit()
    j_id = cursor.lastrowid
    conn.close()
    return j_id

def get_jadwal_pm(branch: str = None):
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    query = """
        SELECT j.id, j.id_ac, j.lokasi, j.jenis_pm, j.frekuensi_bulan, j.pm_terakhir, j.next_pm, j.status, a.room, a.branch
        FROM jadwal_pm j
        JOIN ac_assets a ON j.id_ac = a.id
    """
    if branch:
        query += " WHERE a.branch = ?"
        cursor.execute(query, (branch,))
    else:
        cursor.execute(query)
    rows = cursor.fetchall()
    conn.close()
    return [{"id": r[0], "id_ac": r[1], "lokasi": r[2], "jenis_pm": r[3], "frekuensi_bulan": r[4], "pm_terakhir": r[5], "next_pm": r[6], "status": r[7], "room": r[8], "branch": r[9]} for r in rows]

# --- CMMS API: Checklist PM ---
def create_checklist_pm(tanggal: str, id_ac: int, filter_status: str, evaporator: str, kondensor: str, drainase: str, fan_motor: str, refrigerant: str, terminal: str, status_pm: str, petugas: str):
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO checklist_pm (tanggal, id_ac, filter_status, evaporator, kondensor, drainase, fan_motor, refrigerant, terminal, status_pm, petugas)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (tanggal, id_ac, filter_status, evaporator, kondensor, drainase, fan_motor, refrigerant, terminal, status_pm, petugas))
    conn.commit()
    c_id = cursor.lastrowid
    
    # Auto update jadwal_pm terakhir jika ada
    cursor.execute("SELECT id, frekuensi_bulan FROM jadwal_pm WHERE id_ac=? ORDER BY id DESC LIMIT 1", (id_ac,))
    jadwal = cursor.fetchone()
    if jadwal:
        from datetime import datetime
        from dateutil.relativedelta import relativedelta
        # Menghitung next PM
        dt_terakhir = datetime.strptime(tanggal, '%Y-%m-%d')
        next_dt = dt_terakhir + relativedelta(months=jadwal[1])
        next_pm = next_dt.strftime('%Y-%m-%d')
        cursor.execute("UPDATE jadwal_pm SET pm_terakhir=?, next_pm=?, status='Scheduled' WHERE id=?", (tanggal, next_pm, jadwal[0]))
        conn.commit()
        
    conn.close()
    return c_id

def get_checklist_pm(id_ac: int):
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM checklist_pm WHERE id_ac=? ORDER BY id DESC", (id_ac,))
    rows = cursor.fetchall()
    conn.close()
    return [{"id": r[0], "tanggal": r[1], "id_ac": r[2], "filter_status": r[3], "evaporator": r[4], "kondensor": r[5], "drainase": r[6], "fan_motor": r[7], "refrigerant": r[8], "terminal": r[9], "status_pm": r[10], "petugas": r[11]} for r in rows]

# --- CMMS API: Dokumentasi & Approval ---
def create_dokumentasi(tanggal: str, id_ac: int, jenis_kegiatan: str, link_foto_before: str, link_foto_after: str, keterangan: str):
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO dokumentasi (tanggal, id_ac, jenis_kegiatan, link_foto_before, link_foto_after, keterangan)
        VALUES (?, ?, ?, ?, ?, ?)
    """, (tanggal, id_ac, jenis_kegiatan, link_foto_before, link_foto_after, keterangan))
    conn.commit()
    d_id = cursor.lastrowid
    conn.close()
    return d_id

def get_dokumentasi(id_ac: int):
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM dokumentasi WHERE id_ac=? ORDER BY id DESC", (id_ac,))
    rows = cursor.fetchall()
    conn.close()
    return [{"id": r[0], "tanggal": r[1], "id_ac": r[2], "jenis_kegiatan": r[3], "link_foto_before": r[4], "link_foto_after": r[5], "keterangan": r[6]} for r in rows]

def create_approval(tanggal: str, id_ac: int, pekerjaan: str, pelaksana: str, supervisor: str, engineering_support: str):
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO approval (tanggal, id_ac, pekerjaan, pelaksana, supervisor, engineering_support, status)
        VALUES (?, ?, ?, ?, ?, ?, 'Pending')
    """, (tanggal, id_ac, pekerjaan, pelaksana, supervisor, engineering_support))
    conn.commit()
    a_id = cursor.lastrowid
    conn.close()
    return a_id

def get_approvals(status: str = None):
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    query = """
        SELECT a.id, a.tanggal, a.id_ac, ac.room, a.pekerjaan, a.pelaksana, a.supervisor, a.engineering_support, a.status 
        FROM approval a
        JOIN ac_assets ac ON a.id_ac = ac.id
    """
    if status:
        query += " WHERE a.status = ?"
        cursor.execute(query, (status,))
    else:
        cursor.execute(query)
    rows = cursor.fetchall()
    conn.close()
    return [{"id": r[0], "tanggal": r[1], "id_ac": r[2], "room": r[3], "pekerjaan": r[4], "pelaksana": r[5], "supervisor": r[6], "engineering_support": r[7], "status": r[8]} for r in rows]

def update_approval_status(approval_id: int, status: str):
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("UPDATE approval SET status=? WHERE id=?", (status, approval_id))
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
    
    # Hitung target qty dari tabel aset yang sesuai berdasarkan judul SPK
    title_lower = title.lower()
    if 'server' in title_lower:
        cursor.execute("SELECT COUNT(*) FROM server_assets WHERE branch=?", (branch,))
    elif 'apar' in title_lower:
        cursor.execute("SELECT COUNT(*) FROM apar_assets WHERE branch=?", (branch,))
    elif 'kwh' in title_lower or 'listrik' in title_lower:
        cursor.execute("SELECT COUNT(*) FROM kwh_assets WHERE branch=?", (branch,))
    else:
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
    if role in ['Superadmin', 'Admin']:
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

# --- SERVER ACCESS PERMIT ---
def create_access_request(requester_name: str, jabatan: str, requester_email: str,
                          server_id: int, server_info: str, purpose: str, access_date: str, whatsapp_number: str = "") -> dict:
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    token = uuid.uuid4().hex[:12].upper()
    cursor.execute(
        """INSERT INTO server_access_requests
           (requester_name, jabatan, requester_email, server_id, server_info, purpose, access_date, token, whatsapp_number)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)""",
        (requester_name, jabatan, requester_email, server_id, server_info, purpose, access_date, token, whatsapp_number)
    )
    conn.commit()
    req_id = cursor.lastrowid
    conn.close()
    return {"id": req_id, "token": token}

def get_all_access_requests(status_filter: str = None) -> list:
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    query = "SELECT id, requester_name, jabatan, requester_email, server_id, server_info, purpose, access_date, status, token, reviewed_by, reviewed_at, reject_reason, created_at, whatsapp_number FROM server_access_requests"
    if status_filter:
        cursor.execute(f"{query} WHERE status=? ORDER BY id DESC", (status_filter,))
    else:
        cursor.execute(f"{query} ORDER BY id DESC")
    rows = cursor.fetchall()
    conn.close()
    return [_row_to_request(r) for r in rows]

def get_request_by_token(token: str) -> dict:
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("SELECT id, requester_name, jabatan, requester_email, server_id, server_info, purpose, access_date, status, token, reviewed_by, reviewed_at, reject_reason, created_at, whatsapp_number FROM server_access_requests WHERE token=?", (token,))
    r = cursor.fetchone()
    conn.close()
    return _row_to_request(r) if r else None

def get_request_by_id(req_id: int) -> dict:
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("SELECT id, requester_name, jabatan, requester_email, server_id, server_info, purpose, access_date, status, token, reviewed_by, reviewed_at, reject_reason, created_at, whatsapp_number FROM server_access_requests WHERE id=?", (req_id,))
    r = cursor.fetchone()
    conn.close()
    return _row_to_request(r) if r else None

def update_request_status(req_id: int, status: str, reviewed_by: str, reject_reason: str = "") -> bool:
    from datetime import datetime
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    now = datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S")
    cursor.execute(
        """UPDATE server_access_requests
           SET status=?, reviewed_by=?, reviewed_at=?, reject_reason=?
           WHERE id=?""",
        (status, reviewed_by, now, reject_reason, req_id)
    )
    conn.commit()
    conn.close()
    return True

def _row_to_request(r) -> dict:
    return {
        "id": r[0],
        "requester_name": r[1],
        "jabatan": r[2],
        "requester_email": r[3],
        "server_id": r[4],
        "server_info": r[5],
        "purpose": r[6],
        "access_date": r[7],
        "status": r[8],
        "token": r[9],
        "reviewed_by": r[10],
        "reviewed_at": r[11],
        "reject_reason": r[12],
        "created_at": r[13],
        "whatsapp_number": r[14] if len(r) > 14 else ""
    }

# --- USER MANAGEMENT & SETTINGS ---
def get_all_users() -> list:
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("SELECT id, email, name, role FROM users")
    rows = cursor.fetchall()
    conn.close()
    return [{"id": r[0], "email": r[1], "name": decrypt(r[2]), "role": r[3]} for r in rows]

def update_user_role(user_id: int, role: str) -> bool:
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("UPDATE users SET role=? WHERE id=?", (role, user_id))
    conn.commit()
    conn.close()
    return True

def delete_user(user_id: int) -> bool:
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("DELETE FROM users WHERE id=?", (user_id,))
    conn.commit()
    conn.close()
    return True

def get_setting(key: str) -> str:
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("SELECT value FROM settings WHERE key=?", (key,))
    r = cursor.fetchone()
    conn.close()
    return r[0] if r else ""

def set_setting(key: str, value: str) -> bool:
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)", (key, value))
    conn.commit()
    conn.close()
    return True

# Inisialisasi otomatis
init_db()

