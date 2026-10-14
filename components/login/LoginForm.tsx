import React, { useState } from 'react';


interface LoginFormProps {
    email: string;
    setEmail: (email: string) => void;
    password: string;
    setPassword: (password: string) => void;
    error: string | null;
    loading: boolean;
    onSubmit: (e: React.FormEvent) => void;
}

// Terjemahkan pesan error teknis ke bahasa yang ramah pengguna
function translateError(msg: string | null): string | null {
    if (!msg) return null;
    const m = msg.toLowerCase();
    if (m.includes('invalid login credentials') || m.includes('invalid credentials'))
        return 'Email atau password yang Anda masukkan salah. Periksa kembali dan coba lagi.';
    if (m.includes('email not confirmed'))
        return 'Akun Anda belum diverifikasi. Hubungi Admin HRD untuk mengaktifkan akun.';
    if (m.includes('too many requests') || m.includes('rate limit'))
        return 'Terlalu banyak percobaan masuk. Tunggu sebentar lalu coba lagi.';
    if (m.includes('network') || m.includes('fetch') || m.includes('connection'))
        return 'Tidak dapat terhubung ke sistem. Periksa koneksi jaringan LAN Anda.';
    if (m.includes('tidak terdaftar sebagai karyawan') || m.includes('hubungi admin hrd'))
        return 'Akun ini belum terdaftar sebagai karyawan aktif. Silakan hubungi HRD untuk mendaftarkan akun Anda.';
    if (m.includes('email dan password tidak boleh kosong'))
        return 'Harap isi email dan password sebelum melanjutkan.';
    if (m.includes('format email tidak valid'))
        return 'Format email yang Anda masukkan tidak benar. Contoh: nama@rsumeloy.com';
    if (m.includes('terlalu banyak percobaan'))
        return msg;
    return msg;
}

// Modern outline icon: Email
const IconEmail = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <rect x="2" y="4" width="20" height="16" rx="3" />
        <path d="M2 7l10 7 10-7" />
    </svg>
);

// Modern outline icon: Lock / Password
const IconLock = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <rect x="3" y="11" width="18" height="11" rx="2.5" />
        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
        <circle cx="12" cy="16" r="1.5" fill="currentColor" stroke="none" />
    </svg>
);

// Modern outline icon: Eye open
const IconEyeOpen = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
        <circle cx="12" cy="12" r="3" />
    </svg>
);

// Modern outline icon: Eye off
const IconEyeOff = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
        <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
        <path d="M1 1l22 22" />
    </svg>
);

// Modern icon: Arrow right login
const IconArrowRight = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M15 3h6v6M10 14L21 3M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
    </svg>
);

// Modern icon: Key
const IconKey = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <circle cx="7.5" cy="15.5" r="5.5" />
        <path d="M21 2l-9.6 9.6M15.5 7.5l3 3L22 7l-3-3" />
    </svg>
);

// Modern icon: Alert circle
const IconAlertCircle = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="8" x2="12" y2="12" />
        <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
);

const LoginForm: React.FC<LoginFormProps> = ({ email, setEmail, password, setPassword, error, loading, onSubmit }) => {
    const [showPassword, setShowPassword] = useState(false);
    const translatedError = translateError(error);

    return (
        <form className="space-y-4" onSubmit={onSubmit}>

            {/* ── Email Field ── */}
            <div>
                <label htmlFor="email" className="block text-sm font-semibold text-slate-700 mb-1.5">
                    Email Karyawan
                </label>
                {/* Wrapper: border + focus ring here, NOT on input */}
                <div className="flex items-center rounded-xl border border-slate-200 bg-white shadow-sm transition-all duration-200 focus-within:border-[#06736a] focus-within:ring-4 focus-within:ring-[#06736a]/10">
                    <span className="flex-shrink-0 pl-3.5 pr-2.5 text-slate-400" aria-hidden="true">
                        <IconEmail />
                    </span>
                    <input
                        id="email"
                        name="email"
                        type="email"
                        autoComplete="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="flex-1 min-w-0 py-3 pr-4 text-sm text-slate-900 bg-transparent outline-none placeholder:text-slate-400"
                        placeholder="nama@rsumeloy.com"
                    />
                </div>
            </div>

            {/* ── Password Field ── */}
            <div>
                <label htmlFor="password" className="block text-sm font-semibold text-slate-700 mb-1.5">
                    Password
                </label>
                {/* Wrapper: border + focus ring here, NOT on input */}
                <div className="flex items-center rounded-xl border border-slate-200 bg-white shadow-sm transition-all duration-200 focus-within:border-[#06736a] focus-within:ring-4 focus-within:ring-[#06736a]/10">
                    <span className="flex-shrink-0 pl-3.5 pr-2.5 text-slate-400" aria-hidden="true">
                        <IconLock />
                    </span>
                    <input
                        id="password"
                        name="password"
                        type={showPassword ? 'text' : 'password'}
                        autoComplete="current-password"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="flex-1 min-w-0 py-3 text-sm text-slate-900 bg-transparent outline-none placeholder:text-slate-400"
                        placeholder="Masukkan password Anda"
                    />
                    <button
                        type="button"
                        onClick={() => setShowPassword(v => !v)}
                        className="flex-shrink-0 flex items-center justify-center px-3.5 h-full text-slate-400 hover:text-slate-600 transition-colors focus:outline-none"
                        aria-label={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
                        tabIndex={-1}
                    >
                        {showPassword ? <IconEyeOff /> : <IconEyeOpen />}
                    </button>
                </div>
            </div>

            {/* ── Error Banner ── */}
            {translatedError && (
                <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 animate-fadeIn">
                    <span className="flex-shrink-0 mt-0.5 text-red-500">
                        <IconAlertCircle />
                    </span>
                    <p className="text-sm text-red-700 leading-relaxed">{translatedError}</p>
                </div>
            )}

            {/* ── Login Button ── */}
            <button
                type="submit"
                disabled={loading}
                className="group flex w-full items-center justify-center gap-2.5 rounded-xl bg-[#06736a] px-4 py-3.5 text-sm font-bold text-white shadow-lg shadow-[#06736a]/25 transition-all duration-200 hover:bg-[#054f46] hover:shadow-xl hover:shadow-[#06736a]/30 hover:-translate-y-0.5 focus:outline-none focus:ring-4 focus:ring-[#06736a]/20 disabled:bg-slate-400 disabled:shadow-none disabled:translate-y-0 active:scale-[0.98]"
            >
                {loading ? (
                    <>
                        <div className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                        <span>Sedang Memverifikasi...</span>
                    </>
                ) : (
                    <>
                        <span className="transition-transform duration-200 group-hover:translate-x-0.5">
                            <IconArrowRight />
                        </span>
                        <span>Masuk ke Sistem</span>
                    </>
                )}
            </button>

            {/* ── Info Reset Password ── */}
            <div className="rounded-xl bg-slate-50 border border-slate-200/80 p-4">
                <div className="flex items-start gap-3">
                    <span className="flex-shrink-0 mt-0.5 text-slate-400">
                        <IconKey />
                    </span>
                    <div>
                        <p className="text-xs font-bold text-slate-700 mb-0.5">Lupa Password?</p>
                        <p className="text-xs text-slate-500 leading-relaxed">
                            Reset password dilakukan langsung oleh HRD — tidak perlu email.
                        </p>
                        <p className="text-xs font-semibold text-[#06736a] mt-1.5">
                            Hubungi bagian HRD atau datangi meja Admin.
                        </p>
                    </div>
                </div>
            </div>

        </form>
    );
};

export default LoginForm;
