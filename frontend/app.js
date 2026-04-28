const API_BASE = `http://${window.location.hostname}:8083/api`;

let currentUser = null;
let currentJobId = null;
let currentAssetId = null;
let currentAssetsCache = [];

// --- BOOTSTRAP ---
window.onload = () => {
    checkAuth();
};

function checkAuth() {
    let savedUser = localStorage.getItem('hs_user');
    if (savedUser) {
        currentUser = JSON.parse(savedUser);
        document.getElementById('login-container').style.display = 'none';
        document.getElementById('app-container').style.display = 'flex';
        
        // Setup UI
        document.getElementById('user-name-display').innerText = currentUser.name;
        document.getElementById('user-role-display').innerText = currentUser.role;
        document.getElementById('edit-name').value = currentUser.name;
        document.getElementById('edit-role').value = currentUser.role;
        
        if (currentUser.role === 'Superadmin') {
            document.getElementById('nav-admin').style.display = 'flex';
        }
        
        // Mulai aplikasi
        switchView('home');
    } else {
        document.getElementById('login-container').style.display = 'flex';
        document.getElementById('app-container').style.display = 'none';
    }
}

// --- AUTHENTICATION ---
window.toggleAuthMode = function() {
    let loginForm = document.getElementById('login-form');
    let regForm = document.getElementById('register-form');
    if (loginForm.style.display !== 'none') {
        loginForm.style.display = 'none';
        regForm.style.display = 'block';
    } else {
        loginForm.style.display = 'block';
        regForm.style.display = 'none';
    }
}

window.doLogin = async function() {
    let email = document.getElementById('login-email').value;
    let pass = document.getElementById('login-password').value;
    if(!email || !pass) return alert("Isi email dan password!");
    
    try {
        let res = await fetch(`${API_BASE}/auth/login`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({email, password: pass})
        });
        let data = await res.json();
        if(res.ok && data.status === 'success') {
            localStorage.setItem('hs_user', JSON.stringify(data.user));
            checkAuth();
        } else {
            alert(data.detail || "Gagal login!");
        }
    } catch(e) { alert("Gagal koneksi server"); }
}

window.doRegister = async function() {
    let name = document.getElementById('reg-name').value;
    let email = document.getElementById('reg-email').value;
    let pass = document.getElementById('reg-password').value;
    if(!name || !email || !pass) return alert("Isi semua field!");
    
    try {
        let res = await fetch(`${API_BASE}/auth/register`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({email, password: pass, name, role: 'Staff'})
        });
        let data = await res.json();
        if(res.ok) {
            alert("Pendaftaran berhasil! Silakan login.");
            toggleAuthMode();
        } else {
            alert(data.detail || "Gagal daftar!");
        }
    } catch(e) { alert("Gagal koneksi server"); }
}

window.doLogout = function() {
    localStorage.removeItem('hs_user');
    window.location.reload();
}

// --- UI NAVIGATION ---
window.switchView = function(viewId, navElement = null) {
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    document.getElementById(`view-${viewId}`).classList.add('active');
    
    if (navElement) {
        document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
        navElement.classList.add('active');
    }
    
    if (viewId === 'home') loadJobs(false);
    else if (viewId === 'history') loadJobs(true);
}

window.toggleSidebar = function() { document.getElementById('app-sidebar').classList.toggle('open'); }
window.toggleProfile = function() { document.getElementById('profile-menu').classList.toggle('active'); }

document.addEventListener('click', function(event) {
    let profileBtn = document.querySelector('.profile-btn');
    let profileMenu = document.getElementById('profile-menu');
    if (profileBtn && profileMenu && !profileBtn.contains(event.target) && !profileMenu.contains(event.target)) {
        profileMenu.classList.remove('active');
    }
});

// --- LOAD JOBS / SPK ---
async function loadJobs(isHistory) {
    try {
        let url = `${API_BASE}/jobs?user_id=${currentUser.id}&role=${currentUser.role}`;
        let res = await fetch(url);
        let data = await res.json();
        
        let ul = document.getElementById(isHistory ? 'history-list' : 'active-jobs-list');
        ul.innerHTML = "";
        
        let filtered = data.data.filter(j => isHistory ? j.status === 'completed' : j.status === 'pending');
        
        if (filtered.length === 0) {
            ul.innerHTML = `<li style='justify-content:center; color: var(--text-muted); background: transparent; box-shadow: none; border: 1px dashed var(--border-color);'>Belum ada SPK.</li>`;
            return;
        }
        
        filtered.forEach(j => {
            let progressStr = `${j.completed_qty}/${j.target_qty}`;
            let bg = isHistory ? '#10b981' : 'var(--primary)';
            ul.innerHTML += `
                <li style="cursor:pointer;" onclick="openChecklist(${j.id})">
                    <div style="flex:1;">
                        <b style="font-size:1.1rem; color:var(--text-main);">${j.title}</b>
                        <div style="font-size:0.85rem; color:var(--text-muted); margin-top:0.3rem;">📍 ${j.branch}</div>
                    </div>
                    <div style="text-align:right;">
                        <span class="status-badge" style="background:${bg}; color:white; border:none; padding:0.4rem 0.8rem; font-size:0.85rem;">${progressStr} Selesai</span>
                    </div>
                </li>`;
        });
    } catch(e) { console.error(e); }
}

