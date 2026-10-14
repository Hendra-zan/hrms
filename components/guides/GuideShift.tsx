import React from 'react';
import { Badge, Step, InfoBox, FAQ, FeatureCard, SectionTitle, TipCard, GuideTable } from './GuideComponents';

const GuideShift: React.FC<{ onNavigate?: (tab: string) => void }> = ({ onNavigate }) => {
    return (
        <div className="space-y-6">
            <InfoBox type="info">
                Menu <strong>Manajemen Jadwal Shift</strong> memungkinkan Kepala Ruangan membuat, mengelola, dan mempublikasikan jadwal shift bulanan secara otomatis menggunakan sistem <strong>Pola Rotasi</strong>, dilengkapi <strong>Live Preview</strong>, dan <strong>Analisis Keadilan Shift</strong>.
            </InfoBox>

            {/* Arsitektur 3 Layer */}
            <div className="space-y-3">
                <SectionTitle icon="🏗️">Arsitektur Penjadwalan (3 Layer)</SectionTitle>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {[
                        { icon: '⚙️', title: 'Layer 1: Konfigurasi Shift', desc: 'Definisi jenis shift (nama, jam masuk/pulang, warna, toleransi terlambat)', badge: 'Tab Konfigurasi', color: 'blue' },
                        { icon: '🔄', title: 'Layer 2: Pola Rotasi', desc: 'Template siklus berulang P–S–M–L yang menjadi dasar generate otomatis', badge: 'Tab Pola Rotasi', color: 'teal' },
                        { icon: '📋', title: 'Layer 3: Jadwal Harian', desc: 'Hasil generate: 1 baris = 1 karyawan × 1 tanggal. Bisa di-override manual', badge: 'Tab Jadwal Bulanan', color: 'purple' },
                    ].map((f, i) => (
                        <FeatureCard key={i} {...f} badgeColor={f.color} highlight={i === 2} />
                    ))}
                </div>
            </div>

            {/* Tab: Generate Jadwal Baru */}
            <div className="space-y-3">
                <SectionTitle icon="⚡">Form Generate Jadwal Bulanan</SectionTitle>
                <p className="text-xs text-gray-600">Klik tombol <strong>⚡ Generate Jadwal</strong> di tab Jadwal Bulanan untuk membuka form generate. Form menggunakan layout 2-kolom lebar:</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div className="rounded-xl border border-teal-200 bg-teal-50 p-4 space-y-2">
                        <p className="font-bold text-teal-800">📋 Kolom Kiri — Konfigurasi</p>
                        <ul className="space-y-1 text-teal-700">
                            <li>🔄 <strong>Pilih Pola Rotasi</strong> — kartu interaktif dengan preview urutan shift penuh & badge hari kerja/libur per siklus</li>
                            <li>🔀 <strong>Stagger Offset</strong> — slider 0–N dengan contoh dampak nyata per karyawan</li>
                            <li>📋 <strong>Ringkasan Generate</strong> — berapa karyawan Baru / Timpa Draft / Skip Published</li>
                        </ul>
                    </div>
                    <div className="rounded-xl border border-purple-200 bg-purple-50 p-4 space-y-2">
                        <p className="font-bold text-purple-800">📋 Kolom Kanan — Preview & Karyawan</p>
                        <ul className="space-y-1 text-purple-700">
                            <li>📅 <strong>Live Preview 14 Hari</strong> — mini kalender berwarna sesuai shift yang akan dihasilkan (real-time)</li>
                            <li>🔍 <strong>Cari & Filter Karyawan</strong> — pencarian nama + filter per jabatan</li>
                            <li>👥 <strong>Grouping per Jabatan</strong> — pilih per grup atau per individu</li>
                            <li>Badge status: <Badge text="✓ Pub" color="green" /> <Badge text="Draft" color="yellow" /> <Badge text="Baru" color="gray" /></li>
                        </ul>
                    </div>
                </div>
            </div>

            {/* Stagger Offset */}
            <div className="space-y-3">
                <SectionTitle icon="🔀">Memahami Stagger Offset</SectionTitle>
                <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 text-xs space-y-2">
                    <p className="text-gray-700"><strong>Stagger Offset = 0:</strong> Semua karyawan mulai di hari ke-1 siklus → shift hari pertama semua sama (mis. semua Pagi).</p>
                    <p className="text-gray-700"><strong>Stagger Offset = 2:</strong> Karyawan 1 mulai hari ke-1, Karyawan 2 mulai hari ke-3, Karyawan 3 mulai hari ke-5... sehingga setiap hari selalu ada kombinasi Pagi + Siang + Malam.</p>
                    <div className="mt-2 p-3 bg-white rounded-lg border border-gray-200">
                        <p className="font-semibold text-gray-700 mb-1">Contoh pola P–S–M–L (4 hari) dengan Offset = 1:</p>
                        <div className="grid grid-cols-5 gap-1 text-center">
                            <div className="font-semibold text-gray-500">Nama</div>
                            {['1', '2', '3', '4'].map(d => <div key={d} className="font-semibold text-gray-500">Hari {d}</div>)}
                            <div>Andi</div>
                            {['P', 'S', 'M', 'L'].map((s, i) => <div key={i} className={`rounded text-xs font-bold py-0.5 ${s === 'P' ? 'bg-yellow-100 text-yellow-700' : s === 'S' ? 'bg-blue-100 text-blue-700' : s === 'M' ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-500'}`}>{s}</div>)}
                            <div>Budi</div>
                            {['S', 'M', 'L', 'P'].map((s, i) => <div key={i} className={`rounded text-xs font-bold py-0.5 ${s === 'P' ? 'bg-yellow-100 text-yellow-700' : s === 'S' ? 'bg-blue-100 text-blue-700' : s === 'M' ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-500'}`}>{s}</div>)}
                            <div>Cici</div>
                            {['M', 'L', 'P', 'S'].map((s, i) => <div key={i} className={`rounded text-xs font-bold py-0.5 ${s === 'P' ? 'bg-yellow-100 text-yellow-700' : s === 'S' ? 'bg-blue-100 text-blue-700' : s === 'M' ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-500'}`}>{s}</div>)}
                        </div>
                    </div>
                </div>
            </div>

            {/* Tab Analisis */}
            <div className="space-y-3">
                <SectionTitle icon="📊">Tab Analisis Keadilan Shift</SectionTitle>
                <div className="space-y-2">
                    {[
                        { icon: '⚖️', title: 'Indeks Keadilan Unit (Fairness Score %)', desc: 'Mengukur variasi distribusi shift malam & total jam kerja antar staf. Skor 🟢 85–100% = Sangat Seimbang.', color: 'teal' },
                        { icon: '📅', title: 'Filter Rentang Waktu', desc: 'Filter analisis per Mingguan (Minggu 1–5) atau 1 Bulan Penuh untuk deteksi ketimpangan per periode.', color: 'blue' },
                        { icon: '📊', title: 'Tabel Detail per Karyawan', desc: 'Frekuensi & total jam Pagi/Siang/Malam/Libur per staf dengan indikator visual komposisi shift.', color: 'purple' },
                        { icon: '📥', title: 'Export Excel Analisis', desc: 'Unduh rekap keadilan shift dalam format .xlsx untuk pelaporan ke manajemen RS.', color: 'green' },
                    ].map((f, i) => (
                        <FeatureCard key={i} {...f} badgeColor={f.color} badge={f.icon} />
                    ))}
                </div>
            </div>

            {/* Alur Lengkap */}
            <div className="space-y-3">
                <SectionTitle icon="📌">Alur Lengkap Penjadwalan (5 Langkah)</SectionTitle>
                <div className="space-y-2">
                    <Step no={1} title="Konfigurasi Shift Unit (Tab ⚙️ Konfigurasi)">
                        <p>Definisikan jenis shift: <strong>nama, jam masuk, jam pulang, warna, toleransi terlambat</strong>, dan opsional grup jabatan.</p>
                        <p className="text-amber-700">⚠️ Harus dilakukan sebelum membuat pola rotasi.</p>
                    </Step>
                    <Step no={2} title="Buat Pola Rotasi (Tab 🔄 Pola Rotasi)">
                        <p>Klik <strong>+ Buat Pola Rotasi Baru</strong> → beri nama dan susun urutan shift per hari siklus. Contoh 8-hari: <strong>P–P–S–S–M–M–L–L</strong>.</p>
                    </Step>
                    <Step no={3} title="Generate Jadwal (Tab 📅 Jadwal Bulanan)">
                        <p>Klik <strong>⚡ Generate Jadwal</strong> → pilih pola, atur Stagger Offset, cek Live Preview, pilih karyawan → Generate.</p>
                    </Step>
                    <Step no={4} title="Analisis Keadilan Shift (Tab 📊 Analisis)">
                        <p>Buka tab Analisis → periksa Indeks Keadilan. Jika ada staf dengan beban shift malam berlebih, lakukan Override manual dari kalender.</p>
                    </Step>
                    <Step no={5} title="Publish Jadwal">
                        <p>Klik <strong>✅ Publish Jadwal</strong>. Jadwal Published akan muncul di ESS karyawan dan tidak bisa ditimpa generate ulang.</p>
                    </Step>
                </div>
            </div>

            {/* FAQ */}
            <div className="space-y-3">
                <SectionTitle icon="❓">FAQ Jadwal Shift</SectionTitle>
                <FAQ items={[
                    {
                        q: 'Apa perbedaan status Draft dan Published?',
                        a: <><Badge text="Draft" color="yellow" /> belum resmi, masih bisa diubah, tidak terlihat karyawan. <Badge text="Published" color="green" /> sudah final, terlihat di ESS karyawan, tidak bisa ditimpa generate ulang.</>,
                    },
                    {
                        q: 'Bisakah mengubah jadwal yang sudah Published?',
                        a: 'Jadwal Published tidak bisa ditimpa generate ulang. Namun bisa diubah secara manual via Override per sel — klik sel di kalender → isi shift baru + alasan override.',
                    },
                    {
                        q: 'Kenapa tombol Generate tidak aktif?',
                        a: 'Pastikan sudah memilih Pola Rotasi DAN minimal 1 karyawan. Jika belum punya pola, buat dulu di tab 🔄 Pola Rotasi.',
                    },
                    {
                        q: 'Apakah Import Excel jadwal bisa digunakan?',
                        a: 'Ya. Tombol 📥 Import Excel tersedia di toolbar kalender. Download template, isi sesuai format (NIK, Nama, tanggal per kolom), upload kembali.',
                    },
                ]} />
            </div>

            <TipCard title="Tips Penjadwalan Optimal" color="teal">
                Gunakan <strong>Stagger Offset ≥ 1</strong> untuk memastikan setiap hari selalu ada karyawan di shift berbeda. Setelah generate, selalu cek tab <strong>📊 Analisis Keadilan</strong> sebelum Publish — indeks di bawah 70% perlu penyesuaian manual.
            </TipCard>
        </div>
    );
};

export default GuideShift;
