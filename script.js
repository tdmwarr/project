// Data pengumuman (akan diambil dari JSON)
let pengumumanData = [];
let userData = [];
let currentUser = null;

// Function to save user session
function saveUserSession(user) {
    localStorage.setItem('currentUser', JSON.stringify(user));
}

// Function to load user session
function loadUserSession() {
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
        currentUser = JSON.parse(savedUser);
        return true;
    }
    return false;
}

// Fungsi untuk memformat tanggal
function formatTanggal(dateString) {
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('id-ID', options);
}

// Fungsi untuk me-render kartu pengumuman
function renderPengumuman(pengumuman, index) {
    return `
        <div class="kartu-pengumuman">
            <h2>${pengumuman.judul}</h2>
            <p>${pengumuman.deskripsi}</p>
            <span class="kategori-badge">${pengumuman.kategori}</span>
            <div class="info-meta">
                <p><strong>Tanggal:</strong> ${formatTanggal(pengumuman.tanggal)}</p>
                <p><strong>Kontak:</strong> ${pengumuman.kontak}</p>
            </div>
            <div class="action-buttons">
                <button onclick="editPengumuman(${index})" class="edit-btn">Edit</button>
                <button onclick="deletePengumuman(${index})" class="delete-btn">Hapus</button>
            </div>
        </div>
    `;
}

// Fungsi untuk memfilter pengumuman berdasarkan kategori
function filterPengumuman() {
    const kategori = document.getElementById('kategori').value;
    const container = document.getElementById('pengumuman-container');
    
    let filteredPengumuman = pengumumanData;
    if (kategori !== 'semua') {
        filteredPengumuman = pengumumanData.filter(p => p.kategori === kategori);
    }

    // Urutkan berdasarkan tanggal (terbaru dulu)
    filteredPengumuman.sort((a, b) => new Date(b.tanggal) - new Date(a.tanggal));

    container.innerHTML = filteredPengumuman.map(renderPengumuman).join('');
}

