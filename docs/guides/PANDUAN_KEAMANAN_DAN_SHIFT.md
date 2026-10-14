# Panduan Fitur: Keamanan, Shift Kerja, dan Absensi Ekstra (HRMS Pro)

Dokumen ini disusun sebagai panduan resmi bagi HRD, Atasan (Kepala Ruangan), dan Karyawan untuk memahami alur operasional dan mekanisme keamanan sistem absensi HRMS Pro.

---

## 1. Penanganan Absensi Ekstra (On-Call / Datang Kembali)

### Skenario Operasional
Karyawan telah menyelesaikan shift reguler (misal: Dinas Pagi `08:00 - 16:00`) dan telah melakukan absen pulang (`clockOut`). Malam harinya (misal pukul `20:00`), karyawan tersebut dipanggil kembali ke rumah sakit karena kebutuhan darurat (misal: perbaikan jaringan IT atau tindakan operasi cito) dan melakukan tapping kembali pada mesin absensi Hikvision.

### Mekanisme Teknis di Aplikasi
* **Bebas Bentrokan Data (Unique Constraint Safe):** Database PostgreSQL membatasi 1 baris absensi per karyawan per tanggal. Sistem tidak akan mencoba membuat baris baru (yang dapat menyebabkan error sistem), melainkan memperbarui baris yang sudah ada.
* **Kolom Khusus "Tap Ekstra":** Jam masuk dan pulang darurat akan dicatat secara otomatis pada kolom khusus bernama `Tap Ekstra`.
* **Visualisasi Dasbor & Ekspor Excel:** HRD dapat memantau jam kehadiran tambahan ini langsung pada tabel laporan detail karyawan di dashboard dan hasil unduhan file Excel dengan format:  
  `20:00 (In), 21:30 (Out)`

### Alur Kerja Rekomendasi (HR & Payroll)
Kehadiran ekstra ini secara operasional harus diajukan sebagai **Pengajuan Lembur Cito / On-Call** di aplikasi agar dihitung sebagai kompensasi lembur tambahan saat penggajian bulanan diproses.

---

## 2. Manajemen Shift Kerja & Aturan Prioritas

Sistem HRMS Pro mendukung dua lapis pengaturan shift kerja karyawan:

### A. Shift Default (Bawaan Profil Karyawan)
* **Dikelola Oleh:** HRD / Admin pada form Profil Karyawan.
* **Sifat:** Statis (Tetap).
* **Fungsi:** Menjadi acuan jam kerja dasar staf. Hanya digunakan oleh sistem jika tidak ada jadwal dinamis yang dibuat oleh Kepala Ruangan pada tanggal tersebut.

### B. Jadwal Kalender Kerja (Dibuat Kepala Ruangan)
* **Dikelola Oleh:** Kepala Ruangan di menu **Penjadwalan Shift Unit**.
* **Sifat:** Dinamis (Berubah-ubah sesuai jadwal bulanan unit).
* **Fungsi:** Mengatur rotasi shift kerja harian staf (Pagi, Sore, Malam, atau Libur/OFF).

### 📌 Aturan Prioritas Absensi
Sistem secara otomatis menerapkan aturan prioritas berikut saat mencocokkan waktu tapping kehadiran:
$$\text{Jadwal Harian (Kepala Ruangan)} \quad \succ \quad \text{Shift Bawaan (Profil Karyawan)}$$

1. **Jadwal Harian Kepala Ruangan (Prioritas 1):** Sistem akan selalu menggunakan jam kerja shift yang diatur Kepala Ruangan di kalender bulanan terlebih dahulu.
2. **Shift Bawaan Profil (Prioritas 2 / Fallback):** Jika kalender penjadwalan kosong (belum diisi oleh Kepala Ruangan), barulah sistem mendeteksi jam masuk/pulang menggunakan shift default dari profil karyawan.

---

## 3. Fitur Ubah Password Mandiri di Mobile APK

Karyawan kini dapat melakukan pemeliharaan keamanan akun mereka secara mandiri langsung dari aplikasi ponsel (Mobile APK).

### Cara Mengubah Kata Sandi
1. Buka aplikasi **Mobile APK HRMS Pro** dan masuk ke tab **Profil**.
2. Gulir ke bawah hingga menemukan kartu **⚙️ Pengaturan Keamanan**.
3. Ketuk tombol **`Ubah Password Login`**.
4. Masukkan **Password Baru** dan ketik ulang pada kolom **Konfirmasi Password Baru**.
5. Ketuk **Simpan**.

### Protokol Validasi Keamanan
* **Validasi Lokal HP:** Kata sandi wajib terdiri dari minimal **6 karakter** dan kedua input password harus terbukti cocok sebelum data dikirim.
* **Supabase Auth Integration:** Proses pembaruan langsung menggunakan otentikasi Supabase terenkripsi. Sesi pengguna terisolasi penuh, sehingga tidak ada celah bagi pengguna untuk mengubah kata sandi akun karyawan lain.

---

## 4. Keamanan Biometrik HP & Anti-Manipulasi

Sistem absensi mobile HRMS Pro dirancang menggunakan standar keamanan global setara dengan aplikasi perbankan (*mobile banking*).

