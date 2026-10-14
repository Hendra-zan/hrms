import React from 'react';
import { Badge, Step, InfoBox, FAQ, FeatureCard, SectionTitle, TipCard, StatusRow } from './GuideComponents';

const GuideKepala: React.FC = () => {
    return (
        <div className="space-y-6">
            <InfoBox type="info">
                <strong>Dashboard Kepala Ruangan (Karu)</strong> adalah pusat kendali operasional untuk mengelola staf unit kerja Anda — memantau kehadiran real-time, mengelola jadwal shift bulanan, memverifikasi logbook harian, dan menyetujui tukar shift/permohonan.
            </InfoBox>

            {/* Dashboard Highlights */}
            <div className="space-y-3">
                <SectionTitle icon="🖥️">Komponen Dashboard Utama</SectionTitle>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <FeatureCard icon="👋" title="Header Profil Unit" desc="Menampilkan nama Karu, foto profil, dan unit kerja yang dikelola beserta tombol Refresh data." />
                    <FeatureCard icon="📊" title="Kartu Ringkasan Operasional" desc="Total Staf Aktif, Hadir Hari Ini (%), Tidak Hadir, dan Konfigurasi Shift unit." />
                    <FeatureCard icon="⏱️" title="Verifikasi Logbook Staf" desc="Akses cepat meninjau logbook aktivitas harian staf unit (✓ Setujui / ✕ Perbaikan)." />
                    <FeatureCard icon="🎨" title="Distribusi Shift Hari Ini" desc="Jumlah staf bertugas per shift hari ini (Pagi, Siang, Malam, Libur) dari jadwal resmi." />
                    <FeatureCard icon="📋" title="Ringkasan Jadwal Bulan Ini" desc="Statistik jadwal: Total Jadwal, Draft, Published, Libur, dan Coverage Alert." />
                    <FeatureCard icon="⚡" title="Aksi Cepat Karu" desc="Shortcut instan: Kelola Jadwal, Pantau Live, Verifikasi Logbook, Daftar Staf." />
                </div>
            </div>

            {/* Alur Kerja Rutin Karu */}
            <div className="space-y-3">
                <SectionTitle icon="📌">Alur Kerja Rutin Kepala Ruangan</SectionTitle>
                <div className="space-y-2">
                    <Step no={1} title="Cek Presensi & Kehadiran Staf Pagi Hari">
                        <p>Buka Dashboard Karu → cek <strong>Kartu Ringkasan & Distribusi Shift Hari Ini</strong> untuk memastikan staf yang bertugas Pagi/Siang sudah hadir.</p>
                    </Step>
                    <Step no={2} title="Verifikasi Logbook Aktivitas Kerja">
                        <p>Buka menu <strong>Logbook & Catatan Kerja</strong> → tab <strong>Verifikasi Staf Unit</strong>. Tinjau aktivitas staf dan berikan persetujuan atau catatan perbaikan.</p>
                    </Step>
                    <Step no={3} title="Persetujuan Permohonan Tukar Shift">
                        <p>Tinjau pengajuan tukar shift antar staf di unit Anda. Verifikasi apakah ada risiko fatigue (istirahat &lt; 11 jam) sebelum menyetujui.</p>
                    </Step>
                    <Step no={4} title="Penyusunan & Generate Jadwal Bulan Berikutnya">
                        <p>Gunakan form <strong>⚡ Generate Jadwal Bulanan</strong> di tab Jadwal Shift dengan pola rotasi unit, Stagger Offset, dan cek Live Preview 14 hari.</p>
                    </Step>
                    <Step no={5} title="Analisis Keadilan & Publish Jadwal">
                        <p>Periksa <strong>📊 Indeks Keadilan Shift (Equitability Index)</strong> untuk memastikan shift malam dan total jam terbagi adil, lalu klik <strong>Publish Jadwal</strong>.</p>
                    </Step>
                </div>
            </div>

            {/* Hak Akses & Wewenang */}
            <div className="space-y-3">
                <SectionTitle icon="🔐">Hak Akses & Wewenang Karu</SectionTitle>
                <div className="rounded-xl border border-gray-200 overflow-hidden text-xs">
                    <div className="bg-gray-50 px-4 py-2 font-semibold text-gray-700 border-b border-gray-200">Batas Akses Peran Kepala Ruangan</div>
                    <StatusRow icon="✅">Lihat data karyawan di unit kerja sendiri</StatusRow>
                    <StatusRow icon="✅">Kelola jadwal shift unit (konfigurasi, pola rotasi, generate, publish, override manual)</StatusRow>
                    <StatusRow icon="✅">Verifikasi & setujui Logbook Aktivitas Kerja Harian staf unit</StatusRow>
                    <StatusRow icon="✅">Kirim catatan/instruksi tugas 2-arah ke staf unit</StatusRow>
                    <StatusRow icon="✅">Approve permohonan tukar shift & perizinan staf unit</StatusRow>
                    <StatusRow icon="✅">Pantau kehadiran live & lokasi geotagging staf unit</StatusRow>
                    <StatusRow icon="❌">Akses data unit/ruangan lain</StatusRow>
                    <StatusRow icon="❌">Ubah data pokok karyawan (profil, NIK, gaji)</StatusRow>
                    <StatusRow icon="❌">Akses menu penggajian & konfigurasi sistem umum RS</StatusRow>
                </div>
            </div>

            {/* FAQ */}
            <div className="space-y-3">
                <SectionTitle icon="❓">FAQ Kepala Ruangan</SectionTitle>
                <FAQ items={[
                    {
                        q: 'Bagaimana jika staf lupa melakukan absensi masuk?',
                        a: 'Karu tidak dapat menambahkan absensi secara langsung. Hubungi HRD/Admin untuk pengajuan koreksi absensi manual dengan menyertakan alasan sah.',
                    },
                    {
                        q: 'Bagaimana cara memverifikasi logbook harian staf?',
                        a: 'Buka menu Logbook & Catatan Kerja → sub-tab "🔍 Verifikasi Staf Unit". Klik "✓ Setujui" jika sesuai, atau "✕ Perbaikan" jika catatan perlu dilengkapi.',
                    },
                    {
                        q: 'Kenapa distribusi shift di dashboard menampilkan status Draft?',
                        a: 'Pastikan jadwal bulan berjalan sudah di-Publish. Jika masih status Draft, sistem akan menampilkan peringatan dan menggunakan data shift bawaan profil.',
                    },
                    {
                        q: 'Bagaimana cara mencegah ketimpangan shift malam antar staf?',
                        a: 'Gunakan tab 📊 Analisis Keadilan Shift (Equitability Index). Cek persentase skor keadilan. Jika < 80%, sesuaikan shift malam secara manual lewat override kalender.',
                    },
                ]} />
            </div>

            <TipCard title="Efisiensi Karu" color="teal">
                Lakukan verifikasi logbook harian di akhir shift agar catatan aktivitas staf tidak menumpuk di akhir bulan.
            </TipCard>
        </div>
    );
};

export default GuideKepala;
