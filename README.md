# 🎄 System Check-in Rombongan Natal GYM Favor & Teens Ministry 2026

Aplikasi berbasis web modern untuk manajemen kehadiran dan pemindaian *QR Code* bagi peserta acara Natal **GYM Favor & Teens Ministry 2026**. Proyek ini dibuat menggunakan **Vite (Vanilla JS)** untuk performa kilat dan kemudahan pengelolaan *environment variables*, serta menggunakan backend **Google Apps Script (GAS)**.

---

## 🚀 Fitur Utama

- **Pemindai QR Code Real-time:** Mengintegrasikan library `html5-qrcode` dengan penanganan izin kamera bawaan perangkat seluler (HP) maupun laptop.
- **Daftar Hadir Dinamis:** Sinkronisasi kehadiran peserta secara langsung (*real-time*) ke Google Sheets melalui backend API Google Apps Script.
- **Arsitektur Ringkas & Cepat:** Berbasis Vite ES Modules tanpa overhead framework besar.
- **Deployment-Ready:** Dirancang khusus untuk deployment instan ke platform **Vercel**.

---

## 🛠️ Persyaratan Sistem

- **Node.js**: versi 18.x atau lebih baru
- **npm**: versi 9.x atau lebih baru

---

## ⚙️ Panduan Instalasi Lokal

1. **Clone Repository**
   ```bash
   git clone https://github.com/gpiayouthministry/natal-gym-teens-2026.git
   cd natal-gym-teens-2026/natal-checkin
   ```

2. **Install Dependensi**
   ```bash
   npm install
   ```

3. **Konfigurasi Environment Variables**
   Buat file `.env.local` pada *root folder* proyek (`natal-checkin/`), lalu tambahkan URL Web App Google Apps Script kamu:
   ```env
   VITE_SCRIPT_URL=https://script.google.com/macros/s/AdYjnGfdncrpA/exec / minta josef aja ini
   ```

4. **Jalankan Development Server**
   ```bash
   npm run dev
   ```
   Buka `http://localhost:5173` di browser kamu.

5. **Pengujian via Perangkat Seluler (Jaringan Lokal)**
   Untuk menguji fungsionalitas pemindai kamera secara langsung pada perangkat HP melalui Wi-Fi/Hotspot yang sama:
   ```bash
   npm run dev -- --host
   ```
   Buka alamat IP Network yang tertera di terminal (contoh: `http://192.168.x.x:5173`) pada browser HP.

---

## 🌐 Alur Deployment ke Vercel

1. **Push Perubahan ke Repository GitHub**
   ```bash
   git add .
   git commit -m "Build: Siap deployment ke Vercel"
   git push -u origin main
   ```

2. **Pengaturan Proyek Baru di Vercel**
   - Masuk ke dashboard **Vercel** dan buat *New Project*.
   - Impor repository `gpiayouthministry/natal-gym-teens-2026`.
   - Pada pengaturan **Root Directory**, pilih folder `natal-checkin` (jika aplikasi berada di dalam sub-folder).

3. **Memasukkan Environment Variables di Vercel**
   - Di bagian **Environment Variables** pada dashboard Vercel, tambahkan kunci variabel:
     - **Key:** `VITE_SCRIPT_URL`
     - **Value:** *(URL Web App Google Apps Script kamu)*
   - Klik **Deploy**.

---

## 📁 Struktur Folder Proyek

```text
natal-checkin/
├── public/              # Aset statis (favicon, icons)
├── src/
│   ├── assets/          # Media dan ilustrasi
│   ├── main.js          # Logika JavaScript utama & penanganan scanner QR
│   └── style.css        # Styling UI aplikasi
├── .env.local           # Environment variable lokal (diabaikan oleh git)
├── .gitignore           # Daftar file/folder yang dikecualikan dari repositori
├── index.html           # Berkas HTML utama (Entry Point dengan ES Module)
├── package.json         # Konfigurasi dependensi npm
└── README.md            # Dokumentasi teknis proyek
```

---

## 🛡️ Hak Cipta & Lisensi

Dikelola secara internal oleh **GPIA Youth Ministry** untuk keperluan acara **Natal GYM Favor & Teens Ministry 2026**.
