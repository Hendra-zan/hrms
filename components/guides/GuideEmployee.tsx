import React from 'react';
import { Badge, Step, InfoBox, FAQ, FeatureCard, SectionTitle, TipCard, GuideTable, StatusRow } from './GuideComponents';

const GuideEmployee: React.FC = () => {
    return (
        <div className="space-y-6">
            <InfoBox type="info">
                Menu <strong>Karyawan</strong> digunakan untuk mengelola seluruh data SDM — pendaftaran, verifikasi, import massal, filter & pencarian, hingga penonaktifan. Hanya dapat diakses oleh <Badge text="Admin" color="red" /> dan <Badge text="HRD" color="blue" />.
            </InfoBox>

            {/* Cara Akses */}
            <div className="space-y-3">
                <SectionTitle icon="🗂️">Cara Mengakses</SectionTitle>
                <p className="text-xs text-gray-600">Dari sidebar kiri → klik menu <strong>👥 Karyawan</strong>. Halaman menampilkan tabel karyawan dengan filter, pencarian, dan aksi cepat.</p>
            </div>

            {/* Alur Manajemen */}
            <div className="space-y-3">
                <SectionTitle icon="📌">Alur Manajemen Karyawan</SectionTitle>
                <div className="space-y-2">
                    <Step no={1} title="Tambah Karyawan Baru (Manual)">
                        <p>Klik tombol <strong>+ Tambah Karyawan</strong> (pojok kanan atas) → isi form lengkap: nama, jabatan, unit kerja, kontak, BPJS, rekening bank.</p>
                        <p>Status awal: <Badge text="Belum Verifikasi" color="yellow" /></p>
                    </Step>
                    <Step no={2} title="Import Massal via Excel">
                        <p>Klik tombol <strong>📥 Import Excel</strong> → download template → isi data karyawan → upload kembali.</p>
                        <p>Kolom wajib: <strong>NIK, Nama, Jabatan, Unit Kerja</strong>. Kolom lain bersifat opsional.</p>
                        <p className="text-amber-700">⚠️ NIK harus unik dan tidak boleh duplikat.</p>
                    </Step>
                    <Step no={3} title="Verifikasi Data Karyawan">
                        <p>HRD/Admin klik ikon detail karyawan → klik tombol <strong>✅ Verifikasi</strong> setelah data lengkap & benar.</p>
                        <p>Status berubah: <Badge text="Terverifikasi" color="green" /></p>
                    </Step>
                    <Step no={4} title="Isi NIK & Daftarkan ke Mesin Absensi">
                        <p>NIK (Nomor Induk Karyawan) wajib diisi jika menggunakan mesin absensi Hikvision.</p>
                        <p>NIK harus <strong>sama persis</strong> dengan Employee No di mesin Hikvision.</p>
                    </Step>
                    <Step no={5} title="Kunci Profil (Opsional)">
                        <p>Profil yang dikunci tidak bisa diubah oleh karyawan sendiri via ESS. Hanya Admin/HRD yang dapat mengubah data yang dikunci.</p>
                    </Step>
                    <Step no={6} title="Nonaktifkan Karyawan">
                        <p>Untuk karyawan yang resign/pensiun, ubah Status menjadi <Badge text="Tidak Aktif" color="gray" /> agar tidak muncul di jadwal dan absensi, namun data tetap tersimpan.</p>
                    </Step>
                </div>
            </div>

            {/* Field Penting */}
            <div className="space-y-3">
                <SectionTitle icon="📋">Field Data Karyawan</SectionTitle>
                <GuideTable
                    headers={['Field', 'Keterangan', 'Status']}
                    rows={[
                        ['NIK', 'Nomor Induk Karyawan — ID di mesin absensi Hikvision', '⚠️ Wajib untuk Hikvision'],
                        ['Nama Lengkap', 'Sesuai KTP', '✅ Wajib'],
                        ['Jabatan', 'Jabatan fungsional (Perawat, Dokter, dll)', '✅ Wajib'],
                        ['Unit Kerja', 'Ruangan/unit tempat bertugas', '✅ Wajib'],
                        ['No. HP & Email', 'Kontak & kredensial login ESS', 'ℹ️ Opsional'],
                        ['BPJS Kesehatan', 'Nomor BPJS Kesehatan (dipakai hitung gaji)', 'ℹ️ Opsional'],
                        ['BPJS Ketenagakerjaan', 'Nomor BPJS Ketenagakerjaan', 'ℹ️ Opsional'],
                        ['Rekening Bank', 'Bank + nomor rekening untuk transfer gaji', 'ℹ️ Opsional'],
                        ['Gaji Pokok', 'Dipakai otomatis untuk kalkulasi slip gaji', 'ℹ️ Opsional'],
                        ['STR / Sertifikasi', 'Upload dokumen Surat Tanda Registrasi medis', 'ℹ️ Opsional'],
                    ]}
                />
            </div>

            {/* Filter & Pencarian */}
            <div className="space-y-3">
                <SectionTitle icon="🔍">Filter & Pencarian Karyawan</SectionTitle>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <FeatureCard icon="🔍" title="Cari Nama / NIK" desc="Kotak pencarian real-time di atas tabel untuk menemukan karyawan berdasarkan nama atau NIK." />
                    <FeatureCard icon="🏢" title="Filter Unit Kerja" desc="Tampilkan hanya karyawan dari unit/ruangan tertentu." />
                    <FeatureCard icon="📋" title="Filter Status" desc="Filter berdasarkan status: Aktif, Tidak Aktif, Belum Verifikasi, Terverifikasi." />
                    <FeatureCard icon="📥" title="Export Excel" desc="Unduh seluruh data karyawan yang terfilter ke dalam file .xlsx." />
                </div>
            </div>

            {/* FAQ */}
            <div className="space-y-3">
                <SectionTitle icon="❓">FAQ Manajemen Karyawan</SectionTitle>
                <FAQ items={[
                    {
                        q: 'Berapa banyak karyawan yang bisa di-import sekaligus?',
                        a: 'Tidak ada batas hard limit, namun disarankan maksimal 500 baris per file untuk performa optimal. Untuk data lebih besar, bagi ke beberapa file.',
                    },
                    {
                        q: 'Bagaimana jika ada kesalahan data saat import Excel?',
                        a: 'Sistem akan menampilkan Preview Import sebelum data disimpan. Baris yang error (NIK duplikat, data wajib kosong) akan ditandai merah dan tidak akan diimport. Perbaiki file Excel terlebih dahulu.',
                    },
                    {
                        q: 'Apakah data karyawan yang dinonaktifkan bisa dipulihkan?',
                        a: 'Ya. Ubah kembali status ke Aktif dari halaman detail karyawan. Seluruh riwayat absensi dan penggajian tetap tersimpan.',
                    },
                    {
                        q: 'Bisakah karyawan mengubah data profilnya sendiri?',
                        a: 'Karyawan hanya bisa melihat profil mereka via ESS. Perubahan data dilakukan oleh HRD/Admin. Jika profil dikunci, karyawan tidak bisa request perubahan apapun.',
                    },
                ]} />
            </div>

            <TipCard title="Import Massal — Tips Efisiensi" color="green">
                Saat onboarding karyawan baru dalam jumlah besar, gunakan fitur <strong>Import Excel</strong>. Download template, isi semua kolom, dan upload. Sistem akan memvalidasi setiap baris sebelum menyimpan data.
            </TipCard>
        </div>
    );
};

export default GuideEmployee;
