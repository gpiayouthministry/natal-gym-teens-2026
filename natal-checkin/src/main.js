import './style.css';
import { Html5Qrcode } from 'html5-qrcode';

// Mengambil URL Apps Script dari .env.local atau Dashboard Vercel
const SCRIPT_URL = import.meta.env.VITE_SCRIPT_URL;
const PALETTE = ["#e21b3c", "#1368ce", "#d89e00", "#26890c", "#864cbf", "#0aa3a3"];

let html5QrCode = null;
let scannerRunning = false;
let handlingScan = false;
let currentScannedId = "";
let cachedMembers = [];

let attendeesData = [];
let lastRenderKey = "";
let pollTimer = null;

// Expose fungsi ke scope window agar onclick="..." di HTML statis bisa membacanya
window.showScreen = showScreen;
window.resetScanner = resetScanner;
window.confirmCheckIn = confirmCheckIn;
window.renderAttendees = renderAttendees;

// ================= NAVIGASI =================
function showScreen(name) {
    document.querySelectorAll('.screen').forEach(s => s.classList.add('hidden'));
    document.getElementById('screen-' + name).classList.remove('hidden');

    if (name === 'scan') {
        resetResult();
        startScanner();
    } else {
        stopScanner();
    }

    clearInterval(pollTimer);
    if (name === 'attendees') {
        loadAttendees();
        pollTimer = setInterval(loadAttendees, 5000);
    }
}

function resetResult() {
    document.getElementById('result-container').classList.add('hidden');
    cachedMembers = [];
}

// ================= SCANNER =================
let currentCameraId = null;

function startScanner() {
    if (scannerRunning) return;
    if (!html5QrCode) html5QrCode = new Html5Qrcode("reader");
    handlingScan = false;

    const cameraSelect = document.getElementById("camera-select");

    // Ambil semua daftar kamera yang tersedia di HP/Laptop
    Html5Qrcode.getCameras().then(devices => {
        if (devices && devices.length) {
            // Populate opsi ke dropdown <select>
            cameraSelect.innerHTML = "";
            devices.forEach((device, index) => {
                const option = document.createElement("option");
                option.value = device.id;
                // Berikan label yang jelas (misal: Kamera Depan / Kamera Belakang)
                option.text = device.label || `Kamera ${index + 1}`;
                cameraSelect.appendChild(option);
            });

            // Tampilkan dropdown jika kamera lebih dari 1
            cameraSelect.style.display = devices.length > 1 ? "block" : "none";

            // Pilih kamera yang sedang aktif (default: kamera belakang / device terakhir)
            if (!currentCameraId) {
                currentCameraId = devices[devices.length - 1].id;
            }
            cameraSelect.value = currentCameraId;

            // Jalankan scanner dengan kamera yang dipilih
            html5QrCode.start(
                currentCameraId,
                { fps: 10, qrbox: { width: 220, height: 220 } },
                onScanSuccess,
                onScanError
            ).then(() => {
                scannerRunning = true;
            }).catch(err => {
                console.error("Gagal start kamera:", err);
            });

            // Event saat pengguna mengganti pilihan kamera di dropdown
            cameraSelect.onchange = async () => {
                if (scannerRunning) {
                    await html5QrCode.stop();
                    scannerRunning = false;
                }
                currentCameraId = cameraSelect.value;
                startScanner(); // Restart scanner dengan kamera baru
            };

        } else {
            fallbackStartCamera();
        }
    }).catch(err => {
        console.warn("Gagal mengambil list kamera:", err);
        fallbackStartCamera();
    });
}

// Fungsi cadangan jika pemilihan deviceId spesifik gagal
function fallbackStartCamera() {
    html5QrCode.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 220, height: 220 } },
        onScanSuccess,
        onScanError
    ).then(() => {
        scannerRunning = true;
    }).catch(err => {
        console.error("Gagal total membuka kamera:", err);
        alert("Gagal membuka kamera. Pastikan izin kamera sudah diberikan atau coba gunakan koneksi HTTPS / Localhost yang valid.");
    });
}

function stopScanner() {
    if (!html5QrCode || !scannerRunning) return Promise.resolve();
    return html5QrCode.stop()
        .then(() => { scannerRunning = false; })
        .catch(err => { console.error("Gagal stop scanner", err); scannerRunning = false; });
}

function onScanSuccess(decodedText) {
    if (handlingScan) return;
    handlingScan = true;

    stopScanner().then(() => {
        currentScannedId = decodedText;
        document.getElementById('scanned-id').innerText = decodedText;
        document.getElementById('result-container').classList.remove('hidden');
        fetchDataFromSheet(decodedText);
    });
}

function onScanError() {}

function resetScanner() {
    resetResult();
    startScanner();
}

// ================= CHECK-IN & ROMBONGAN =================
function fetchDataFromSheet(id) {
    const container = document.getElementById('members-list-container');
    const btnConfirm = document.getElementById('btn-confirm');

    container.innerHTML = "<p style='font-size:13px; color:var(--text-muted); text-align:center; padding: 10px;'>Memeriksa database rombongan...</p>";
    btnConfirm.classList.add('hidden');

    fetch(`${SCRIPT_URL}?id=${encodeURIComponent(id)}`)
        .then(response => response.json())
        .then(data => {
            if (data.status === "success" && data.members) {
                cachedMembers = data.members;
                renderMembersList();
                btnConfirm.classList.remove('hidden');
            } else {
                container.innerHTML = "<p style='font-size:13px; color:var(--danger); text-align:center;'>Rombongan / ID Tidak Ditemukan</p>";
            }
        })
        .catch(err => {
            console.error(err);
            alert("Gagal terhubung ke server Google Sheet.");
            resetScanner();
        });
}

