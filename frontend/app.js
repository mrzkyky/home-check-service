const API_BASE = '/api';

// Helper: fetch dengan JWT token otomatis + auto-logout kalau 401
async function apiFetch(url, options = {}) {
    const token = localStorage.getItem('hs_token');
    if (token) {
        options.headers = options.headers || {};
        options.headers['Authorization'] = `Bearer ${token}`;
    }
    const res = await fetch(url, options);
    if (res.status === 401) {
        // Token expired atau invalid → paksa logout
        localStorage.removeItem('hs_token');
        localStorage.removeItem('hs_user');
        alert('⏰ Sesi kamu sudah habis. Silakan login ulang.');
        window.location.reload();
        return null;
    }
    return res;
}

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
    let savedToken = localStorage.getItem('hs_token');
    let loginTime = parseInt(localStorage.getItem('hs_login_time') || '0');

    // Cek apakah token sudah expired (8 jam = 28800000 ms)
    const EXPIRE_MS = 8 * 60 * 60 * 1000;
    if (savedUser && savedToken && (Date.now() - loginTime < EXPIRE_MS)) {
        currentUser = JSON.parse(savedUser);
        document.getElementById('login-container').style.display = 'none';
        document.getElementById('app-container').style.display = 'flex';

        // Setup UI
        document.getElementById('user-name-display').innerText = currentUser.name;
        document.getElementById('user-role-display').innerText = currentUser.role;
        document.getElementById('edit-name').value = currentUser.name;
        document.getElementById('edit-role').value = currentUser.role;

        let avatarFilename = currentUser.avatar_filename;
        let avatarImgHeader = document.getElementById('header-avatar-img');
        let avatarInitialsHeader = document.getElementById('header-avatar-initials');
        let editAvatarPreview = document.getElementById('edit-avatar-preview');
        let editAvatarInitials = document.getElementById('edit-avatar-initials');

        if (avatarFilename && avatarFilename.trim() !== '') {
            let avatarUrl = `${API_BASE.replace('/api', '')}/uploads/${avatarFilename}`;
            avatarImgHeader.src = avatarUrl;
            avatarImgHeader.style.display = 'block';
            avatarInitialsHeader.style.display = 'none';
            editAvatarPreview.src = avatarUrl;
            editAvatarPreview.style.display = 'block';
            editAvatarInitials.style.display = 'none';
        } else {
            avatarImgHeader.style.display = 'none';
            avatarInitialsHeader.style.display = 'flex';
            editAvatarPreview.style.display = 'none';
            editAvatarInitials.style.display = 'flex';
        }

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
window.toggleAuthMode = function () {
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

window.doLogin = async function () {
    let email = document.getElementById('login-email').value;
    let pass = document.getElementById('login-password').value;
    if (!email || !pass) return alert("Isi email dan password!");

    try {
        let res = await fetch(`${API_BASE}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password: pass })
        });
        let data = await res.json();
        if (res.ok && data.status === 'success') {
            localStorage.setItem('hs_token', data.access_token);  // Simpan JWT
            localStorage.setItem('hs_user', JSON.stringify(data.user));
            // Simpan waktu login untuk cek expiry di sisi frontend
            localStorage.setItem('hs_login_time', Date.now().toString());
            checkAuth();
        } else {
            alert(data.detail || "Gagal login!");
        }
    } catch (e) { alert("Gagal koneksi server"); }
}


window.doRegister = async function () {
    let name = document.getElementById('reg-name').value;
    let email = document.getElementById('reg-email').value;
    let pass = document.getElementById('reg-password').value;
    if (!name || !email || !pass) return alert("Isi semua field!");

    try {
        let res = await fetch(`${API_BASE}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password: pass, name, role: 'Staff' })
        });
        let data = await res.json();
        if (res.ok) {
            alert("Pendaftaran berhasil! Silakan login.");
            toggleAuthMode();
        } else {
            alert(data.detail || "Gagal daftar!");
        }
    } catch (e) { alert("Gagal koneksi server"); }
}

window.doLogout = function () {
    localStorage.removeItem('hs_user');
    localStorage.removeItem('hs_token');
    localStorage.removeItem('hs_login_time');
    window.location.reload();
}


