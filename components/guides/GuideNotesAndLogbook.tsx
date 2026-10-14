import React from 'react';
import { Badge, Step, InfoBox, FAQ, FeatureCard, SectionTitle, TipCard } from './GuideComponents';

const GuideNotesAndLogbook: React.FC = () => {
    return (
        <div className="space-y-6">
            <InfoBox type="info">
                Modul <strong>Logbook & Catatan Kerja</strong> berfungsi untuk mencatat aktivitas kerja harian staf medis/non-medis selama shift bertugas, pengiriman instruksi 2-arah dari Karu/Atasan, serta verifikasi laporan kegiatan unit.
            </InfoBox>

            {/* Fitur Utama */}
            <div className="space-y-3">
                <SectionTitle icon="📋">Fungsi & Fitur Logbook</SectionTitle>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <FeatureCard icon="📝" title="Pencatatan Aktivitas Shift" desc="Staf mencatat daftar uraian tugas & aktivitas yang dilakukan selama jam shift bertugas." badge="Input Staf" badgeColor="blue" />
                    <FeatureCard icon="🔍" title="Verifikasi Kepala Ruangan" desc="Karu meninjau & memberikan status (✓ Setujui / ✕ Minta Perbaikan) pada logbook harian staf." badge="Review Karu" badgeColor="teal" />
                    <FeatureCard icon="✉️" title="Catatan 2-Arah & Instruksi" desc="Atasan dapat mengirimkan catatan instruksi khusus perorangan/unit yang memerlukan respon staf." badge="Instruksi" badgeColor="purple" />
                    <FeatureCard icon="📊" title="Rekapitulasi Logbook Unit" desc="Riwayat logbook terarsip rapi & dapat di-export untuk pelaporan kinerja SDM rumah sakit." badge="Arsip" badgeColor="green" />
                </div>
            </div>

            {/* Alur Kerja Logbook */}
            <div className="space-y-3">
                <SectionTitle icon="📌">Alur Pencatatan & Verifikasi Logbook</SectionTitle>
                <div className="space-y-2">
                    <Step no={1} title="Staf Mengisi Logbook Harian (via ESS)">
                        <p>Buka ESS / Menu Catatan → klik <strong>+ Isi Logbook Hari Ini</strong> → masukkan uraian tugas, jam pelaksanaan, dan catatan hasil kegiatan shift.</p>
                    </Step>
                    <Step no={2} title="Submit Logbook ke Kepala Ruangan">
                        <p>Setelah shift selesai, klik <strong>Kirim Logbook</strong>. Status berubah menjadi <Badge text="Menunggu Verifikasi" color="yellow" />.</p>
                    </Step>
                    <Step no={3} title="Kepala Ruangan Memverifikasi Logbook">
                        <p>Karu membuka menu Catatan → sub-tab <strong>Verifikasi Staf Unit</strong> → review laporan → klik <strong>✓ Setujui</strong> atau <strong>✕ Perbaikan</strong>.</p>
                    </Step>
                    <Step no={4} title="Revisi oleh Staf (Jika Ada Perbaikan)">
                        <p>Jika Karu meminta perbaikan, staf akan mendapat notifikasi dan dapat memperbarui uraian tugas kemudian mengirim ulang.</p>
                    </Step>
                </div>
            </div>

            {/* FAQ */}
            <div className="space-y-3">
                <SectionTitle icon="❓">FAQ Logbook Kerja</SectionTitle>
                <FAQ items={[
                    {
                        q: 'Apakah logbook wajib diisi setiap shift?',
                        a: 'Ya, sesuai dengan kebijakan akreditasi rumah sakit dan evaluasi kinerja bulanan staf.',
                    },
                    {
                        q: 'Bisakah mengisi logbook untuk tanggal yang lalu (susulan)?',
                        a: 'Pengisian susulan diizinkan maksimal 3 hari ke belakang dengan mencantumkan alasan keterlambatan pengisian.',
                    },
                ]} />
            </div>

            <TipCard title="Rincian Kegiatan" color="teal">
                Tuliskan kegiatan secara spesifik (misal: "Asuhan keperawatan 5 pasien ruang Melati 2") untuk mempermudah proses verifikasi Karu.
            </TipCard>
        </div>
    );
};

export default GuideNotesAndLogbook;
