import React from 'react';
import { Badge, InfoBox, FeatureCard, SectionTitle, TipCard } from './GuideComponents';

const GuideOverview: React.FC<{ onNavigate?: (tab: string) => void }> = ({ onNavigate }) => {
    return (
        <div className="space-y-6">
            {/* Hero */}
            <div className="rounded-2xl bg-gradient-to-br from-[#06736a] to-teal-600 p-5 text-white">
                <div className="flex items-center gap-3 mb-3">
                    <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center text-2xl">🏥</div>
                    <div>
                        <h3 className="font-bold text-lg">HRMS Pro</h3>
                        <p className="text-teal-100 text-xs">Sistem Manajemen SDM & Operasional Rumah Sakit</p>
                    </div>
                </div>
                <p className="text-sm text-white/90 leading-relaxed">
                    HRMS Pro adalah platform terpadu yang mencakup <strong>manajemen karyawan</strong>, <strong>absensi biometrik</strong>, <strong>penjadwalan shift rotasi</strong>, <strong>penggajian otomatis</strong>, dan <strong>Employee Self Service (ESS)</strong> — dirancang khusus untuk kebutuhan operasional rumah sakit dan klinik.
                </p>
                <div className="flex flex-wrap gap-2 mt-3">
                    {['Admin', 'HRD', 'Kepala Ruangan', 'Karyawan'].map(r => (
                        <span key={r} className="text-[10px] px-2 py-0.5 bg-white/20 rounded-full font-medium border border-white/30">{r}</span>
                    ))}
                </div>
            </div>

            {/* Quick Start */}
            <div className="space-y-3">
                <SectionTitle icon="⚡">Mulai Dari Mana?</SectionTitle>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {[
                        { role: 'Admin / HRD', color: 'blue', icon: '👥', desc: 'Tambah Karyawan → Konfigurasi Unit & Shift → Kelola Penggajian', tab: 'employee' },
                        { role: 'Kepala Ruangan', color: 'teal', icon: '👨‍💼', desc: 'Cek Dashboard → Generate Jadwal Bulanan → Verifikasi Logbook Staf', tab: 'kepala' },
                        { role: 'Karyawan', color: 'purple', icon: '🏢', desc: 'Absensi Mandiri ESS → Lihat Jadwal → Ajukan Cuti/Tukar Shift', tab: 'shift' },
                        { role: 'Admin IT', color: 'gray', icon: '🔧', desc: 'Setup NIK → Integrasi Mesin Hikvision → Enrollment Face Recognition', tab: 'hikvision' },
                    ].map((r, i) => (
                        <button
                            key={i}
                            type="button"
                            onClick={() => onNavigate?.(r.tab)}
                            className="text-left p-3 rounded-xl border border-gray-200 bg-gray-50 hover:border-[#06736a]/40 hover:bg-teal-50/30 transition-all group"
                        >
                            <div className="flex items-center gap-2 mb-1.5">
                                <span className="text-xl">{r.icon}</span>
                                <Badge text={r.role} color={r.color} />
                            </div>
                            <p className="text-xs text-gray-600 group-hover:text-gray-800 transition-colors">{r.desc}</p>
                            <span className="text-[10px] text-[#06736a] font-semibold mt-1 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                Baca panduannya →
                            </span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Module List */}
            <div className="space-y-3">
                <SectionTitle icon="📦">Semua Modul & Fitur</SectionTitle>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {[
                        { icon: '👥', title: 'Manajemen Karyawan', desc: 'Data profil, STR, sertifikasi, import massal Excel, verifikasi, dan dokumen HR', role: 'Admin/HRD', color: 'blue' },
                        { icon: '⏰', title: 'Absensi & Kehadiran', desc: 'Selfie GPS, Face Recognition AI, mesin Hikvision, rekap bulanan', role: 'Semua', color: 'green' },
                        { icon: '📅', title: 'Jadwal & Shift Rotasi', desc: 'Pola rotasi otomatis, live preview, analisis keadilan shift, override manual', role: 'Karu/Karyawan', color: 'purple' },
                        { icon: '💰', title: 'Penggajian & Slip Gaji', desc: 'Kalkulasi gaji pokok, tunjangan, BPJS, PPh21, cetak & download PDF', role: 'Admin/HRD', color: 'green' },
                        { icon: '⏱️', title: 'Logbook & Catatan Kerja', desc: 'Logbook harian shift, verifikasi Karu, catatan 2-arah, pengingat tugas', role: 'Semua', color: 'teal' },
                        { icon: '📢', title: 'Pengumuman & SOP RS', desc: 'Edaran resmi, kebijakan, dokumen SOP, lampiran file (PDF/Word)', role: 'Semua', color: 'blue' },
                        { icon: '👨‍💼', title: 'Dashboard Kepala Ruangan', desc: 'Monitoring unit real-time, distribusi shift hari ini, approve tukar shift', role: 'Karu', color: 'yellow' },
                        { icon: '🏢', title: 'Employee Self Service (ESS)', desc: 'Absensi mandiri, jadwal pribadi, slip gaji, permohonan cuti, logbook', role: 'Karyawan', color: 'purple' },
                        { icon: '👤', title: 'Face Recognition', desc: 'Enrollment & verifikasi wajah berbasis AI, liveness detection anti-spoofing', role: 'Admin IT', color: 'blue' },
                        { icon: '📡', title: 'Mesin Absensi Hikvision', desc: 'Integrasi DS-K1T321MFX, sync data, konfigurasi NIK & Employee No', role: 'Admin IT', color: 'green' },
                        { icon: '📝', title: 'Audit Log & Keamanan', desc: 'Riwayat semua aktivitas sistem, RBAC berbasis peran, log akses', role: 'Admin', color: 'yellow' },
                    ].map((f, i) => (
                        <FeatureCard key={i} {...f} badge={f.role} badgeColor={f.color} />
                    ))}
                </div>
            </div>

            {/* Tip */}
            <TipCard title="Navigasi Cepat" color="teal">
                Gunakan <strong>kotak pencarian</strong> di atas sidebar untuk menemukan panduan fitur spesifik tanpa harus membuka setiap tab satu per satu. Cukup ketik kata kunci seperti "publish", "stagger", atau "slip gaji".
            </TipCard>
        </div>
    );
};

export default GuideOverview;
