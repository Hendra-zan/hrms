import React from 'react';
import { Badge, Step, InfoBox, FAQ, FeatureCard, SectionTitle, TipCard } from './GuideComponents';

const GuideFaceRecognition: React.FC = () => {
    return (
        <div className="space-y-6">
            <InfoBox type="info">
                Fitur <strong>Verifikasi Absensi Face Recognition</strong> menggunakan kecerdasan buatan (AI) berbasis biometrik wajah dengan <strong>Liveness Detection</strong> untuk mencegah kecurangan (anti-spoofing dengan foto/video).
            </InfoBox>

            {/* Keunggulan AI */}
            <div className="space-y-3">
                <SectionTitle icon="🤖">Keunggulan Face Recognition AI</SectionTitle>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <FeatureCard icon="👁️" title="Liveness Detection (Anti-Spoofing)" desc="Memastikan kehadiran fisik nyata (deteksi kedipan/gerakan), bukan foto dari layar HP." badge="Keamanan AI" badgeColor="blue" />
                    <FeatureCard icon="⚡" title="Verifikasi Instan (< 1 Detik)" desc="Pencocokan vektor 128-dimensi wajah dengan database lokal sangat cepat tanpa lag." badge="Performa" badgeColor="teal" />
                    <FeatureCard icon="📸" title="Enrollment Wajah Sekali" desc="Setiap karyawan hanya perlu melakukan pendaftaran (enrollment) 3 pose wajah sekali saja." badge="Kemudahan" badgeColor="purple" />
                    <FeatureCard icon="💻" title="Kamera Standar (Webcam)" desc="Dapat berjalan di webcam PC, laptop, mau pun tablet tanpa perlu perangkat biometrik khusus." badge="Fleksibel" badgeColor="green" />
                </div>
            </div>

            {/* Tahapan Enrollment & Verification */}
            <div className="space-y-3">
                <SectionTitle icon="📌">Alur Pendaftaran (Enrollment) & Verifikasi</SectionTitle>
                <div className="space-y-2">
                    <Step no={1} title="Pendaftaran Data Wajah Karyawan">
                        <p>Admin IT / HRD membuka menu <strong>Karyawan</strong> → buka detail karyawan → klik <strong>👤 Enroll Wajah AI</strong>.</p>
                    </Step>
                    <Step no={2} title="Pengambilan 3 Pose Wajah">
                        <p>Karyawan menghadap kamera webcam: ikuti petunjuk sistem untuk mengambil foto <strong>Tampak Depan</strong>, <strong>Tengadah Sedikit</strong>, dan <strong>Senyum/Kedip</strong>.</p>
                    </Step>
                    <Step no={3} title="Verifikasi Absensi di Kios/Web">
                        <p>Saat akan absen, karyawan cukup berdiri di depan kamera terminal absensi unit. Sistem otomatis mengenali nama & mencatat jam hadir.</p>
                    </Step>
                </div>
            </div>

            {/* FAQ */}
            <div className="space-y-3">
                <SectionTitle icon="❓">FAQ Face Recognition</SectionTitle>
                <FAQ items={[
                    {
                        q: 'Apakah karyawan bisa absen menggunakan foto tercetak?',
                        a: 'Tidak bisa. Sistem Liveness Detection akan menolak foto mati atau rekaman video karena mendeteksi ketiadaan respon refleks biometrik nyata.',
                    },
                    {
                        q: 'Bagaimana jika karyawan menggunakan kacamata atau masker?',
                        a: 'Kacamata bening dapat dikenali dengan baik. Untuk masker, disarankan diturunkan sebentar ke dagu selama 1 detik saat verifikasi.',
                    },
                ]} />
            </div>

            <TipCard title="Pencahayaan Kamera" color="blue">
                Pastikan posisi terminal kamera tidak membelakangi sumber cahaya terang (backlight) untuk hasil pengenalan wajah optimal.
            </TipCard>
        </div>
    );
};

export default GuideFaceRecognition;
