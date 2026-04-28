const API_BASE = `http://${window.location.hostname}:8087/api`;
let currentJobId = null;
let currentLat = 0.0;
let currentLng = 0.0;
let currentUserRole = "";

// Switch View Logic
window.switchView = function(viewId, navElement = null) {
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    document.getElementById(`view-${viewId}`).classList.add('active');
    
    if (navElement) {
        document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
        navElement.classList.add('active');
    }
    
    if (viewId === 'home') {
        loadActiveJobs();
    } else if (viewId === 'history') {
        loadHistory();
    }
}

// Start New Job
window.openJobForm = async function(type) {
    // Buat job baru di backend sebagai draft (pending)
    try {
        let res = await fetch(`${API_BASE}/jobs`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ title: `Draft: ${type}`, type: type })
        });
        let data = await res.json();
        
        currentJobId = data.job_id;
        document.getElementById('job-form-title').innerText = `Tugas: ${type}`;
        document.getElementById('job-title').value = "";
        document.getElementById('job-location').value = "";
        document.getElementById('job-notes').value = "";
        
        // Reset foto
        ['before', 'after'].forEach(t => {
            document.getElementById(`img-${t}`).src = "";
            document.getElementById(`img-${t}`).classList.add('hidden');
            document.getElementById(`label-${t}`).classList.remove('hidden');
        });
        
        // Tampilkan field khusus AC jika tipenya tentang AC
        let isAC = type.toLowerCase().includes('ac');
        let acFields = document.getElementById('cuci-ac-fields');
        if (acFields) {
            acFields.style.display = isAC ? 'block' : 'none';
        }
        
        // Auto-fill tanggal dan jatuh tempo
        let now = new Date();
        now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
        let nowStr = now.toISOString().slice(0, 16);
        let dateInput = document.getElementById('job-date');
        if (dateInput) {
            dateInput.value = nowStr;
            window.calculateDueDate();
        }
        
        // Logic Role Teknisi
        let techInput = document.getElementById('job-technician');
        let techNotice = document.getElementById('tech-role-notice');
        if (techInput) {
            if (currentUserRole !== 'Superadmin') {
                techInput.value = document.getElementById('user-name-display').innerText;
                techInput.setAttribute('readonly', true);
                techInput.style.backgroundColor = 'var(--border-color)';
                techNotice.style.display = 'block';
            } else {
                techInput.value = "";
                techInput.removeAttribute('readonly');
                techInput.style.backgroundColor = '';
                techNotice.style.display = 'none';
            }
        }
        
        switchView('job-form');
    } catch(e) {
        alert("Gagal koneksi ke server!");
    }
}

// Geolocation
window.getLocation = function() {
    let locInput = document.getElementById('job-location');
    locInput.value = "Mencari GPS...";
    
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                currentLat = pos.coords.latitude;
                currentLng = pos.coords.longitude;
                locInput.value = `${currentLat.toFixed(5)}, ${currentLng.toFixed(5)}`;
            },
            (err) => {
                alert("Gagal dapat GPS. Pastikan Location aktif.");
                locInput.value = "";
            },
            { enableHighAccuracy: true, timeout: 10000 }
        );
    } else {
        alert("Browser tidak mendukung GPS.");
    }
}

// Camera / Upload
window.triggerCamera = function(type) {
    document.getElementById(`cam-${type}`).click();
}

window.handlePhoto = async function(event, type) {
    const file = event.target.files[0];
    if (!file) return;
    
    // Preview gambar di kotak
    const reader = new FileReader();
    reader.onload = (e) => {
        document.getElementById(`img-${type}`).src = e.target.result;
        document.getElementById(`img-${type}`).classList.remove('hidden');
        document.getElementById(`label-${type}`).classList.add('hidden');
    };
    reader.readAsDataURL(file);
    
    // Langsung upload background
    let formData = new FormData();
    formData.append("type", type);
    formData.append("file", file);
    
    try {
        await fetch(`${API_BASE}/jobs/${currentJobId}/upload`, {
            method: 'POST',
            body: formData
        });
    } catch(e) {
        alert(`Gagal upload foto ${type}`);
    }
}

