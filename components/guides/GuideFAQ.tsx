import React from 'react';
import { FAQ, SectionTitle, InfoBox, Badge } from './GuideComponents';

const GuideFAQ: React.FC = () => {
    return (
        <div className="space-y-6">
            <InfoBox type="info">
                Kumpulan <strong>pertanyaan yang paling sering ditanyakan</strong> oleh pengguna HRMS Pro. Klik pertanyaan untuk melihat jawabannya.
            </InfoBox>

            {/* ABSENSI */}
            <div className="space-y-3">
                <SectionTitle icon="⏰">Absensi & Kehadiran</SectionTitle>
                <FAQ items={[
                    {
                        q: 'Kenapa absensi saya tidak terekam padahal sudah klik hadir?',
                        a: (
                            <ul className="space-y-1.5 list-disc list-inside">
                                <li>Pastikan <strong>lokasi GPS diizinkan</strong> di browser/perangkat Anda.</li>
                                <li>Pastikan <strong>kamera aktif</strong> untuk selfie verifikasi (jika digunakan).</li>
                                <li>Cek apakah Anda masih berada dalam <strong>radius lokasi yang ditentukan</strong> oleh admin.</li>
                                <li>Hubungi admin IT jika masalah berlanjut setelah semua hal di atas dicek.</li>
                            </ul>
                        ),
                    },
                    {
                        q: 'Bagaimana cara mengajukan izin atau cuti?',
                        a: (
                            <>
                                <p>Buka menu <strong>Employee Self Service (ESS)</strong> → tab <strong>Permohonan</strong> → klik <strong>+ Ajukan Permohonan</strong>. Pilih jenis: Cuti, Sakit, atau Izin, lalu isi tanggal dan keterangan.</p>
                                <p className="mt-1 text-amber-700">⚠️ Permohonan harus diajukan sebelum hari H jika memungkinkan, kecuali untuk sakit mendadak.</p>
                            </>
                        ),
                    },
                    {
                        q: 'Kenapa status kehadiran saya tertulis Tidak Hadir padahal sudah absen?',
                        a: 'Kemungkinan absensi Anda terekam di luar jam toleransi yang dikonfigurasi. Hubungi HRD atau admin untuk koreksi manual. HRD dapat mengubah status kehadiran dari menu Manajemen Absensi.',
                    },
                    {
                        q: 'Bagaimana cara mengubah rekap absensi yang salah?',
                        a: 'Hanya Admin/HRD yang dapat melakukan koreksi absensi. Sampaikan ke HRD dengan menyertakan bukti (foto, keterangan) untuk proses koreksi manual dari menu Manajemen Absensi.',
                    },
                ]} />
            </div>

            {/* JADWAL SHIFT */}
            <div className="space-y-3">
                <SectionTitle icon="📅">Jadwal & Shift</SectionTitle>
                <FAQ items={[
                    {
                        q: 'Apa perbedaan status Draft dan Published pada jadwal?',
                        a: (
                            <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                    <Badge text="Draft" color="yellow" />
                                    <span>Jadwal sudah di-generate tetapi <strong>belum resmi</strong>. Masih bisa diubah. Karyawan belum bisa melihatnya di ESS.</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Badge text="Published" color="green" />
                                    <span>Jadwal sudah <strong>resmi & final</strong>. Karyawan bisa melihatnya di ESS. Tidak bisa ditimpa oleh generate ulang.</span>
                                </div>
                            </div>
                        ),
                    },
                    {
                        q: 'Kenapa shift saya berbeda dengan teman yang lain di bulan ini?',
                        a: 'Perbedaan shift antar staf adalah hal normal karena pola rotasi shift menggunakan Stagger Offset — setiap karyawan memulai di titik siklus yang berbeda agar distribusi shift (Pagi/Siang/Malam) seimbang setiap harinya. Lihat tab Analisis Keadilan Shift untuk memverifikasi keseimbangan.',
                    },
                    {
                        q: 'Bagaimana cara mengajukan tukar shift dengan rekan kerja?',
                        a: 'Buka ESS → tab Jadwal Saya → klik pada hari yang ingin ditukar → klik "Ajukan Tukar Shift". Pilih rekan yang diajak tukar, kemudian tunggu persetujuan Kepala Ruangan.',
                    },
                    {
                        q: 'Kenapa tombol Generate Jadwal tidak bisa diklik?',
                        a: (
                            <ul className="list-disc list-inside space-y-1">
                                <li>Pastikan sudah <strong>memilih Pola Rotasi</strong> (wajib dipilih dulu).</li>
                                <li>Pastikan sudah <strong>memilih minimal 1 karyawan</strong> dari daftar.</li>
                                <li>Jika belum ada pola rotasi, buat dulu di tab <strong>🔄 Pola Rotasi</strong>.</li>
                            </ul>
                        ),
                    },
                    {
                        q: 'Apakah jadwal yang sudah di-Publish bisa diubah?',
                        a: 'Jadwal Published tidak bisa ditimpa oleh Generate ulang. Namun Kepala Ruangan masih bisa melakukan Override manual per sel (klik sel jadwal di kalender) untuk mengubah shift karyawan tertentu pada tanggal tertentu dengan memberikan alasan.',
                    },
                ]} />
            </div>

            {/* AKUN & KEAMANAN */}
            <div className="space-y-3">
                <SectionTitle icon="🔐">Akun & Keamanan</SectionTitle>
                <FAQ items={[
                    {
                        q: 'Bagaimana cara reset password jika lupa?',
                        a: 'Di halaman Login → klik "Lupa Password?" → masukkan email yang terdaftar → cek email untuk link reset password. Jika email tidak ditemukan, hubungi Admin sistem.',
                    },
                    {
                        q: 'Bagaimana cara mengubah password yang sedang aktif?',
                        a: 'Klik foto profil Anda di pojok kanan atas → Ganti Password → masukkan password lama dan password baru → Simpan.',
                    },
                    {
                        q: 'Kenapa saya tidak bisa mengakses menu tertentu?',
                        a: 'Akses menu diatur berdasarkan Peran (Role) akun Anda. Admin memiliki akses penuh, HRD dapat mengakses data karyawan & penggajian, Kepala Ruangan hanya melihat data unit-nya, dan Karyawan hanya bisa akses ESS. Hubungi Admin untuk perubahan hak akses.',
                    },
                ]} />
            </div>

            {/* PENGGAJIAN */}
            <div className="space-y-3">
                <SectionTitle icon="💰">Penggajian & Slip Gaji</SectionTitle>
                <FAQ items={[
                    {
                        q: 'Kapan slip gaji tersedia di ESS?',
                        a: 'Slip gaji tersedia setelah HRD/Admin melakukan Generate Slip Gaji untuk bulan bersangkutan. Biasanya dilakukan pada akhir bulan atau awal bulan berikutnya. Anda akan menerima notifikasi jika slip sudah tersedia.',
                    },
                    {
                        q: 'Komponen apa saja yang ada di slip gaji?',
                        a: (
                            <div className="space-y-1">
                                <p><strong>Pendapatan:</strong> Gaji Pokok, Tunjangan Jabatan, Tunjangan Makan, Tunjangan Transport, Upah Lembur</p>
                                <p><strong>Potongan:</strong> BPJS Kesehatan (1% dari gaji pokok), BPJS Ketenagakerjaan, PPh 21</p>
                                <p><strong>Total Bersih:</strong> Pendapatan − Potongan</p>
                            </div>
                        ),
                    },
                    {
                        q: 'Bagaimana cara download slip gaji sebagai PDF?',
                        a: 'Buka ESS → Slip Gaji → pilih bulan → klik tombol 🖨️ Cetak / Download PDF. File PDF akan langsung diunduh ke perangkat Anda.',
                    },
                ]} />
            </div>

            {/* TEKNIS */}
            <div className="space-y-3">
                <SectionTitle icon="🔧">Teknis & Performa</SectionTitle>
                <FAQ items={[
                    {
                        q: 'Aplikasi lambat atau tidak bisa dimuat, apa yang harus dilakukan?',
                        a: (
                            <ul className="list-disc list-inside space-y-1">
                                <li>Tekan <strong>Ctrl+Shift+R</strong> (Windows) atau <strong>Cmd+Shift+R</strong> (Mac) untuk hard refresh.</li>
                                <li>Bersihkan cache browser: Pengaturan Browser → Hapus Data Browsing → Cache.</li>
                                <li>Coba gunakan browser lain (Chrome/Firefox/Edge terbaru).</li>
                                <li>Jika masih bermasalah, hubungi Admin IT.</li>
                            </ul>
                        ),
                    },
                    {
                        q: 'Apakah HRMS Pro bisa digunakan di HP/tablet?',
                        a: 'Ya, HRMS Pro dirancang responsif untuk layar mobile. Gunakan browser Chrome/Safari di HP untuk pengalaman terbaik. Untuk absensi mandiri, tersedia juga aplikasi mobile Android (APK tersedia di halaman download internal).',
                    },
                    {
                        q: 'Data tidak muncul padahal seharusnya sudah ada, apa penyebabnya?',
                        a: 'Coba klik tombol Refresh/Muat Ulang yang tersedia di tiap halaman. Jika masih tidak muncul, pastikan koneksi internet stabil dan coba logout → login kembali.',
                    },
                ]} />
            </div>
        </div>
    );
};

export default GuideFAQ;