// --- CHECKLIST SPK ---
window.openChecklist = async function(jobId) {
    currentJobId = jobId;
    switchView('checklist');
    document.getElementById('asset-list').innerHTML = "Memuat...";
    
    try {
        let res = await fetch(`${API_BASE}/jobs/${jobId}`);
        let data = await res.json();
        let job = data.data.job;
        let progress = data.data.progress;
        
        document.getElementById('checklist-title').innerText = job.title;
        document.getElementById('checklist-branch').innerText = job.branch;
        document.getElementById('checklist-progress').innerText = `${job.completed_qty}/${job.target_qty} Selesai`;
        
        // Fetch Master Assets for this branch
        let aRes = await fetch(`${API_BASE}/assets?branch=${encodeURIComponent(job.branch)}`);
        let aData = await aRes.json();
        currentAssetsCache = aData.data;
        
        let ul = document.getElementById('asset-list');
        ul.innerHTML = "";
        
        if(currentAssetsCache.length === 0) {
            ul.innerHTML = `<li><div style="color:var(--danger);">Aset AC untuk cabang ini belum diisi oleh Admin!</div></li>`;
            return;
        }
        
        currentAssetsCache.forEach(asset => {
            let isDone = progress[asset.id] !== undefined;
            let icon = isDone ? '✅' : '⏳';
            let color = isDone ? 'var(--success)' : 'var(--text-main)';
            
            ul.innerHTML += `
                <li style="cursor:pointer; border-left-color:${isDone ? 'var(--success)' : 'var(--primary)'}" onclick="openProgressForm(${asset.id}, '${asset.room}')">
                    <div style="flex:1;">
                        <b style="color:${color};">${icon} ${asset.room}</b>
                        <div style="font-size:0.8rem; color:var(--text-muted); margin-top:0.2rem;">${asset.ac_type} - ${asset.details}</div>
                    </div>
                    <div style="font-size:1.2rem; color:var(--text-muted);">›</div>
                </li>`;
        });
        
    } catch(e) { console.error(e); }
}

// --- PROGRESS FORM (PER AC) ---
window.openProgressForm = function(assetId, roomName) {
    currentAssetId = assetId;
    document.getElementById('progress-title').innerText = `Update: ${roomName}`;
    document.getElementById('prog-asset-id').value = assetId;
    
    // Reset inputs
    document.getElementById('prog-notes').value = "";
    document.getElementById('cam-prog-before').value = "";
    document.getElementById('cam-prog-after').value = "";
    document.getElementById('img-prog-before').src = "";
    document.getElementById('img-prog-after').src = "";
    document.getElementById('img-prog-before').classList.add('hidden');
    document.getElementById('img-prog-after').classList.add('hidden');
    document.getElementById('lbl-prog-before').classList.remove('hidden');
    document.getElementById('lbl-prog-after').classList.remove('hidden');
    
    switchView('progress-form');
}

window.previewProgressPhoto = function(event, type) {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
        let img = document.getElementById(`img-prog-${type}`);
        img.src = e.target.result;
        img.classList.remove('hidden');
        document.getElementById(`lbl-prog-${type}`).classList.add('hidden');
    };
    reader.readAsDataURL(file);
}

window.submitProgress = async function() {
    let bFile = document.getElementById('cam-prog-before').files[0];
    let aFile = document.getElementById('cam-prog-after').files[0];
    let notes = document.getElementById('prog-notes').value;
    
    if(!bFile && !aFile && !notes) {
        return alert("Harap isi setidaknya satu foto atau catatan.");
    }
    
    let formData = new FormData();
    formData.append("asset_id", currentAssetId);
    formData.append("notes", notes);
    if(bFile) formData.append("before_photo", bFile);
    if(aFile) formData.append("after_photo", aFile);
    
    try {
        let res = await fetch(`${API_BASE}/jobs/${currentJobId}/progress`, {
            method: 'POST',
            body: formData
        });
        let data = await res.json();
        if(res.ok) {
            alert("Laporan AC ini tersimpan!");
            openChecklist(currentJobId); // Kembali ke list dan update counter
        } else {
            alert("Gagal simpan progress.");
        }
    } catch(e) { alert("Gagal koneksi!"); }
}

// --- ADMIN PANEL ---
window.adminCreateAsset = async function() {
    let branch = document.getElementById('asset-branch').value;
    let room = document.getElementById('asset-room').value;
    let type = document.getElementById('asset-type').value;
    if(!branch || !room || !type) return alert("Isi semua data aset!");
    
    try {
        let res = await fetch(`${API_BASE}/assets`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({branch, room, ac_type: type, details: "Input by Admin"})
        });
        if(res.ok) {
            alert("Aset berhasil ditambah!");
            document.getElementById('asset-room').value = "";
        }
    } catch(e) { alert("Error!"); }
}