// Fitur Auto Hitung Jatuh Tempo AC (3 Bulan)
window.calculateDueDate = function() {
    let dateInput = document.getElementById('job-date');
    let dueDateInput = document.getElementById('job-due-date');
    if (!dateInput || !dueDateInput) return;
    
    let jobDate = new Date(dateInput.value);
    if (isNaN(jobDate.getTime())) return;
    
    // Tambah 3 Bulan
    jobDate.setMonth(jobDate.getMonth() + 3);
    
    // Format kembali ke datetime-local
    jobDate.setMinutes(jobDate.getMinutes() - jobDate.getTimezoneOffset());
    dueDateInput.value = jobDate.toISOString().slice(0, 16);
}

// Submit Laporan
window.submitJob = async function() {
    let title = document.getElementById('job-title').value;
    let notes = document.getElementById('job-notes').value;
    
    let branch = document.getElementById('job-branch') ? document.getElementById('job-branch').value : "";
    let room = document.getElementById('job-room') ? document.getElementById('job-room').value : "";
    let agenda = document.getElementById('job-agenda') ? document.getElementById('job-agenda').value : "";
    let jobDate = document.getElementById('job-date') ? document.getElementById('job-date').value : "";
    let dueDate = document.getElementById('job-due-date') ? document.getElementById('job-due-date').value : "";
    let technician = document.getElementById('job-technician') ? document.getElementById('job-technician').value : "";
    
    if (!title) {
        alert("Harap isi Keterangan Unit / Pekerjaan!");
        return;
    }
    
    try {
        // Update job
        await fetch(`${API_BASE}/jobs/${currentJobId}`, {
            method: 'PUT',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({
                status: 'completed',
                notes: notes + `\n(Title: ${title})`,
                lat: currentLat,
                lng: currentLng,
                branch: branch,
                room: room,
                agenda: agenda,
                job_date: jobDate,
                due_date: dueDate,
                technician_name: technician
            })
        });
        
        alert("Laporan Berhasil Disimpan!");
        switchView('home');
        
    } catch(e) {
        alert("Gagal menyimpan laporan!");
    }
}

// Load List
async function loadActiveJobs() {
    // Disini bisa filter job yang status=pending (kalau di-fetch semua)
    try {
        let res = await fetch(`${API_BASE}/jobs`);
        let data = await res.json();
        
        let ul = document.getElementById('active-jobs-list');
        ul.innerHTML = "";
        
        let pending = data.data.filter(j => j.status === 'pending');
        if (pending.length === 0) {
            ul.innerHTML = "<li style='justify-content:center; color: var(--text-muted); background: transparent; box-shadow: none; border: 1px dashed var(--border-color);'>Belum ada tugas draft aktif.</li>";
            return;
        }
        
        pending.forEach(j => {
            ul.innerHTML += `<li><b>${j.type}</b> <br> Draft ID: #${j.id}</li>`;
        });
    } catch(e) {
        console.log(e);
    }
}

async function loadHistory() {
    try {
        let res = await fetch(`${API_BASE}/jobs`);
        let data = await res.json();
        
        let ul = document.getElementById('history-list');
        ul.innerHTML = "";
        
        let completed = data.data.filter(j => j.status === 'completed');
        if (completed.length === 0) {
            ul.innerHTML = "<li style='justify-content:center; color: var(--text-muted); background: transparent; box-shadow: none; border: 1px dashed var(--border-color);'>Belum ada riwayat.</li>";
            return;
        }
        
        completed.forEach(j => {
            let noteStr = j.notes.split('\n')[0] || "Selesai";
            ul.innerHTML += `
                <li>
                    <div><b>${j.type}</b> (ID #${j.id})<br><small style="color:#10b981;">Selesai</small></div>
                    <div style="font-size:0.8rem; color:var(--text-muted);">${noteStr}</div>
                </li>`;
        });
    } catch(e) {
        ul.innerHTML = "<li style='justify-content:center; color: var(--danger); background: transparent; box-shadow: none; border: 1px dashed var(--danger);'>Gagal memuat riwayat.</li>";
    }
}

