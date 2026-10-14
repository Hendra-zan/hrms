import React from 'react';
import { Badge, Step, InfoBox, FAQ, FeatureCard, SectionTitle, TipCard } from './GuideComponents';

const GuideAnnouncementsPolicies: React.FC = () => {
    return (
        <div className="space-y-6">
            <InfoBox type="info">
                Modul <strong>Pengumuman & Kebijakan RS (SOP)</strong> merupakan media komunikasi resmi internal rumah sakit untuk menyebarkan surat edaran direksi, kebijakan operasional, pedoman K3RS, serta dokumen Standar Operasional Prosedur (SOP).
            </InfoBox>

            {/* Fitur Utama */}
            <div className="space-y-3">
                <SectionTitle icon="📢">Fungsi & Fitur Pengumuman</SectionTitle>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <FeatureCard icon="📌" title="Pengumuman Sematan (Pinned)" desc="Pengumuman penting atau darurat disematkan di posisi paling atas agar langsung dibaca seluruh staf." badge="Prioritas" badgeColor="red" />
                    <FeatureCard icon="📄" title="Lampiran Berkas SOP (PDF/Word)" desc="Setiap edaran/kebijakan dapat dilampiri file PDF atau Word resmi yang dapat diunduh staf." badge="Dokumen" badgeColor="blue" />
                    <FeatureCard icon="🎯" title="Target Penerima Spesifik" desc="Dapat ditargetkan ke Seluruh RS, Unit Kerja Tertentu, atau Kelompok Jabatan Medis/Non-Medis." badge="Targeted" badgeColor="purple" />
                    <FeatureCard icon="👁️" title="Pelacakan Pembaca (Read Receipts)" desc="Admin/HRD dapat melihat siapa saja staf yang sudah membaca pengumuman tersebut." badge="Monitoring" badgeColor="green" />
                </div>
            </div>

            {/* Cara Membuat Pengumuman */}
            <div className="space-y-3">
                <SectionTitle icon="📌">Langkah Penerbitan Pengumuman / SOP</SectionTitle>
                <div className="space-y-2">
                    <Step no={1} title="Buat Pengumuman Baru">
                        <p>Admin / HRD / Manajemen membuka menu <strong>Pengumuman & SOP</strong> → klik <strong>+ Tambah Pengumuman Baru</strong>.</p>
                    </Step>
                    <Step no={2} title="Isi Judul, Konten & Tingkat Urgensi">
                        <p>Isi Judul Pengumuman, isi pesan edaran, tentukan tingkat prioritas (<Badge text="Biasa" color="gray" />, <Badge text="Penting" color="yellow" />, <Badge text="Darurat / Pinned" color="red" />).</p>
                    </Step>
                    <Step no={3} title="Unggah Dokumen Lampiran (Opsional)">
                        <p>Unggah file SK Direksi / SOP format PDF atau DOCX jika ada lampiran resmi.</p>
                    </Step>
                    <Step no={4} title="Terbitkan Pengumuman">
                        <p>Klik <strong>🚀 Terbitkan</strong>. Pengumuman langsung muncul di dashboard & ESS seluruh staf penerima secara real-time.</p>
                    </Step>
                </div>
            </div>

            {/* FAQ */}
            <div className="space-y-3">
                <SectionTitle icon="❓">FAQ Pengumuman & SOP</SectionTitle>
                <FAQ items={[
                    {
                        q: 'Apakah karyawan mendapat notifikasi saat ada pengumuman baru?',
                        a: 'Ya, notifikasi otomatis dikirimkan ke Notification Center di pojok kanan atas aplikasi.',
                    },
                    {
                        q: 'Format file apa saja yang didukung untuk lampiran SOP?',
                        a: 'Format yang didukung mencakup PDF, DOCX, XLSX, PNG, dan JPG dengan ukuran maks 10 MB per file.',
                    },
                ]} />
            </div>

            <TipCard title="Arsip Kebijakan" color="blue">
                Gunakan kategori "SOP Unit" untuk mengarsipkan dokumen pedoman klinis agar mudah dicari kembali oleh perawat/dokter.
            </TipCard>
        </div>
    );
};

export default GuideAnnouncementsPolicies;