// Fungsi untuk mengekspor ke CSV
function exportToCSV() {
    const headers = ['Judul', 'Deskripsi', 'Tanggal', 'Kontak', 'Kategori'];
    
    const csvContent = [
        headers.join(','),
        ...pengumumanData.map(item => [
            `"${item.judul.replace(/"/g, '""')}"`,
            `"${item.deskripsi.replace(/"/g, '""')}"`,
            `"${item.tanggal}"`,
            `"${item.kontak.replace(/"/g, '""')}"`,
            `"${item.kategori}"`
        ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', 'pengumuman.csv');
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// Fungsi untuk memuat data pengumuman
async function loadPengumuman() {
    try {
        const response = await fetch('data/pengumuman.json');
        pengumumanData = await response.json();
        filterPengumuman(); // Render semua pengumuman saat pertama kali dimuat
    } catch (error) {
        console.error('Error loading pengumuman:', error);
        document.getElementById('pengumuman-container').innerHTML = '<p>Error memuat data pengumuman.</p>';
    }
}

// Modal dan Form handling
const modal = document.getElementById('pengumumanModal');
const closeBtn = document.getElementsByClassName('close')[0];

function showAddForm() {
    document.getElementById('modalTitle').textContent = 'Tambah Pengumuman Baru';
    document.getElementById('editIndex').value = '-1';
    document.getElementById('pengumumanForm').reset();
    document.getElementById('tanggal').value = new Date().toISOString().split('T')[0];
    modal.style.display = 'block';
}

function editPengumuman(index) {
    const pengumuman = pengumumanData[index];
    document.getElementById('modalTitle').textContent = 'Edit Pengumuman';
    document.getElementById('editIndex').value = index;
    document.getElementById('judul').value = pengumuman.judul;
    document.getElementById('deskripsi').value = pengumuman.deskripsi;
    document.getElementById('tanggal').value = pengumuman.tanggal;
    document.getElementById('kontak').value = pengumuman.kontak;
    document.getElementById('kategoriInput').value = pengumuman.kategori;
    modal.style.display = 'block';
}

function deletePengumuman(index) {
    if (confirm('Apakah Anda yakin ingin menghapus pengumuman ini?')) {
        pengumumanData.splice(index, 1);
        savePengumumanToStorage();
        filterPengumuman();
    }
}

function savePengumuman(event) {
    event.preventDefault();
    
    if (!hasEditAccess()) {
        alert('Anda harus login untuk mengedit pengumuman!');
        return;
    }
    
    const pengumuman = {
        judul: document.getElementById('judul').value,
        deskripsi: document.getElementById('deskripsi').value,
        tanggal: document.getElementById('tanggal').value,
        kontak: document.getElementById('kontak').value,
        kategori: document.getElementById('kategoriInput').value,
        createdBy: currentUser.name,
        lastModified: new Date().toISOString()
    };

    const editIndex = parseInt(document.getElementById('editIndex').value);
    
    if (editIndex === -1) {
        pengumumanData.push(pengumuman);
    } else {
        pengumumanData[editIndex] = pengumuman;
    }

    savePengumumanToStorage();
    filterPengumuman();
    modal.style.display = 'none';
}

// Local Storage functions
function savePengumumanToStorage() {
    localStorage.setItem('pengumumanData', JSON.stringify(pengumumanData));
}

function loadPengumumanFromStorage() {
    const stored = localStorage.getItem('pengumumanData');
    return stored ? JSON.parse(stored) : [];
}

// Window events for both modals
const pengumumanModal = document.getElementById('pengumumanModal');
const loginModal = document.getElementById('loginModal');
const closeBtns = document.getElementsByClassName('close');

// Add click event to all close buttons
Array.from(closeBtns).forEach(btn => {
    btn.onclick = function() {
        pengumumanModal.style.display = 'none';
        loginModal.style.display = 'none';
    }
});

// Close modal when clicking outside
window.onclick = function(event) {
    if (event.target == pengumumanModal) {
        pengumumanModal.style.display = 'none';
    }
    if (event.target == loginModal) {
        loginModal.style.display = 'none';
    }
}

// Modifikasi fungsi loadPengumuman untuk menggunakan localStorage
async function loadPengumuman() {
    try {
        // Coba ambil data dari localStorage dulu
        const storedData = loadPengumumanFromStorage();
        if (storedData.length > 0) {
            pengumumanData = storedData;
        } else {
            // Jika tidak ada data di localStorage, ambil dari JSON file
            const response = await fetch('data/pengumuman.json');
            pengumumanData = await response.json();
            savePengumumanToStorage(); // Simpan ke localStorage untuk penggunaan selanjutnya
        }
        filterPengumuman();
    } catch (error) {
        console.error('Error loading pengumuman:', error);
        document.getElementById('pengumuman-container').innerHTML = '<p>Error memuat data pengumuman.</p>';
    }
}

// Fungsi autentikasi
async function loadUsers() {
    try {
        const response = await fetch('data/users.json');
        userData = await response.json();
    } catch (error) {
        console.error('Error loading users:', error);
    }
}

function showLoginForm() {
    document.getElementById('loginModal').style.display = 'block';
}

function closeLoginModal() {
    document.getElementById('loginModal').style.display = 'none';
}

async function handleLogin(event) {
    event.preventDefault();
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    const user = userData.find(u => u.username === username && u.password === password);
    
    if (user) {
        currentUser = user;
        saveUserSession(user); // Simpan sesi user
        updateAuthUI();
        closeLoginModal();
        document.getElementById('loginForm').reset();
    } else {
        alert('Username atau password salah!');
    }
}

function logout() {
    currentUser = null;
    localStorage.removeItem('currentUser'); // Hapus sesi user
    updateAuthUI();
}

function updateAuthUI() {
    const loginBtn = document.getElementById('loginBtn');
    const userInfo = document.getElementById('userInfo');
    const addButton = document.getElementById('addButton');
    const actionButtons = document.querySelectorAll('.action-buttons');

    if (currentUser) {
        loginBtn.style.display = 'none';
        userInfo.style.display = 'flex';
        document.getElementById('userName').textContent = currentUser.name;
        
        if (currentUser.role === 'admin' || currentUser.role === 'teacher') {
            addButton.style.display = 'block';
            actionButtons.forEach(btn => btn.style.display = 'flex');
        }
    } else {
        loginBtn.style.display = 'block';
        userInfo.style.display = 'none';
        addButton.style.display = 'none';
        actionButtons.forEach(btn => btn.style.display = 'none');
    }
}

// Fungsi untuk mengecek apakah user memiliki akses
function hasEditAccess() {
    return currentUser && (currentUser.role === 'admin' || currentUser.role === 'teacher');
}

// Override fungsi showAddForm dengan pengecekan akses
function showAddForm() {
    if (!hasEditAccess()) {
        alert('Anda harus login sebagai guru atau admin untuk menambah pengumuman!');
        return;
    }
    document.getElementById('modalTitle').textContent = 'Tambah Pengumuman Baru';
    document.getElementById('editIndex').value = '-1';
    document.getElementById('pengumumanForm').reset();
    document.getElementById('tanggal').value = new Date().toISOString().split('T')[0];
    document.getElementById('pengumumanModal').style.display = 'block';
}

// Override fungsi editPengumuman dengan pengecekan akses
function editPengumuman(index) {
    if (!hasEditAccess()) {
        alert('Anda harus login sebagai guru atau admin untuk mengedit pengumuman!');
        return;
    }
    const pengumuman = pengumumanData[index];
    document.getElementById('modalTitle').textContent = 'Edit Pengumuman';
    document.getElementById('editIndex').value = index;
    document.getElementById('judul').value = pengumuman.judul;
    document.getElementById('deskripsi').value = pengumuman.deskripsi;
    document.getElementById('tanggal').value = pengumuman.tanggal;
    document.getElementById('kontak').value = pengumuman.kontak;
    document.getElementById('kategoriInput').value = pengumuman.kategori;
    document.getElementById('pengumumanModal').style.display = 'block';
}

// Override fungsi deletePengumuman dengan pengecekan akses
function deletePengumuman(index) {
    if (!hasEditAccess()) {
        alert('Anda harus login sebagai guru atau admin untuk menghapus pengumuman!');
        return;
    }
    if (confirm('Apakah Anda yakin ingin menghapus pengumuman ini?')) {
        pengumumanData.splice(index, 1);
        savePengumumanToStorage();
        filterPengumuman();
    }
}

// Override fungsi renderPengumuman untuk menampilkan/menyembunyikan tombol aksi
function renderPengumuman(pengumuman, index) {
    const isEditable = hasEditAccess();
    const createdBy = pengumuman.createdBy || 'System';
    const lastModified = pengumuman.lastModified ? formatTanggal(pengumuman.lastModified) : '-';
    
    const actionButtons = isEditable ? `
        <div class="action-buttons">
            <button onclick="editPengumuman(${index})" class="edit-btn">
                <span class="btn-icon">✏️</span> Edit
            </button>
            <button onclick="deletePengumuman(${index})" class="delete-btn">
                <span class="btn-icon">🗑️</span> Hapus
            </button>
        </div>
    ` : '';

    const editInfo = isEditable ? `
        <div class="edit-info">
            <p><small>Dibuat oleh: ${createdBy}</small></p>
            <p><small>Terakhir diubah: ${lastModified}</small></p>
        </div>
    ` : '';

    return `
        <div class="kartu-pengumuman ${isEditable ? 'editable' : ''}">
            <div class="kartu-header">
                <h2>${pengumuman.judul}</h2>
                ${actionButtons}
            </div>
            <p class="kartu-deskripsi">${pengumuman.deskripsi}</p>
            <span class="kategori-badge">${pengumuman.kategori}</span>
            <div class="info-meta">
                <p><strong>Tanggal:</strong> ${formatTanggal(pengumuman.tanggal)}</p>
                <p><strong>Kontak:</strong> ${pengumuman.kontak}</p>
                ${editInfo}
            </div>
        </div>
    `;
}

// Inisialisasi
document.addEventListener('DOMContentLoaded', async () => {
    await loadUsers();
    await loadPengumuman();
    
    // Load saved user session
    if (loadUserSession()) {
        updateAuthUI();
    }
});