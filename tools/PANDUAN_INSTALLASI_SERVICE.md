# Panduan Otomatisasi Service U.are.U 4500 Fingerprint Bridge di Windows

Panduan ini digunakan untuk memasang **U.are.U 4500 Local Bridge** sebagai **Windows Background Service** agar otomatis berjalan saat PC komputer dinyalakan (booting), tanpa memunculkan jendela hitam console (CMD).

---

## 📁 Lokasi Berkas Installer

Seluruh berkas tersedia di dalam folder project HRMS:
`C:\HRMS-Pro\tools\`

1. `uareu_bridge.py` — Program utama pembaca fingerprint & REST API `localhost:8000`.
2. `install_service.bat` — Script otomatis untuk memasang Windows Auto-Start Service.
3. `uninstall_service.bat` — Script otomatis untuk mencopot service jika diperlukan.

---

## 🛠️ Langkah-Langkah Pemasangan di PC Komputer Kantor / RS

### Langkah 1: Persiapan Python (Hanya dilakukan 1x di awal)
1. Pastikan PC sudah terinstall **Python 3.8+**.
2. Saat install Python, pastikan opsi **"Add Python to PATH"** dicentang.

---

### Langkah 2: Jalankan Installer
1. Buka folder `C:\HRMS-Pro\tools\`.
2. Klik kanan pada berkas **`install_service.bat`**.
3. Pilih **"Run as administrator"** (Jalankan sebagai Administrator).
4. Jendela installer akan berjalan otomatis memasang dependensi & mendaftarkan auto-start.

---

## ✅ Verifikasi Service Berjalan

1. Buka Browser (Chrome / Edge / Firefox).
2. Akses alamat: `http://localhost:8000/api/uareu/status`
3. Jika muncul respon JSON berikut, berarti service **berhasil aktif**:
```json
{
  "connected": true,
  "deviceName": "DigitalPersona U.are.U 4500",
  "hostname": "KOMPUTER-POLI-1",
  "ip_local": "192.168.1.45"
}
```

---

## 🔒 Keunggulan & Keamanan
- **Tanpa Jendela CMD**: Berjalan diam-diam di background (silent mode).
- **Auto-Start**: Otomatis aktif saat Windows hidup tanpa perlu diklik manual oleh staf.
- **Aman dengan BPJS V-Claim**: Device handle dilepas otomatis setelah scan selesai, tidak mengunci USB.