// --- UI NAVIGATION ---
window.switchView = function (viewId, navElement = null) {
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    document.getElementById(`view-${viewId}`).classList.add('active');

    if (navElement) {
        document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
        navElement.classList.add('active');
    }

    if (viewId === 'home') loadJobs(false);
    else if (viewId === 'history') loadJobs(true);
    else if (viewId === 'admin') {
        loadAdminAssets();
        loadAdminServerAssets();
        loadAdminAparAssets();
        loadAdminKwhAssets();
    }
}

window.toggleSidebar = function () { document.getElementById('app-sidebar').classList.toggle('open'); }
window.toggleProfile = function () { document.getElementById('profile-menu').classList.toggle('active'); }

document.addEventListener('click', function (event) {
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

            let deleteBtn = '';
            if (currentUser.role === 'Superadmin') {
                deleteBtn = `<button onclick="event.stopPropagation(); adminDeleteJob(${j.id})" style="background:var(--danger); color:white; border:none; padding:0.3rem 0.6rem; font-size:0.8rem; border-radius:6px; margin-left:0.5rem;">Hapus</button>`;
            }

            ul.innerHTML += `
                <li style="cursor:pointer;" onclick="openChecklist(${j.id})">
                    <div style="flex:1;">
                        <b style="font-size:1.1rem; color:var(--text-main);">${j.title}</b>
                        <div style="font-size:0.85rem; color:var(--text-muted); margin-top:0.3rem;">📍 ${j.branch}</div>
                    </div>
                    <div style="text-align:right; display:flex; align-items:center;">
                        <span class="status-badge" style="background:${bg}; color:white; border:none; padding:0.4rem 0.8rem; font-size:0.85rem;">${progressStr} Selesai</span>
                        ${deleteBtn}
                    </div>
                </li>`;
        });
    } catch (e) { console.error(e); }
}

window.adminDeleteJob = async function (id) {
    if (!confirm("Yakin hapus SPK ini? Semua progress akan ikut terhapus.")) return;
    try {
        let res = await fetch(`${API_BASE}/jobs/${id}`, { method: 'DELETE' });
        if (res.ok) {
            switchView('home'); // Reload list
        } else {
            alert("Gagal menghapus SPK.");
        }
    } catch (e) { alert("Error koneksi!"); }
}

// --- CHECKLIST SPK ---
window.openChecklist = async function (jobId) {
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

        // Deteksi tipe SPK dari judul untuk label & fetch aset yang sesuai
        let titleLower = job.title.toLowerCase();
        let isServer = titleLower.includes('server');
        let isApar   = titleLower.includes('apar');
        let isKwh    = titleLower.includes('kwh') || titleLower.includes('listrik');

        let sectionTitle = 'Daftar Aset AC';
        let assetEndpoint = `${API_BASE}/assets?branch=${encodeURIComponent(job.branch)}`;

        if (isServer) {
            sectionTitle = 'Daftar Aset Server';
            assetEndpoint = `${API_BASE}/server_assets`;
        } else if (isApar) {
            sectionTitle = 'Daftar Aset APAR';
            assetEndpoint = `${API_BASE}/apar_assets`;
        } else if (isKwh) {
            sectionTitle = 'Daftar Aset KWH';
            assetEndpoint = `${API_BASE}/kwh_assets`;
        }

        document.getElementById('checklist-section-title').innerText = sectionTitle;

        // Fetch aset sesuai tipe
        let aRes = await fetch(assetEndpoint);
        let aData = await aRes.json();

        // Filter by branch jika bukan AC (server/apar/kwh tidak filter by branch di endpoint)
        let allAssets = aData.data;
        if (isServer || isApar || isKwh) {
            allAssets = allAssets.filter(a => a.branch === job.branch);
        }
        currentAssetsCache = allAssets;

        let ul = document.getElementById('asset-list');
        ul.innerHTML = "";

        if (currentAssetsCache.length === 0) {
            ul.innerHTML = `<li><div style="color:var(--danger);">Aset untuk cabang ini belum ada. Tambah lewat Admin Panel atau Form Laporan!</div></li>`;
            return;
        }

        currentAssetsCache.forEach(asset => {
            let isDone = progress[asset.id] !== undefined;
            let icon = isDone ? '✅' : '⏳';
            let color = isDone ? 'var(--success)' : 'var(--text-main)';
            // Nama lokasi dinamis sesuai tipe aset
            let locationName = asset.room || asset.server_location || asset.apar_location || asset.kwh_location || '-';
            let subInfo = asset.ac_type ? `${asset.ac_type} - ${asset.details}` :
                          asset.fill_date ? `Isi: ${asset.fill_date} | Exp: ${asset.expiry_date}` : '';

            ul.innerHTML += `
                <li style="cursor:pointer; border-left-color:${isDone ? 'var(--success)' : 'var(--primary)'}" onclick="openProgressForm(${asset.id}, '${locationName}')">
                    <div style="flex:1;">
                        <b style="color:${color};">${icon} ${locationName}</b>
                        <div style="font-size:0.8rem; color:var(--text-muted); margin-top:0.2rem;">${subInfo}</div>
                    </div>
                    <div style="font-size:1.2rem; color:var(--text-muted);">›</div>
                </li>`;
        });

    } catch (e) { console.error(e); }
}

