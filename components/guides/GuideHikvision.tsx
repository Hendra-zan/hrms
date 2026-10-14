import React from 'react';
import { Badge, Step, InfoBox, FAQ, FeatureCard, SectionTitle, TipCard, GuideTable } from './GuideComponents';

const GuideHikvision: React.FC = () => {
    return (
        <div className="space-y-6">
            <InfoBox type="info">
                Modul <strong>Integrasi Hikvision</strong> menghubungkan mesin absensi fisik terminal (seperti <strong>DS-K1T321MFX</strong> atau seri sejenis) langsung dengan server HRMS Pro secara otomatis via ISAPI Protocol.
            </InfoBox>

            {/* Fitur Utama */}
            <div className="space-y-3">
                <SectionTitle icon="📡">Kemampuan Integrasi Hardware</SectionTitle>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <FeatureCard icon="⚡" title="Sinkronisasi Event Real-time" desc="Log absensi di mesin langsung terkirim ke HRMS Pro saat karyawan menempelkan jari/wajah." badge="Push Event" badgeColor="teal" />
                    <FeatureCard icon="🔢" title="Pemetaan via Employee No (NIK)" desc="Data ditarik berdasarkan NIK yang dikonfigurasi sama persis di mesin & HRMS Pro." badge="Matching NIK" badgeColor="blue" />
                    <FeatureCard icon="🔄" title="Tarik Log Otomatis & Manual" desc="Mendukung penarikan log historis berkala dari memori internal mesin." badge="Log Sync" badgeColor="purple" />
                    <FeatureCard icon="🛡️" title="Koneksi Aman Jaringan Lokal" desc="Koneksi terenkripsi via jaringan internal RS (LAN/VLAN terisolasi)." badge="Security" badgeColor="green" />
                </div>
            </div>

            {/* Langkah Setup Hikvision */}
            <div className="space-y-3">
                <SectionTitle icon="📌">Langkah Pengaturan Mesin Hikvision</SectionTitle>
                <div className="space-y-2">
                    <Step no={1} title="Konfigurasi IP & Port Mesin">
                        <p>Buka Pengaturan Sistem → Integrasi Hikvision → isi IP Address mesin di LAN (misal: <code>192.168.1.201</code>) & HTTP Port (default: 80/8000).</p>
                    </Step>
                    <Step no={2} title="Kredensial ISAPI Hikvision">
                        <p>Isi Username (admin) dan Password akun administrator mesin Hikvision untuk otentikasi API.</p>
                    </Step>
                    <Step no={3} title="Uji Koneksi (Test Connection)">
                        <p>Klik tombol <strong>🔌 Tes Koneksi</strong>. Sistem akan mengirim request ISAPI `GET /ISAPI/System/deviceInfo` untuk memastikan respon mesin status 200 OK.</p>
                    </Step>
                    <Step no={4} title="Setup Employee No di Mesin">
                        <p>Pastikan `Employee No` di menu mesin Hikvision diisi dengan angka NIK karyawan yang persis sama di HRMS Pro (contoh: `20240012`).</p>
                    </Step>
                </div>
            </div>

            {/* FAQ */}
            <div className="space-y-3">
                <SectionTitle icon="❓">FAQ Integrasi Hikvision</SectionTitle>
                <FAQ items={[
                    {
                        q: 'Kenapa log absensi dari mesin Hikvision tidak masuk ke HRMS Pro?',
                        a: '1. Cek NIK karyawan di HRMS Pro — apakah sama persis dengan Employee No di mesin Hikvision. 2. Cek status koneksi IP mesin di halaman Integrasi Hikvision.',
                    },
                    {
                        q: 'Apakah bisa menggunakan lebih dari 1 mesin Hikvision?',
                        a: 'Bisa. HRMS Pro mendukung pendaftaran multiple terminal Hikvision (misal: Mesin Lobby, Mesin IGD, Mesin Poli).',
                    },
                ]} />
            </div>

            <TipCard title="Pencatatan NIK" color="teal">
                Pastikan NIK tidak mengandung spasi atau karakter non-angka saat didaftarkan di mesin Hikvision.
            </TipCard>
        </div>
    );
};

export default GuideHikvision;
