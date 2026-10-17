# MRA Corporate Meeting Room Booking System

Sistem terpadu reservasi ruang rapat multi-entitas untuk MRA Group (**PT Mugi Rekso Abadi**, **PT Mogems Putri International**, dan **MRA Media**) yang mengadopsi arsitektur dan pola desain dari **HR HUB (khususnya Interview Calendar)**.

---

## 🏛️ Master Data Entitas & Ruang Rapat

| Perusahaan | Nama Ruangan | Lokasi / Lantai | Kapasitas | Fasilitas Awal |
| :--- | :--- | :--- | :---: | :--- |
| **PT Mogems Putri International** | Ruang Meeting Lt 10 | Lantai 10 | 7 – 9 Orang | Smart TV 65", Polycom Conference, Glass Whiteboard, WiFi 6 |
| **PT Mugi Rekso Abadi (Holding)** | Ruang Meeting A | Lantai 2 (Main Hall) | 14 – 20 Orang | Dual Screen Projector, 4K Video Conf, Surround Mic, Whiteboard |
| **PT Mugi Rekso Abadi (Holding)** | Ruang Meeting B | Lantai 2 | 4 – 6 Orang | Smart TV 55", Whiteboard, Extension Power Bar |
| **PT Mugi Rekso Abadi (Holding)** | Ruang Meeting C | Lantai 2 | 8 – 12 Orang | Smart TV 65", Soundbar Mic, Whiteboard, Air Purifier |
| **MRA Media** | R. Meeting Diamond | Media Wing / Studio | 12 – 15 Orang | Acoustic Soundproofing, Display Besar, Studio Mics |

---

## ⚙️ Fitur Utama Sistem

1. **4 Mode Tampilan Kalender (Sesuai HR HUB)**:
   - **Room Timeline View**: Kolom samping menampilkan seluruh ruangan secara berdampingan, baris vertikal menampilkan jam 08:00 – 19:00 WIB. Klik langsung kotak jam kosong untuk reservasi instan.
   - **Mingguan (Week View)**: Grid 7 hari ala Google Calendar dengan *lane layout* otomatis untuk meeting bersamaan.
   - **Bulanan (Month View)**: Grid 35 hari dengan chip status agenda per hari.
   - **Agenda View**: Rekapitulasi agenda meeting berurutan kronologis.

2. **Mesin Validasi Anti-Bentrok (Collision Prevention Engine)**:
   - Evaluasi real-time: `startTime < existingEnd && endTime > existingStart`.
   - Feedback visual instan saat memilih jam di form reservasi (indikator hijau bila tersedia, indikator merah detail agenda yang bentrok bila jadwal tabrakan).
   - Atomic database level check saat submit booking.

3. **Sinkronisasi Kalender & Notifikasi Email Otomatis**:
   - Generator file standar **iCalendar (`.ics`)** RFC 5545 terintegrasi.
   - Mengirim email konfirmasi ber-branding MRA ke Host dan seluruh email peserta (`attendees`).
   - Peserta dapat langsung klik *"Add to Calendar"* di Outlook, Google Calendar, atau Smartphone mereka.
   - Pengiriman email otomatis saat pembatalan (*cancellation*).

4. **Kontrol Fasilitas (Amenities) & Master Ruangan oleh Tim GA**:
   - Menu khusus **Room Setup (GA)**.
   - Checklist cepat fasilitas umum (Smart TV, Polycom, Projector, Soundbar, Whiteboard, dll.).
   - Input custom fasilitas tanpa batas (tag dynamic).
   - Penyesuaian kapasitas min-max dan toggle *Maintenance Mode* (AC Rusak / Renovasi).

---

## 🚀 Panduan Menjalankan Sistem

### 1. Menjalankan Backend (Port 5007)
```bash
cd backend
npm install
npx prisma generate
node scripts/seed.js   # Inisialisasi entitas, ruangan & demo booking
npm run dev
```

### 2. Menjalankan Frontend (Port 3007)
```bash
cd frontend
npm install
npm run dev
```

Buka browser di: `http://localhost:3007`
Backend API Health: `http://localhost:5007/api/health`