// --- PROGRESS FORM (PER AC) ---
window.openProgressForm = function (assetId, roomName) {
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

window.previewProgressPhoto = function (event, type) {
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

window.submitProgress = async function () {
    let bFile = document.getElementById('cam-prog-before').files[0];
    let aFile = document.getElementById('cam-prog-after').files[0];
    let notes = document.getElementById('prog-notes').value;

    if (!bFile && !aFile && !notes) {
        return alert("Harap isi setidaknya satu foto atau catatan.");
    }

    let formData = new FormData();
    formData.append("asset_id", currentAssetId);
    formData.append("notes", notes);
    if (bFile) formData.append("before_photo", bFile);
    if (aFile) formData.append("after_photo", aFile);

    try {
        let res = await fetch(`${API_BASE}/jobs/${currentJobId}/progress`, {
            method: 'POST',
            body: formData
        });
        let data = await res.json();
        if (res.ok) {
            alert("Laporan AC ini tersimpan!");
            openChecklist(currentJobId); // Kembali ke list dan update counter
        } else {
            alert("Gagal simpan progress.");
        }
    } catch (e) { alert("Gagal koneksi!"); }
}

// --- ADMIN PANEL ---
window.adminCreateAsset = async function () {
    let branch = document.getElementById('asset-branch').value;
    let room = document.getElementById('asset-room').value;
    let type = document.getElementById('asset-type').value;
    if (!branch || !room || !type) return alert("Isi semua data aset!");

    try {
        let res = await fetch(`${API_BASE}/assets`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ branch, room, ac_type: type, details: "Input by Admin" })
        });
        if (res.ok) {
            alert("Aset berhasil ditambah!");
            document.getElementById('asset-room').value = "";
            loadAdminAssets();
        }
    } catch (e) { alert("Error!"); }
}

window.loadAdminAssets = async function () {
    try {
        let res = await fetch(`${API_BASE}/assets`);
        let data = await res.json();
        let tbody = document.getElementById('admin-assets-table-body');
        tbody.innerHTML = '';

        if (data.data.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" style="padding: 1rem; text-align: center;">Belum ada aset terdaftar.</td></tr>';
            return;
        }

        data.data.forEach(a => {
            tbody.innerHTML += `
                <tr style="border-bottom: 1px solid var(--border-color);">
                    <td style="padding: 1rem;">#${a.id}</td>
                    <td style="padding: 1rem;">${a.branch}</td>
                    <td style="padding: 1rem;">${a.room}</td>
                    <td style="padding: 1rem;">${a.ac_type}</td>
                    <td style="padding: 1rem;">
                        <button onclick="adminEditAsset(${a.id}, '${a.branch}', '${a.room}', '${a.ac_type}')" style="background:var(--primary); color:white; padding:0.4rem 0.8rem; font-size:0.8rem; margin-right:0.5rem;">Edit</button>
                        <button onclick="adminDeleteAsset(${a.id})" style="background:var(--danger); color:white; padding:0.4rem 0.8rem; font-size:0.8rem;">Hapus</button>
                    </td>
                </tr>
            `;
        });
    } catch (e) { console.error(e); }
}

