"""
Script migrasi Phase 3: Enkripsi data lama di database.
Jalankan SEKALI di server setelah deploy Phase 3.
Aman dijalankan berkali-kali (cek data yang sudah diproses).
"""
import sqlite3
import os
import bcrypt
from cryptography.fernet import Fernet
from dotenv import load_dotenv

load_dotenv()

DATA_DIR = os.path.join(os.path.dirname(__file__), "data")
DB_PATH = os.path.join(DATA_DIR, "homeservice_v3.db")

_fernet_key = os.getenv("FIELD_ENCRYPT_KEY", "").encode()
if not _fernet_key:
    print("❌ ERROR: FIELD_ENCRYPT_KEY tidak ditemukan di .env!")
    exit(1)

_fernet = Fernet(_fernet_key)

def is_bcrypt_hash(s: str) -> bool:
    return s.startswith("$2b$") or s.startswith("$2a$")

def is_encrypted(s: str) -> bool:
    return s.startswith("gAAAAA")

def migrate():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    print("🔄 Memulai migrasi database Phase 3...")
    print(f"   Database: {DB_PATH}")
    
    # Migrate tabel users
    cursor.execute("SELECT id, password, name FROM users")
    users = cursor.fetchall()
    print(f"\n📋 Ditemukan {len(users)} user untuk diproses...")
    
    migrated_count = 0
    for user in users:
        uid, password, name = user
        changes = {}
        
        # Hash password kalau masih plaintext
        if not is_bcrypt_hash(password):
            changes['password'] = bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()
            print(f"  ✅ User #{uid}: Password di-hash (dari plaintext)")
        else:
            print(f"  ⏭️  User #{uid}: Password sudah berupa hash, skip")
        
        # Enkripsi nama kalau belum dienkripsi
        if name and not is_encrypted(name):
            changes['name'] = _fernet.encrypt(name.encode()).decode()
            print(f"  ✅ User #{uid}: Nama dienkripsi")
        elif name:
            print(f"  ⏭️  User #{uid}: Nama sudah terenkripsi, skip")
        
        if changes:
            for col, val in changes.items():
                cursor.execute(f"UPDATE users SET {col}=? WHERE id=?", (val, uid))
            migrated_count += 1
    
    conn.commit()
    print(f"\n✅ Migrasi selesai! {migrated_count} dari {len(users)} user diperbarui.")
    print("🔐 Database sekarang aman dengan bcrypt + enkripsi Fernet AES-256.")
    conn.close()

if __name__ == "__main__":
    migrate()
