import React from 'react';
import { Badge, Step, InfoBox, FAQ, FeatureCard, SectionTitle, TipCard, GuideTable } from './GuideComponents';

const GuideAttendance: React.FC = () => {
    return (
        <div className="space-y-6">
            <InfoBox type="info">
                Modul <strong>Absensi & Kehadiran</strong> mendukung 3 metode pencatatan kehadiran: <strong>Mandiri Mobile ESS (Swafoto Geotagging GPS)</strong>, <strong>Mesin Fisik Hikvision (Biometrik Wajah/Sidik Jari)</strong>, dan <strong>Verifikasi AI Face Recognition</strong>.
            </InfoBox>

            {/* 3 Metode Absensi */}
            <div className="space-y-3">
                <SectionTitle icon="📲">3 Metode Absensi Yang Didukung</SectionTitle>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    <FeatureCard icon="📱" title="ESS Mobile GPS" desc="Karyawan absen dari HP dengan foto lokasi & geotagging koordinat GPS." badge="Mobile & Web" badgeColor="blue" />
                    <FeatureCard icon="📡" title="Mesin Hikvision" desc="Absensi biometrik otomatis via mesin fisik terintegrasi jaringan RS." badge="Hardware RS" badgeColor="teal" />
                    <FeatureCard icon="👤" title="AI Face Recognition" desc="Deteksi wajah AI anti-spoofing via kamera laptop/tablet di area unit." badge="Web Cam AI" badgeColor="purple" />
                </div>
            </div>

            {/* Status Absensi */}
            <div className="space-y-3">
                <SectionTitle icon="🏷️">Status & Toleransi Kehadiran</SectionTitle>
                <GuideTable
                    headers={['Status', 'Kriteria', 'Warna Badge']}
                    rows={[
                        ['Hadir Tepat Waktu', 'Absen masuk ≤ jam masuk jadwal shift', '🟢 Hijau'],
                        ['Terlambat', 'Absen masuk > jam masuk tetapi masih dalam batas toleransi', '🟡 Kuning'],
                        ['Sangat Terlambat', 'Absen masuk > jam toleransi keterlambatan unit', '🔴 Merah'],
                        ['Izin / Cuti', 'Permohonan izin/cuti yang sudah disetujui HRD/Karu', '🔵 Biru'],
                        ['Sakit', 'Permohonan sakit dengan melampirkan surat dokter', '🟣 Ungu'],
                        ['Tidak Hadir (Alpa)', 'Tidak ada catatan absensi & tidak ada pengajuan izin', '⚪ Abu-abu'],
                    ]}
                />
            </div>

            {/* Alur Absensi Mobile */}
            <div className="space-y-3">
                <SectionTitle icon="📌">Cara Absensi Mandiri (Mobile ESS)</SectionTitle>
                <div className="space-y-2">
                    <Step no={1} title="Buka ESS & Pastikan GPS Aktif">
                        <p>Buka HRMS Pro dari HP → masuk ke menu <strong>Absensi Mandiri</strong>. Pastikan lokasi GPS diizinkan oleh browser.</p>
                    </Step>
                    <Step no={2} title="Ambil Foto Swafoto (Selfie)">
                        <p>Klik <strong>Ambil Foto Absen</strong>. Sistem akan mengambil foto wajah beserta titik koordinat GPS lokasi Anda.</p>
                    </Step>
                    <Step no={3} title="Verifikasi Geofencing Radius">
                        <p>Jika posisi Anda berada di dalam radius unit kerja (misal: 100m dari RS), absensi akan langsung terverifikasi <strong>Valid</strong>.</p>
                    </Step>
                    <Step no={4} title="Absen Pulang Saat Shift Selesai">
                        <p>Lakukan langkah yang sama saat jam shift selesai untuk mencatat jam pulang & menghitung durasi jam kerja harian.</p>
                    </Step>
                </div>
            </div>

            {/* FAQ */}
            <div className="space-y-3">
                <SectionTitle icon="❓">FAQ Absensi</SectionTitle>
                <FAQ items={[
                    {
                        q: 'Bagaimana jika posisi GPS saya tidak terdeteksi saat absen mobile?',
                        a: 'Pastikan fitur Lokasi (Location Services) aktif di HP dan perizinan lokasi untuk browser sudah di-set "Allow". Jika berada di dalam gedung tebal, coba bergeser dekat jendela.',
                    },
                    {
                        q: 'Apakah bisa absen jika bertugas di luar RS (dinas luar)?',
                        a: 'Bisa. Pilih opsi "Dinas Luar / Tugas Lapangan" saat mengisi form absensi ESS dan cantumkan keterangannya.',
                    },
                    {
                        q: 'Bagaimana cara HRD mengoreksi data absensi yang keliru?',
                        a: 'HRD dapat membuka menu Manajemen Absensi → Rekap Harian → klik nama karyawan → lakukan koreksi jam masuk/pulang manual.',
                    },
                ]} />
            </div>

            <TipCard title="Absensi Geofencing" color="teal">
                Radius lokasi (geofencing) dapat diatur per unit kerja di menu Pengaturan Organisasi untuk fleksibilitas staf lapangan.
            </TipCard>
        </div>
    );
};

export default GuideAttendance;