// Init
window.onload = () => {
    loadActiveJobs();
    loadProfile();
};

// Profile Integration
const CURRENT_USER_ID = 1; // Dummy user ID

async function loadProfile() {
    try {
        let res = await fetch(`${API_BASE}/user/${CURRENT_USER_ID}`);
        let data = await res.json();
        
        if (data.status === 'success') {
            let user = data.data;
            currentUserRole = user.role;
            document.getElementById('user-name-display').innerText = user.name;
            document.getElementById('user-role-display').innerText = user.role;
            document.getElementById('edit-name').value = user.name;
            document.getElementById('edit-role').value = user.role;
            
            updateAvatarUI(user.name, user.avatar_filename);
        }
    } catch(e) {
        console.error("Gagal load profile:", e);
    }
}

function updateAvatarUI(name, filename) {
    let initials = name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
    
    let headerInitials = document.getElementById('header-avatar-initials');
    let headerImg = document.getElementById('header-avatar-img');
    let editInitials = document.getElementById('edit-avatar-initials');
    let editImg = document.getElementById('edit-avatar-preview');
    
    if (filename) {
        let imgUrl = `http://localhost:8000/uploads/${filename}`;
        headerImg.src = imgUrl;
        headerImg.style.display = 'block';
        headerInitials.style.display = 'none';
        
        editImg.src = imgUrl;
        editImg.style.display = 'block';
        editInitials.style.display = 'none';
    } else {
        headerInitials.innerText = initials;
        headerImg.style.display = 'none';
        headerInitials.style.display = 'inline';
        
        editInitials.innerText = initials;
        editImg.style.display = 'none';
        editInitials.style.display = 'flex';
    }
}

// UI Toggles
window.toggleProfile = function() {
    document.getElementById('profile-menu').classList.toggle('active');
}

window.toggleSidebar = function() {
    document.getElementById('app-sidebar').classList.toggle('open');
}

window.saveProfile = async function() {
    let newName = document.getElementById('edit-name').value;
    if (newName.trim() === "") {
        alert("Nama tidak boleh kosong.");
        return;
    }
    
    try {
        let res = await fetch(`${API_BASE}/user/${CURRENT_USER_ID}`, {
            method: 'PUT',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ name: newName })
        });
        
        if (res.ok) {
            alert("Profil berhasil diperbarui!");
            document.getElementById('user-name-display').innerText = newName;
            
            // Re-update UI in case there's no photo and initials need to change
            let headerImg = document.getElementById('header-avatar-img');
            if (headerImg.style.display === 'none') {
                 updateAvatarUI(newName, null);
            }
            toggleProfile();
        } else {
            alert("Gagal update profil!");
        }
    } catch(e) {
        alert("Terjadi kesalahan koneksi saat update profil.");
    }
}

window.handleAvatarUpload = async function(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    // Tampilkan preview lokal dulu
    const reader = new FileReader();
    reader.onload = (e) => {
        let editImg = document.getElementById('edit-avatar-preview');
        editImg.src = e.target.result;
        editImg.style.display = 'block';
        document.getElementById('edit-avatar-initials').style.display = 'none';
    };
    reader.readAsDataURL(file);
    
    // Langsung upload
    let formData = new FormData();
    formData.append("file", file);
    
    try {
        let res = await fetch(`${API_BASE}/user/${CURRENT_USER_ID}/avatar`, {
            method: 'POST',
            body: formData
        });
        let data = await res.json();
        if (data.status === 'success') {
            alert("Foto berhasil diunggah!");
            updateAvatarUI(document.getElementById('user-name-display').innerText, data.filename);
        } else {
            alert("Gagal mengunggah foto.");
        }
    } catch(e) {
        alert("Terjadi kesalahan saat mengunggah foto.");
    }
}

// Close dropdowns when clicking outside
document.addEventListener('click', function(event) {
    let profileBtn = document.querySelector('.profile-btn');
    let profileMenu = document.getElementById('profile-menu');
    
    if (!profileBtn.contains(event.target) && !profileMenu.contains(event.target)) {
        profileMenu.classList.remove('active');
    }
});