window.adminEditAsset = async function (id, oldBranch, oldRoom, oldType) {
    let newBranch = prompt("Update Cabang:", oldBranch);
    if (newBranch === null) return;
    let newRoom = prompt("Update Ruangan:", oldRoom);
    if (newRoom === null) return;
    let newType = prompt("Update Tipe AC:", oldType);
    if (newType === null) return;

    try {
        let res = await fetch(`${API_BASE}/assets/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ branch: newBranch, room: newRoom, ac_type: newType, details: "Updated by Admin" })
        });
        if (res.ok) {
            alert("Aset berhasil diupdate!");
            loadAdminAssets();
        }
    } catch (e) { alert("Error edit!"); }
}

window.adminDeleteAsset = async function (id) {
    if (!confirm("Yakin hapus aset ini?")) return;
    try {
        let res = await fetch(`${API_BASE}/assets/${id}`, { method: 'DELETE' });
        if (res.ok) {
            loadAdminAssets();
        }
    } catch (e) { alert("Error hapus!"); }
}

window.adminCreateSPK = async function () {
    let title = document.getElementById('spk-title').value;
    let branch = document.getElementById('spk-branch').value;
    let tech_id = parseInt(document.getElementById('spk-tech-id').value);

    if (!title || !branch || isNaN(tech_id)) return alert("Isi semua data SPK!");

    try {
        let res = await fetch(`${API_BASE}/jobs`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title, branch, assigned_to: tech_id })
        });
        if (res.ok) {
            alert("SPK Berhasil Dibuat!");
            document.getElementById('spk-title').value = "";
            switchView('home');
        }
    } catch (e) { alert("Error!"); }
}

// --- NEW ADMIN CRUD FUNCTIONS ---
window.adminCreateServer = async function () {
    let branch = document.getElementById('server-branch').value;
    let server_location = document.getElementById('server-location').value;
    if (!branch || !server_location) return alert("Isi semua data!");
    let res = await fetch(`${API_BASE}/server_assets`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ branch, server_location }) });
    if (res.ok) { alert("Berhasil ditambah!"); loadAdminServerAssets(); }
}
window.loadAdminServerAssets = async function () {
    let res = await fetch(`${API_BASE}/server_assets`); let data = await res.json();
    let tbody = document.getElementById('admin-server-table-body'); tbody.innerHTML = '';
    if (data.data.length === 0) tbody.innerHTML = '<tr><td colspan="4" style="text-align:center; padding:1rem;">Kosong</td></tr>';
    data.data.forEach(a => tbody.innerHTML += `<tr style="border-bottom: 1px solid var(--border-color);"><td style="padding:1rem;">#${a.id}</td><td style="padding:1rem;">${a.branch}</td><td style="padding:1rem;">${a.server_location}</td><td style="padding:1rem;"><button class="btn-secondary" style="color:var(--danger); border-color:var(--danger);" onclick="adminDeleteServer(${a.id})">Hapus</button></td></tr>`);
}
window.adminDeleteServer = async function (id) {
    if (confirm("Hapus?")) { await fetch(`${API_BASE}/server_assets/${id}`, { method: 'DELETE' }); loadAdminServerAssets(); }
}

window.adminCreateApar = async function () {
    let branch = document.getElementById('apar-branch').value;
    let apar_location = document.getElementById('apar-location').value;
    let fill_date = document.getElementById('apar-fill').value;
    let expiry_date = document.getElementById('apar-expiry').value;
    if (!branch || !apar_location) return alert("Isi data!");
    let res = await fetch(`${API_BASE}/apar_assets`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ branch, apar_location, fill_date, expiry_date }) });
    if (res.ok) { alert("Berhasil ditambah!"); loadAdminAparAssets(); }
}
window.loadAdminAparAssets = async function () {
    let res = await fetch(`${API_BASE}/apar_assets`); let data = await res.json();
    let tbody = document.getElementById('admin-apar-table-body'); tbody.innerHTML = '';
    if (data.data.length === 0) tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding:1rem;">Kosong</td></tr>';
    data.data.forEach(a => tbody.innerHTML += `<tr style="border-bottom: 1px solid var(--border-color);"><td style="padding:1rem;">#${a.id}</td><td style="padding:1rem;">${a.branch}</td><td style="padding:1rem;">${a.apar_location}</td><td style="padding:1rem;">${a.fill_date}</td><td style="padding:1rem;">${a.expiry_date}</td><td style="padding:1rem;"><button class="btn-secondary" style="color:var(--danger); border-color:var(--danger);" onclick="adminDeleteApar(${a.id})">Hapus</button></td></tr>`);
}
window.adminDeleteApar = async function (id) {
    if (confirm("Hapus?")) { await fetch(`${API_BASE}/apar_assets/${id}`, { method: 'DELETE' }); loadAdminAparAssets(); }
}

