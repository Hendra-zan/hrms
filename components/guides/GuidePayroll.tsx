import React from 'react';
import { Badge, Step, InfoBox, FAQ, FeatureCard, SectionTitle, TipCard, GuideTable } from './GuideComponents';

const GuidePayroll: React.FC = () => {
    return (
        <div className="space-y-6">
            <InfoBox type="info">
                Modul <strong>Penggajian & Slip Gaji</strong> digunakan oleh <Badge text="Admin" color="red" /> dan <Badge text="HRD" color="blue" /> untuk memproses rekapitulasi gaji bulanan, menghitung tunjangan/potongan BPJS/PPh21, serta mencetak & mendistribusikan slip gaji ke ESS karyawan.
            </InfoBox>

            {/* Parameter Konfigurasi */}
            <div className="space-y-3">
                <SectionTitle icon="⚙️">Konfigurasi Parameter Penggajian</SectionTitle>
                <p className="text-xs text-gray-600">Pengaturan tarif dan formula penggajian dapat disesuaikan di <strong>Pengaturan Sistem</strong> → panel <strong>💰 Konfigurasi Penggajian</strong>:</p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    <FeatureCard icon="🕒" title="Tarif Lembur per Jam" desc="Default: Rp 30.000/jam. Dipakai untuk kalkulasi upah lembur: total jam lembur × tarif." badge="Dapat Disesuaikan" badgeColor="blue" />
                    <FeatureCard icon="🏥" title="BPJS Kesehatan (%)" desc="Default: 1% dari gaji pokok (porsi iuran karyawan sesuai regulasi BPJS)." badge="Peraturan RS" badgeColor="teal" />
                    <FeatureCard icon="💵" title="Batas Atas Upah BPJS" desc="Default: Rp 12.000.000. Batas maks gaji yang dikenakan persentase iuran BPJS." badge="Plafond" badgeColor="purple" />
                </div>
            </div>

            {/* Komponen Gaji */}
            <div className="space-y-3">
                <SectionTitle icon="📊">Komponen Pendapatan & Potongan</SectionTitle>
                <GuideTable
                    headers={['Kategori', 'Komponen', 'Formula / Keterangan']}
                    rows={[
                        ['Pendapatan', 'Gaji Pokok', 'Sesuai master data profil karyawan'],
                        ['Pendapatan', 'Tunjangan Jabatan', 'Disesuaikan dengan tingkat/jabatan fungsional'],
                        ['Pendapatan', 'Tunjangan Makan & Transport', 'Dihitung berdasarkan jumlah hari hadir efektif'],
                        ['Pendapatan', 'Upah Lembur', 'Total Jam Lembur disetujui × Tarif Lembur/jam'],
                        ['Potongan', 'BPJS Kesehatan', '1% × min(Gaji Pokok, Batas Atas Upah)'],
                        ['Potongan', 'BPJS Ketenagakerjaan', 'Sesuai skema JHT (2%) & JP (1%)'],
                        ['Potongan', 'PPh 21', 'Kalkulasi pajak penghasilan sesuai PTKP & TER'],
                        ['Potongan', 'Keterlambatan / Sanksi', 'Potongan otomatis dari akumulasi menit keterlambatan'],
                    ]}
                />
            </div>

            {/* Alur Proses Gaji */}
            <div className="space-y-3">
                <SectionTitle icon="📌">Alur Pemrosesan Gaji Bulanan</SectionTitle>
                <div className="space-y-2">
                    <Step no={1} title="Kunci Rekapitulasi Absensi">
                        <p>Pastikan seluruh data absensi, izin, dan lembur bulan berjalan sudah di-lock oleh HRD dari menu Manajemen Absensi.</p>
                    </Step>
                    <Step no={2} title="Generate Slip Gaji Massal">
                        <p>Buka menu <strong>Penggajian</strong> → pilih Periode Bulan/Tahun → klik <strong>⚡ Generate Slip Gaji Bulanan</strong>.</p>
                    </Step>
                    <Step no={3} title="Review & Adjustment Slip Gaji">
                        <p>Periksa draf slip gaji. Jika ada bonus/potongan khusus, lakukan pengeditan nominal sebelum difinalisasi.</p>
                    </Step>
                    <Step no={4} title="Publish & Transfer Gaji">
                        <p>Klik <strong>✅ Finalisasi & Publish</strong>. Slip gaji otomatis tersedia di ESS karyawan dan file rekap transfer bank (.xlsx) siap diunduh.</p>
                    </Step>
                </div>
            </div>

            {/* FAQ */}
            <div className="space-y-3">
                <SectionTitle icon="❓">FAQ Penggajian</SectionTitle>
                <FAQ items={[
                    {
                        q: 'Apakah perubahan tarif lembur berlaku untuk slip gaji lama?',
                        a: 'Tidak. Perubahan tarif hanya berlaku untuk slip gaji yang baru di-generate. Slip gaji historis tetap tersimpan dengan tarif lama.',
                    },
                    {
                        q: 'Bagaimana cara karyawan mendownload slip gaji?',
                        a: 'Karyawan dapat membuka ESS → menu Slip Gaji → pilih bulan → klik 🖨️ Download PDF.',
                    },
                    {
                        q: 'Apakah slip gaji bisa di-regenerate jika ada kesalahan absensi?',
                        a: 'Bisa. HRD dapat melakukan Generate Ulang untuk karyawan tertentu atau seluruh unit setelah data absensi diperbaiki.',
                    },
                ]} />
            </div>

            <TipCard title="Keamanan Slip Gaji" color="amber">
                Seluruh dokumen slip gaji di-generate secara enkripsi dan hanya dapat diakses oleh akun karyawan bersangkutan via ESS.
            </TipCard>
        </div>
    );
};

export default GuidePayroll;