function renderMembersList() {
    const container = document.getElementById('members-list-container');
    container.innerHTML = "";

    cachedMembers.forEach((member, index) => {
        const row = document.createElement('div');
        row.className = 'member-row';

        const nameSpan = document.createElement('span');
        nameSpan.className = 'member-name';
        nameSpan.innerText = member.nama;

        const toggleBtn = document.createElement('button');
        toggleBtn.type = 'button';
        const isHadir = (member.checkin_status === "Hadir");
        toggleBtn.className = `status-toggle-btn ${isHadir ? 'hadir' : 'belum'}`;
        toggleBtn.innerText = isHadir ? "Hadir" : "Belum Hadir";
        
        toggleBtn.onclick = () => {
            cachedMembers[index].checkin_status = (cachedMembers[index].checkin_status === "Hadir") ? "Belum" : "Hadir";
            renderMembersList();
        };

        row.appendChild(nameSpan);
        row.appendChild(toggleBtn);
        container.appendChild(row);
    });
}

function confirmCheckIn() {
    const btnConfirm = document.getElementById('btn-confirm');
    btnConfirm.innerText = "Menyimpan Perubahan...";
    btnConfirm.disabled = true;

    const updates = cachedMembers.map(m => ({
        row: m.row_index,
        status: m.checkin_status
    }));

    fetch(SCRIPT_URL, {
        method: "POST",
        body: JSON.stringify({ updates: updates })
    })
    .then(response => response.json())
    .then(data => {
        if (data.status === "success_updated") {
            alert("Status kehadiran rombongan berhasil diperbarui!");
            lastRenderKey = "";
            resetScanner();
        } else {
            alert("Gagal memperbarui status.");
        }
        btnConfirm.innerText = "Simpan Perubahan Kehadiran";
        btnConfirm.disabled = false;
    })
    .catch(err => {
        console.error(err);
        alert("Terjadi kesalahan jaringan.");
        btnConfirm.innerText = "Simpan Perubahan Kehadiran";
        btnConfirm.disabled = false;
    });
}

// ================= DAFTAR HADIR =================
function loadAttendees() {
    fetch(`${SCRIPT_URL}?action=list`)
        .then(r => r.json())
        .then(data => {
            if (data.status === "success") {
                attendeesData = data.peserta;
                renderAttendees();
            }
        })
        .catch(err => {
            console.error("Gagal memuat daftar hadir:", err);
        });
}

function colorFor(nama) {
    let h = 0;
    for (const ch of nama) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
    return PALETTE[h % PALETTE.length];
}

const seenNames = new Set();
const PAGE_SIZE = 24;
let visibleCount = PAGE_SIZE;
let lastQuery = "";

function renderAttendees() {
    const q = document.getElementById('search-input').value.trim().toLowerCase();

    if (q !== lastQuery) {
        visibleCount = PAGE_SIZE;
        lastQuery = q;
    }

    const filtered = attendeesData.filter(p => p.nama.toLowerCase().includes(q));
    const shown = filtered.slice(0, visibleCount);

    document.getElementById('attendee-count').innerText = attendeesData.length;

    const key = JSON.stringify([q, visibleCount, shown.map(p => p.nama), filtered.length]);
    if (key === lastRenderKey) return;
    lastRenderKey = key;

    const grid = document.getElementById('attendee-grid');
    const empty = document.getElementById('empty-state');
    grid.innerHTML = "";

    if (attendeesData.length === 0) {
        empty.classList.remove('hidden');
        grid.classList.add('hidden');
        return;
    }
    empty.classList.add('hidden');
    grid.classList.remove('hidden');

    if (filtered.length === 0) {
        const msg = document.createElement('p');
        msg.className = 'no-match';
        msg.textContent = `Tidak ada nama "${q}" yang hadir`;
        grid.appendChild(msg);
        return;
    }

    shown.forEach(p => {
        const isNew = !seenNames.has(p.nama);
        seenNames.add(p.nama);

        const tile = document.createElement('div');
        tile.className = 'tile';
        tile.style.background = colorFor(p.nama);
        if (!isNew) tile.style.animation = 'none';

        const img = document.createElement('img');
        img.src = avatarUrl(p.nama);
        img.alt = '';
        img.loading = 'lazy';

        const name = document.createElement('div');
        name.className = 'tile-name';
        name.textContent = p.nama;

        tile.append(img, name);
        grid.appendChild(tile);
    });

    const remaining = filtered.length - visibleCount;
    if (remaining > 0) {
        const btn = document.createElement('button');
        btn.className = 'more-btn';
        btn.textContent = `Tampilkan lebih banyak (${remaining} lagi)`;
        btn.onclick = () => {
            visibleCount += PAGE_SIZE;
            renderAttendees();
        };
        grid.appendChild(btn);
    }
}

const AVATAR_VERSION = "10.x";
const AVATAR_STYLE = "critters";
const AVATAR_EXTRA = "tags=animation";

function avatarUrl(nama) {
    const extra = AVATAR_EXTRA ? `&${AVATAR_EXTRA}` : "";
    return `https://api.dicebear.com/${AVATAR_VERSION}/${AVATAR_STYLE}/svg?seed=${encodeURIComponent(nama)}${extra}`;
}

window.onload = () => showScreen('menu');
window.showScreen = showScreen;