window.adminCreateSPK = async function() {
    let title = document.getElementById('spk-title').value;
    let branch = document.getElementById('spk-branch').value;
    let tech_id = parseInt(document.getElementById('spk-tech-id').value);
    
    if(!title || !branch || isNaN(tech_id)) return alert("Isi semua data SPK!");
    
    try {
        let res = await fetch(`${API_BASE}/jobs`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({title, branch, assigned_to: tech_id})
        });
        if(res.ok) {
            alert("SPK Berhasil Dibuat!");
            document.getElementById('spk-title').value = "";
            switchView('home');
        }
    } catch(e) { alert("Error!"); }
}

// --- PROFILE EDITING ---
window.saveProfile = async function() {
    let newName = document.getElementById('edit-name').value;
    let newRole = document.getElementById('edit-role').value;
    if (!newName) return alert("Nama tidak boleh kosong!");
    
    try {
        let res = await fetch(`${API_BASE}/user/${currentUser.id}`, {
            method: 'PUT',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ name: newName, role: newRole })
        });
        if (res.ok) {
            currentUser.name = newName;
            currentUser.role = newRole;
            localStorage.setItem('hs_user', JSON.stringify(currentUser));
            alert("Profil diperbarui!");
            window.location.reload();
        }
    } catch(e) { alert("Error update profil"); }
}

window.handleAvatarUpload = async function(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    let formData = new FormData();
    formData.append("file", file);
    
    try {
        let res = await fetch(`${API_BASE}/user/${currentUser.id}/avatar`, {
            method: 'POST',
            body: formData
        });
        if (res.ok) {
            alert("Foto berhasil diunggah! Silakan refresh.");
        }
    } catch(e) { alert("Error upload foto"); }
}

// --- AD-HOC JOB FORM (Original Style) ---
window.openJobForm = async function(type) {
    document.getElementById('job-form-title').innerText = `Tugas: ${type}`;
    document.getElementById('job-title').value = "";
    document.getElementById('job-location').value = "";
    document.getElementById('job-notes').value = "";
    
    // Reset foto
    ['before', 'after'].forEach(t => {
        document.getElementById(`img-${t}`).src = "";
        document.getElementById(`img-${t}`).classList.add('hidden');
        document.getElementById(`label-${t}`).classList.remove('hidden');
        document.getElementById(`cam-${t}`).value = "";
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
        if (currentUser.role !== 'Superadmin') {
            techInput.value = currentUser.name;
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
}

window.calculateDueDate = function() {
    let dateInput = document.getElementById('job-date');
    let dueDateInput = document.getElementById('job-due-date');
    if (!dateInput || !dueDateInput) return;
    
    let jobDate = new Date(dateInput.value);
    if (isNaN(jobDate.getTime())) return;
    
    jobDate.setMonth(jobDate.getMonth() + 3);
    
    jobDate.setMinutes(jobDate.getMinutes() - jobDate.getTimezoneOffset());
    dueDateInput.value = jobDate.toISOString().slice(0, 16);
}

window.getLocation = function() {
    let locInput = document.getElementById('job-location');
    locInput.value = "Mencari lokasi...";
    
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                locInput.value = `${pos.coords.latitude.toFixed(6)}, ${pos.coords.longitude.toFixed(6)}`;
            },
            (err) => {
                locInput.value = "Gagal dapat GPS!";
                alert("Nyalain GPS / Location Permission di HP lu boss!");
            },
            { enableHighAccuracy: true, timeout: 10000 }
        );
    } else {
        locInput.value = "Browser ga support GPS";
    }
}

window.triggerCamera = function(type) {
    document.getElementById(`cam-${type}`).click();
}

window.handlePhoto = function(event, type) {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
        let img = document.getElementById(`img-${type}`);
        img.src = e.target.result;
        img.classList.remove('hidden');
        document.getElementById(`label-${type}`).classList.add('hidden');
    };
    reader.readAsDataURL(file);
}

window.submitAdHocJob = async function() {
    let title = document.getElementById('job-title').value;
    let bFile = document.getElementById('cam-before').files[0];
    let aFile = document.getElementById('cam-after').files[0];
    let notes = document.getElementById('job-notes').value;
    
    if(!title) return alert("Keterangan Unit harus diisi!");
    
    try {
        let res = await fetch(`${API_BASE}/jobs`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({title: title, branch: "Ad-Hoc", assigned_to: currentUser.id})
        });
        let data = await res.json();
        
        if(res.ok) {
            alert("Laporan berhasil dikirim!");
            switchView('home');
        } else {
            alert("Gagal simpan.");
        }
    } catch(e) { alert("Gagal koneksi server"); }
}
