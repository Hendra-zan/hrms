import React from 'react';

const LoginHero: React.FC = () => {
    return (
        <div className="hidden lg:flex flex-col justify-center text-white">
            {/* Badge status */}
            <div className="inline-flex w-fit items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-medium text-white/90 backdrop-blur">
                <span className="relative flex h-2.5 w-2.5">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-400" />
                </span>
                Sistem Aktif — RSU Meloy Sangatta
            </div>

            {/* Headline */}
            <h1 className="mt-6 max-w-xl text-5xl font-black tracking-tight text-white xl:text-6xl leading-tight">
                Kelola SDM Rumah Sakit dengan Mudah
            </h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-white/80">
                Portal resmi manajemen karyawan RSU Meloy — absensi, cuti, slip gaji, dan jadwal shift dalam satu tempat yang mudah digunakan.
            </p>

            {/* Feature cards */}
            <div className="mt-8 grid max-w-2xl gap-4 sm:grid-cols-2">
                {/* Card 1 */}
                <div className="rounded-[1.5rem] border border-white/15 bg-white/10 p-5 shadow-2xl shadow-black/10 backdrop-blur transition-transform hover:scale-[1.02] duration-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-white/60">Status Keamanan</p>
                            <p className="mt-1 text-xl font-bold text-white">Aman & Terverifikasi</p>
                        </div>
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-400/15 text-emerald-300 ring-1 ring-emerald-300/20">
                            <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                                <path d="M12 2l7 3v5c0 4.97-3.07 9.37-7 12-3.93-2.63-7-7.03-7-12V5l7-3z" stroke="currentColor" strokeWidth="1.6" />
                                <path d="M9.5 12l1.8 1.8 3.9-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        </div>
                    </div>
                    <div className="mt-4 h-2 w-full rounded-full bg-white/10">
                        <div className="h-2 w-4/5 rounded-full bg-gradient-to-r from-[#21d3c2] to-white/80 animate-pulse" />
                    </div>
                </div>

                {/* Card 2 */}
                <div className="rounded-[1.5rem] border border-white/15 bg-white/10 p-5 shadow-2xl shadow-black/10 backdrop-blur transition-transform hover:scale-[1.02] duration-200">
                    <p className="text-sm text-white/60">Fitur Utama</p>
                    <div className="mt-3 space-y-2.5 text-sm text-white/90">
                        <div className="flex items-center justify-between rounded-xl bg-white/10 px-4 py-2.5">
                            <span className="flex items-center gap-2">
                                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#34d399" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>
                                Absensi & Jadwal Shift
                            </span>
                            <span className="font-semibold text-emerald-300 text-xs">Realtime</span>
                        </div>
                        <div className="flex items-center justify-between rounded-xl bg-white/10 px-4 py-2.5">
                            <span className="flex items-center gap-2">
                                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#34d399" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>
                                Cuti & Permohonan
                            </span>
                            <span className="font-semibold text-emerald-300 text-xs">Mandiri</span>
                        </div>
                        <div className="flex items-center justify-between rounded-xl bg-white/10 px-4 py-2.5">
                            <span className="flex items-center gap-2">
                                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#34d399" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>
                                Slip Gaji Digital
                            </span>
                            <span className="font-semibold text-emerald-300 text-xs">Setiap Bulan</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* 3 Step cards */}
            <div className="mt-8 grid max-w-2xl grid-cols-3 gap-4">
                <div className="rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur transition-all hover:bg-white/15 duration-200">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-400/15 text-emerald-300">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg>
                    </div>
                    <div className="mt-2 text-sm font-semibold text-white">Akun Karyawan</div>
                    <div className="mt-1 text-xs text-white/60 leading-relaxed">Didaftarkan HRD, bukan registrasi mandiri</div>
                </div>
                <div className="rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur transition-all hover:bg-white/15 duration-200">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-400/15 text-emerald-300">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
                    </div>
                    <div className="mt-2 text-sm font-semibold text-white">Jaringan RSU</div>
                    <div className="mt-1 text-xs text-white/60 leading-relaxed">Berjalan di jaringan internal rumah sakit</div>
                </div>
                <div className="rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur transition-all hover:bg-white/15 duration-200">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-400/15 text-emerald-300">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                    </div>
                    <div className="mt-2 text-sm font-semibold text-white">Reset Password</div>
                    <div className="mt-1 text-xs text-white/60 leading-relaxed">Hubungi HRD jika lupa password</div>
                </div>
            </div>

            {/* Badge bawah */}
            <div className="mt-10 flex flex-wrap items-center gap-3 text-xs text-white/70">
                <span className="flex items-center gap-1.5 rounded-full border border-white/15 bg-white/10 px-3.5 py-1.5 backdrop-blur">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
                    RSU Meloy Sangatta
                </span>
                <span className="flex items-center gap-1.5 rounded-full border border-white/15 bg-white/10 px-3.5 py-1.5 backdrop-blur">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="5" y="2" width="14" height="20" rx="2"/><path d="M12 18h.01"/></svg>
                    Tersedia di Android
                </span>
                <span className="flex items-center gap-1.5 rounded-full border border-white/15 bg-white/10 px-3.5 py-1.5 backdrop-blur">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                    Login Berbasis Peran
                </span>
            </div>
        </div>
    );
};

export default LoginHero;