### A. Pengamanan Sidik Jari (Zero Bio-Data di Server)
* **Regulasi Privasi Global (GDPR / UU PDP):** Aplikasi tidak mengirimkan gambar sidik jari atau koordinat biologis karyawan ke server/cloud.
* **Verifikasi Secure Chip:** Verifikasi dilakukan di dalam chip keamanan fisik HP karyawan (Secure Enclave di iOS / TEE di Android). Aplikasi hanya menerima konfirmasi digital "Sukses" atau "Gagal" dari sistem operasi ponsel.

### B. Strategi Anti-Kecurangan (Anti-Fraud)
Untuk mencegah karyawan melakukan manipulasi kehadiran, HRMS Pro menerapkan filter keamanan berlapis:

| Celah Kecurangan | Cara Kerja Manipulasi | Strategi Pertahanan HRMS Pro |
| :--- | :--- | :--- |
| **Titip Absen Device** | Menyerahkan HP ke rekan kerja untuk dibantu absen. | **Device Binding:** Satu akun hanya terikat ke 2 HP sah terdaftar. HRD dapat memantau model HP dan memblokir perangkat asing dari dasbor admin. |
| **Lokasi Palsu** | Menggunakan aplikasi Fake GPS agar terdeteksi di kantor. | **Geofencing & Mock Detection:** Aplikasi memverifikasi koordinat GPS berakurasi tinggi (di bawah 5m) dan mendeteksi serta menolak proses absen jika HP menggunakan aplikasi Fake GPS. |
| **Kloning Aplikasi** | Menduplikasi aplikasi menggunakan Parallel Space. | **Hardware Fingerprint Hash:** Pendaftaran perangkat merekam kode identitas mesin perangkat keras asli yang tidak dapat ditiru oleh aplikasi kloning. |
| **Bypass Sidik Jari** | Menggunakan PIN layar kunci HP saat sensor kotor. | **Audit Trail & Face Recognition:** Jenis absen dicatat rinci. HRD berhak menonaktifkan fitur sidik jari tertentu dan memaksa staf menggunakan verifikasi foto wajah + liveness. |

---

## 5. Panduan Penjadwalan Unit (Khusus Kepala Ruangan)

Bagi pengguna dengan peran **Kepala Ruangan**, Anda bertanggung jawab menyusun jadwal kerja harian staf di bawah unit Anda. Penjadwalan dilakukan melalui halaman **Manajemen Jadwal Shift** yang terdiri dari 3 tab utama:

### A. Tab "Jadwal Bulanan" (Kalender Jadwal Harian)
* **Fungsi:** Mengatur shift kerja harian staf Anda tanggal demi tanggal untuk satu bulan penuh.
* **Cara Mengisi Jadwal:**
  1. Pilih bulan dan tahun yang ingin dijadwalkan di bagian atas kalender.
  2. Anda akan melihat daftar nama staf beserta kotak tanggal dalam satu bulan.
  3. Klik langsung pada kotak tanggal staf yang ingin dijadwalkan.
  4. Pilih jenis shift yang diinginkan dari menu pilihan (misalnya: **Pagi**, **Siang**, **Malam**, atau **OFF/Libur**).
  5. Setelah selesai menyusun jadwal untuk seluruh staf pada bulan tersebut, klik tombol **`Simpan Perubahan Jadwal`** untuk menyimpan draf ke database.

### B. Tab "Pola Rotasi" (Otomatisasi Penjadwalan)
* **Fungsi:** Menghemat waktu penjadwalan dengan menerapkan siklus kerja yang berulang.
* **Cara Menggunakan Pola Rotasi:**
  1. Klik **`+ Tambah Pola Rotasi`**.
  2. Beri nama pola (misal: *Rotasi Perawat 3 Shift*).
  3. Masukkan siklus shift secara berurutan, contoh: `["Pagi", "Pagi", "Siang", "Siang", "Malam", "Malam", "OFF", "OFF"]`.
  4. Tentukan karyawan yang akan menggunakan pola tersebut dan tanggal mulainya.
  5. Sistem akan otomatis memproyeksikan jadwal kerja bulanan staf tersebut di Kalender secara instan tanpa perlu Anda input manual satu per satu tanggal demi tanggal.

### C. Tab "Konfigurasi Shift"
* **Fungsi:** Menyesuaikan jam kerja default, toleransi keterlambatan, dan warna visual khusus untuk shift yang berlaku di unit Anda (jika berbeda dengan ketentuan rumah sakit pusat).
* **Cara Menggunakan:**
  * Anda dapat menyesuaikan jam masuk/pulang serta toleransi menit keterlambatan pada setiap definisi shift agar sesuai dengan operasional unit spesifik Anda.

### 📥 Fitur Ekspor Penugasan Shift (Excel)
Di bagian kanan atas halaman, Kepala Ruangan dapat mengklik tombol **`Export XLSX`** untuk mengunduh seluruh data penugasan shift bulanan unit dalam format spreadsheet Excel yang rapi, siap untuk dicetak dan ditempel di papan pengumuman unit kerja.

---
*Dokumen ini diperbarui secara berkala sesuai dengan peningkatan fitur keamanan dan operasional HRMS Pro.*