window.adminCreateKwh = async function () {
    let branch = document.getElementById('kwh-branch').value;
    let kwh_location = document.getElementById('kwh-location').value;
    if (!branch || !kwh_location) return alert("Isi data!");
    let res = await fetch(`${API_BASE}/kwh_assets`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ branch, kwh_location }) });
    if (res.ok) { alert("Berhasil ditambah!"); loadAdminKwhAssets(); }
}
window.loadAdminKwhAssets = async function () {
    let res = await fetch(`${API_BASE}/kwh_assets`); let data = await res.json();
    let tbody = document.getElementById('admin-kwh-table-body'); tbody.innerHTML = '';
    if (data.data.length === 0) tbody.innerHTML = '<tr><td colspan="4" style="text-align:center; padding:1rem;">Kosong</td></tr>';
    data.data.forEach(a => tbody.innerHTML += `<tr style="border-bottom: 1px solid var(--border-color);"><td style="padding:1rem;">#${a.id}</td><td style="padding:1rem;">${a.branch}</td><td style="padding:1rem;">${a.kwh_location}</td><td style="padding:1rem;"><button class="btn-secondary" style="color:var(--danger); border-color:var(--danger);" onclick="adminDeleteKwh(${a.id})">Hapus</button></td></tr>`);
}
window.adminDeleteKwh = async function (id) {
    if (confirm("Hapus?")) { await fetch(`${API_BASE}/kwh_assets/${id}`, { method: 'DELETE' }); loadAdminKwhAssets(); }
}

