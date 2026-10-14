import React from 'react';
import { Badge, Step, InfoBox, FAQ, FeatureCard, SectionTitle, TipCard, Code } from './GuideComponents';

const GuideNik: React.FC = () => {
    return (
        <div className="space-y-6">
            <InfoBox type="info">
                <strong>NIK (Nomor Induk Karyawan)</strong> merupakan kunci identitas tunggal yang menghubungkan data karyawan antar seluruh modul — mulai dari Manajemen SDM, Jadwal Shift, Penggajian, hingga Mesin Absensi Biometrik Fisik (Hikvision/U.are.U).
            </InfoBox>

            {/* Aturan Format NIK */}
            <div className="space-y-3">
                <SectionTitle icon="🔢">Aturan Standardisasi Format NIK</SectionTitle>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <FeatureCard icon="1️⃣" title="Format Angka Murni" desc="Diisi angka saja tanpa karakter khusus/spasi (Contoh: 20240001)." badge="Format Standar" badgeColor="blue" />
                    <FeatureCard icon="🔒" title="Unik & Tidak Boleh Duplikat" desc="Setiap karyawan harus memiliki NIK yang unik di seluruh rumah sakit." badge="Identitas" badgeColor="red" />
                    <FeatureCard icon="📡" title="Sinkron Mesin Absensi" desc="Harus diinput sama persis di kolom Employee No pada mesin Hikvision." badge="Hardware Sync" badgeColor="teal" />
                    <FeatureCard icon="🏢" title="Prefiks Tahun / Unit (Opsional)" desc="Bisa menggunakan penomoran berpola seperti 2024.01.005 untuk kemudahan pengelompokan." badge="Pola RS" badgeColor="purple" />
                </div>
            </div>

            {/* Langkah Setup NIK */}
            <div className="space-y-3">
                <SectionTitle icon="📌">Langkah Setup NIK Karyawan</SectionTitle>
                <div className="space-y-2">
                    <Step no={1} title="Input NIK Saat Tambah/Edit Karyawan">
                        <p>Buka menu <strong>Karyawan</strong> → Tambah / Edit Karyawan → isi field <strong>NIK / Employee No</strong>.</p>
                    </Step>
                    <Step no={2} title="Verifikasi NIK">
                        <p>Pastikan NIK tidak duplikat dengan karyawan lain. Sistem akan menolak jika NIK sudah pernah terdaftar.</p>
                    </Step>
                    <Step no={3} title="Daftarkan NIK di Mesin Absensi Fisik">
                        <p>Buka menu Pengaturan Pengguna di mesin Hikvision → buat pengguna baru → masukkan <code>Employee No</code> = <Code>NIK Karyawan</Code>.</p>
                    </Step>
                </div>
            </div>

            {/* FAQ */}
            <div className="space-y-3">
                <SectionTitle icon="❓">FAQ Setup NIK</SectionTitle>
                <FAQ items={[
                    {
                        q: 'Bisakah NIK karyawan diubah setelah terdaftar?',
                        a: 'Bisa, oleh Admin/HRD. Namun jika diubah di HRMS Pro, NIK (Employee No) di mesin absensi fisik juga harus diperbarui agar sinkronisasi absensi tidak terputus.',
                    },
                    {
                        q: 'Apa bedanya NIK dengan No. KTP (NIK KTP)?',
                        a: 'NIK di HRMS Pro adalah Nomor Induk Karyawan internal rumah sakit. Berbeda dengan Nomor KTP (NIK Kependudukan 16 digit).',
                    },
                ]} />
            </div>

            <TipCard title="Cek Duplikasi NIK" color="blue">
                Gunakan pencarian NIK di tabel Karyawan sebelum mendaftarkan karyawan baru untuk memastikan NIK belum dipakai.
            </TipCard>
        </div>
    );
};

export default GuideNik;
