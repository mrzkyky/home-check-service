import sqlite3
import os

DATA_DIR = os.path.join(os.path.dirname(__file__), "data")
os.makedirs(DATA_DIR, exist_ok=True)
DB_PATH = os.path.join(DATA_DIR, "homeservice_v2.db")

def init_db():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    # Table untuk Tugas Maintenance
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS jobs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            type TEXT NOT NULL,
            status TEXT DEFAULT 'pending',
            location_lat REAL,
            location_lng REAL,
            notes TEXT,
            branch TEXT,
            room TEXT,
            agenda TEXT,
            job_date TEXT,
            due_date TEXT,
            technician_name TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    # Table untuk Dokumentasi Foto
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS photos (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            job_id INTEGER,
            type TEXT NOT NULL, -- 'before' atau 'after'
            filename TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(job_id) REFERENCES jobs(id)
        )
    ''')
    
    # Table untuk User / Profil
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            name TEXT NOT NULL,
            role TEXT NOT NULL,
            avatar_filename TEXT
        )
    ''')
    
    # Insert default user jika tabel users masih kosong
    cursor.execute("SELECT COUNT(*) FROM users")
    if cursor.fetchone()[0] == 0:
        cursor.execute("INSERT INTO users (username, password, name, role) VALUES ('admin', 'admin123', 'John Doe Default', 'Teknisi Utama')")
        
    conn.commit()
    conn.close()

def get_jobs():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM jobs ORDER BY id DESC")
    rows = cursor.fetchall()
    conn.close()
    
    jobs = []
    for r in rows:
        jobs.append({
            "id": r[0],
            "title": r[1],
            "type": r[2],
            "status": r[3],
            "location_lat": r[4],
            "location_lng": r[5],
            "notes": r[6],
            "branch": r[7],
            "room": r[8],
            "agenda": r[9],
            "job_date": r[10],
            "due_date": r[11],
            "technician_name": r[12],
            "created_at": r[13]
        })
    return jobs

def get_job_by_id(job_id: int):
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM jobs WHERE id=?", (job_id,))
    r = cursor.fetchone()
    
    if not r:
        conn.close()
        return None
        
    cursor.execute("SELECT type, filename FROM photos WHERE job_id=?", (job_id,))
    photos = cursor.fetchall()
    conn.close()
    
    return {
        "id": r[0],
        "title": r[1],
        "type": r[2],
        "status": r[3],
        "location_lat": r[4],
        "location_lng": r[5],
        "notes": r[6],
        "branch": r[7],
        "room": r[8],
        "agenda": r[9],
        "job_date": r[10],
        "due_date": r[11],
        "technician_name": r[12],
        "created_at": r[13],
        "photos": [{"type": p[0], "filename": p[1]} for p in photos]
    }

def create_job(title: str, j_type: str):
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("INSERT INTO jobs (title, type) VALUES (?, ?)", (title, j_type))
    conn.commit()
    job_id = cursor.lastrowid
    conn.close()
    return job_id

def update_job_report(job_id: int, status: str, notes: str, lat: float, lng: float, branch: str, room: str, agenda: str, job_date: str, due_date: str, technician_name: str):
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute('''
        UPDATE jobs 
        SET status=?, notes=?, location_lat=?, location_lng=?, 
            branch=?, room=?, agenda=?, job_date=?, due_date=?, technician_name=? 
        WHERE id=?
    ''', (status, notes, lat, lng, branch, room, agenda, job_date, due_date, technician_name, job_id))
    conn.commit()
    conn.close()
    return True

def add_photo(job_id: int, p_type: str, filename: str):
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("INSERT INTO photos (job_id, type, filename) VALUES (?, ?, ?)", (job_id, p_type, filename))
    conn.commit()
    conn.close()
    return True

def get_user(user_id: int):
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("SELECT id, username, name, role, avatar_filename FROM users WHERE id=?", (user_id,))
    r = cursor.fetchone()
    conn.close()
    if r:
        return {"id": r[0], "username": r[1], "name": r[2], "role": r[3], "avatar_filename": r[4]}
    return None

def update_user_profile(user_id: int, name: str, role: str):
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("UPDATE users SET name=?, role=? WHERE id=?", (name, role, user_id))
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

# Inisialisasi otomatis
init_db()