// --- PROFILE EDITING ---
window.saveProfile = async function () {
    let newName = document.getElementById('edit-name').value;
    let newRole = document.getElementById('edit-role').value;
    let newPassword = document.getElementById('edit-password').value;
    if (!newName) return alert("Nama tidak boleh kosong!");

    try {
        let res = await fetch(`${API_BASE}/user/${currentUser.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: newName, role: newRole })
        });
        if (res.ok) {
            if (newPassword) {
                await fetch(`${API_BASE}/user/${currentUser.id}/password`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ password: newPassword })
                });
            }
            currentUser.name = newName;
            currentUser.role = newRole;
            localStorage.setItem('hs_user', JSON.stringify(currentUser));
            alert("Profil diperbarui!");
            window.location.reload();
        }
    } catch (e) { alert("Error update profil"); }
}

window.handleAvatarUpload = async function (event) {
    const file = event.target.files[0];
    if (!file) return;

    let formData = new FormData();
    formData.append("file", file);

    try {
        let res = await fetch(`${API_BASE}/user/${currentUser.id}/avatar`, {
            method: 'POST',
            body: formData
        });
        let data = await res.json();
        if (res.ok) {
            currentUser.avatar_filename = data.filename;
            localStorage.setItem('hs_user', JSON.stringify(currentUser));
            checkAuth(); // Update UI langsung
            alert("Foto berhasil diunggah!");
        }
    } catch (e) { alert("Error upload foto"); }
}

// --- AD-HOC JOB FORM (Original Style) ---
let allAssetsForAdHoc = [];

window.openJobForm = async function (type) {
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

    ['cuci-ac-fields', 'server-fields', 'apar-fields', 'kwh-fields'].forEach(id => {
        let el = document.getElementById(id);
        if (el) el.style.display = 'none';
    });

    let isAC = type.toLowerCase().includes('ac');
    let isServer = type.toLowerCase().includes('server');
    let isApar = type.toLowerCase().includes('apar');
    let isKwh = type.toLowerCase().includes('kwh');

    if (isAC) {
        document.getElementById('cuci-ac-fields').style.display = 'block';
        try {
            let res = await fetch(`${API_BASE}/assets`); let data = await res.json();
            allAssetsForAdHoc = data.data;
            let branchSelect = document.getElementById('job-branch');
            let branches = [...new Set(allAssetsForAdHoc.map(a => (a.branch || '').trim()))].filter(Boolean);
            branchSelect.innerHTML = '<option value="">Pilih Cabang...</option>';
            branches.forEach(b => branchSelect.innerHTML += `<option value="${b}">${b}</option>`);
            document.getElementById('job-room').innerHTML = '<option value="">Pilih Ruangan...</option>';
            let lastBranch = localStorage.getItem('hs_last_branch');
            if (lastBranch && branches.includes(lastBranch)) { branchSelect.value = lastBranch; window.loadRoomsForAdHoc(); }
        } catch (e) { }
    }

    if (isServer) {
        document.getElementById('server-fields').style.display = 'block';
        window.loadAdHocData('server');
    }
    if (isApar) {
        document.getElementById('apar-fields').style.display = 'block';
        window.loadAdHocData('apar');
    }
    if (isKwh) {
        document.getElementById('kwh-fields').style.display = 'block';
        window.loadAdHocData('kwh');
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

window.openAddMaster = function (type) {
    document.getElementById('add-master-apar').style.display = 'none';
    document.getElementById('add-master-kwh').style.display = 'none';
    if (type === 'apar') document.getElementById('add-master-apar').style.display = 'block';
    if (type === 'kwh') document.getElementById('add-master-kwh').style.display = 'block';
    switchView('add-master');
}

window.userSubmitApar = async function () {
    let branch = document.getElementById('user-apar-branch').value;
    let apar_location = document.getElementById('user-apar-location').value;
    let fill_date = document.getElementById('user-apar-fill').value;
    let expiry_date = document.getElementById('user-apar-expiry').value;
    if (!branch || !apar_location) return alert("Isi Cabang dan Lokasi APAR!");
    let res = await fetch(`${API_BASE}/apar_assets`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ branch, apar_location, fill_date, expiry_date }) });
    if (res.ok) {
        alert("Lokasi APAR berhasil ditambah!");
        switchView('home');
    }
}

window.userSubmitKwh = async function () {
    let branch = document.getElementById('user-kwh-branch').value;
    let kwh_location = document.getElementById('user-kwh-location').value;
    if (!branch || !kwh_location) return alert("Isi Cabang dan Lokasi KWH!");
    let res = await fetch(`${API_BASE}/kwh_assets`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ branch, kwh_location }) });
    if (res.ok) {
        alert("Lokasi KWH berhasil ditambah!");
        switchView('home');
    }
}

window.calculateDueDate = function () {
    let dateInput = document.getElementById('job-date');
    let dueDateInput = document.getElementById('job-due-date');
    if (!dateInput || !dueDateInput) return;

    let jobDate = new Date(dateInput.value);
    if (isNaN(jobDate.getTime())) return;

    jobDate.setMonth(jobDate.getMonth() + 3);

    jobDate.setMinutes(jobDate.getMinutes() - jobDate.getTimezoneOffset());
    dueDateInput.value = jobDate.toISOString().slice(0, 16);
}

window.getLocation = function () {
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

window.triggerCamera = function (type) {
    document.getElementById(`cam-${type}`).click();
}

window.handlePhoto = function (event, type) {
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

let allAdhocData = { server: [], apar: [], kwh: [] };
window.loadAdHocData = async function (type) {
    try {
        let res = await fetch(`${API_BASE}/${type}_assets`);
        let data = await res.json();
        allAdhocData[type] = data.data;
        let branchSelect = document.getElementById(`job-${type}-branch`);
        let branches = [...new Set(data.data.map(a => a.branch))].filter(Boolean);
        branchSelect.innerHTML = '<option value="">Pilih Cabang...</option>';
        branches.forEach(b => branchSelect.innerHTML += `<option value="${b}">${b}</option>`);
    } catch (e) { }
}

window.loadServerLocations = function () {
    let branch = document.getElementById('job-server-branch').value;
    let select = document.getElementById('job-server-location'); select.innerHTML = '<option value="">Pilih Lokasi...</option>';
    if (branch) allAdhocData.server.filter(a => a.branch === branch).forEach(a => select.innerHTML += `<option value="${a.server_location}">${a.server_location}</option>`);
}

window.loadAparLocations = function () {
    let branch = document.getElementById('job-apar-branch').value;
    let select = document.getElementById('job-apar-location'); select.innerHTML = '<option value="">Pilih Lokasi...</option>';
    if (branch) allAdhocData.apar.filter(a => a.branch === branch).forEach(a => select.innerHTML += `<option value="${a.apar_location}">${a.apar_location}</option>`);
}

window.showAparDates = function () {
    let loc = document.getElementById('job-apar-location').value;
    let info = document.getElementById('apar-dates-info');
    if (!loc) { info.style.display = 'none'; return; }
    let apar = allAdhocData.apar.find(a => a.apar_location === loc);
    if (apar) {
        document.getElementById('lbl-apar-fill').innerText = apar.fill_date;
        document.getElementById('lbl-apar-expiry').innerText = apar.expiry_date;
        info.style.display = 'block';
    }
}

window.loadKwhLocations = function () {
    let branch = document.getElementById('job-kwh-branch').value;
    let select = document.getElementById('job-kwh-location'); select.innerHTML = '<option value="">Pilih Lokasi...</option>';
    if (branch) allAdhocData.kwh.filter(a => a.branch === branch).forEach(a => select.innerHTML += `<option value="${a.kwh_location}">${a.kwh_location}</option>`);
}

window.toggleNewAparForm = function () {
    let f = document.getElementById('apar-new-form');
    let isOpen = f.style.display !== 'none';
    f.style.display = isOpen ? 'none' : 'block';
    // Kalau buka form baru, clear dropdown pilihan lama
    if (!isOpen) {
        document.getElementById('job-apar-branch').value = '';
        document.getElementById('job-apar-location').innerHTML = '<option value="">Pilih Lokasi...</option>';
        document.getElementById('apar-dates-info').style.display = 'none';
    }
}

window.toggleNewKwhForm = function () {
    let f = document.getElementById('kwh-new-form');
    let isOpen = f.style.display !== 'none';
    f.style.display = isOpen ? 'none' : 'block';
    if (!isOpen) {
        document.getElementById('job-kwh-branch').value = '';
        document.getElementById('job-kwh-location').innerHTML = '<option value="">Pilih Lokasi...</option>';
    }
}

window.loadRoomsForAdHoc = function () {
    let branch = document.getElementById('job-branch').value;
    let roomSelect = document.getElementById('job-room');
    roomSelect.innerHTML = '<option value="">Pilih Ruangan...</option>';

    if (branch) {
        localStorage.setItem('hs_last_branch', branch);
        let rooms = allAssetsForAdHoc.filter(a => (a.branch || '').trim() === branch);
        rooms.forEach(r => {
            roomSelect.innerHTML += `<option value="${r.room}">${r.room} (${r.ac_type})</option>`;
        });
    }
}

window.submitAdHocJob = async function () {
    let title = document.getElementById('job-title').value;
    let bFile = document.getElementById('cam-before').files[0];
    let notes = document.getElementById('job-notes').value;

    if (!title) return alert("Keterangan Unit harus diisi!");

    let branch = "Ad-Hoc";
    let locationDetail = "";

    let isAC = document.getElementById('cuci-ac-fields').style.display === 'block';
    let isServer = document.getElementById('server-fields').style.display === 'block';
    let isApar = document.getElementById('apar-fields').style.display === 'block';
    let isKwh = document.getElementById('kwh-fields').style.display === 'block';

    if (isAC) {
        branch = document.getElementById('job-branch').value;
        locationDetail = document.getElementById('job-room').value;
    } else if (isServer) {
        branch = document.getElementById('job-server-branch').value;
        locationDetail = document.getElementById('job-server-location').value;
    } else if (isApar) {
        let isNewApar = document.getElementById('apar-new-form').style.display !== 'none';

        if (isNewApar) {
            // Simpan lokasi APAR baru ke database dulu
            let newBranch = document.getElementById('apar-new-branch').value;
            let newLoc = document.getElementById('apar-new-location').value;
            let newFill = document.getElementById('apar-new-fill').value;
            let newExpInit = document.getElementById('apar-new-expiry-init').value;
            if (!newBranch || !newLoc) return alert('Isi Cabang dan Lokasi APAR baru!');
            try {
                let r = await fetch(`${API_BASE}/apar_assets`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ branch: newBranch, apar_location: newLoc, fill_date: newFill, expiry_date: newExpInit })
                });
                if (!r.ok) return alert('Gagal simpan lokasi APAR baru!');
            } catch (e) { return alert('Error simpan APAR baru'); }
            branch = newBranch;
            locationDetail = newLoc;
        } else {
            branch = document.getElementById('job-apar-branch').value;
            locationDetail = document.getElementById('job-apar-location').value;
        }

        let segel = document.getElementById('job-apar-segel').value;
        let bar = document.getElementById('job-apar-bar').value;
        let newExpiry = document.getElementById('job-apar-new-expiry').value;

        notes += `\n[Laporan APAR] Segel: ${segel}, Bar: ${bar}`;

        if (newExpiry && !isNewApar) {
            notes += `, Expired Diupdate: ${newExpiry}`;
            let aparObj = allAdhocData.apar.find(a => a.apar_location === locationDetail);
            if (aparObj) {
                fetch(`${API_BASE}/apar_assets/${aparObj.id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ fill_date: new Date().toISOString().split('T')[0], expiry_date: newExpiry })
                });
            }
        }

    } else if (isKwh) {
        let isNewKwh = document.getElementById('kwh-new-form').style.display !== 'none';

        if (isNewKwh) {
            // Simpan lokasi KWH baru ke database dulu
            let newBranch = document.getElementById('kwh-new-branch').value;
            let newLoc = document.getElementById('kwh-new-location').value;
            if (!newBranch || !newLoc) return alert('Isi Cabang dan Lokasi KWH baru!');
            try {
                let r = await fetch(`${API_BASE}/kwh_assets`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ branch: newBranch, kwh_location: newLoc })
                });
                if (!r.ok) return alert('Gagal simpan lokasi KWH baru!');
            } catch (e) { return alert('Error simpan KWH baru'); }
            branch = newBranch;
            locationDetail = newLoc;
        } else {
            branch = document.getElementById('job-kwh-branch').value;
            locationDetail = document.getElementById('job-kwh-location').value;
        }
        let recipient = document.getElementById('kwh-recipient-email').value;

        if (!bFile) return alert("Foto KWH Wajib dilampirkan!");
        if (!recipient) return alert("Email penerima wajib diisi!");

        let formData = new FormData();
        formData.append("sender_name", currentUser.name);
        formData.append("sender_email", currentUser.email);
        formData.append("kwh_location", locationDetail || "Tanpa Lokasi Spesifik");
        formData.append("recipient_email", recipient);
        formData.append("photo", bFile);

        try {
            let res = await fetch(`${API_BASE}/kwh-email`, { method: 'POST', body: formData });
            let result = await res.json();
            if (res.ok && result.status === 'success') {
                alert("✅ Email Pengajuan KWH Berhasil Dikirim!");
                switchView('home');
                return;
            } else {
                return alert(`❌ Gagal kirim email KWH.\n\nDetail: ${result.detail || 'Unknown error'}`);
            }
        } catch (e) { return alert("Koneksi Error: " + e.message); }
    }

    try {
        let finalTitle = title + (locationDetail ? ` - ${locationDetail}` : "");
        let res = await fetch(`${API_BASE}/jobs`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title: finalTitle, branch: branch, assigned_to: currentUser.id })
        });
        if (res.ok) {
            alert("Laporan berhasil dikirim!");
            switchView('home');
        } else {
            alert("Gagal simpan.");
        }
    } catch (e) { alert("Gagal koneksi server"); }
}
