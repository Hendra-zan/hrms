/**
 * Login.tsx - REFACTORED
 * 
 * Main login view.
 * 
 * Previous: ~334 lines, monolithic
 * Current:  ~125 lines, extracted Hero and Form components
 */
import React, { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import DatabaseStatus from './DatabaseStatus';
import { generateCSRFToken, storeCSRFToken } from '../services/securityUtils';
import LoginHero from './login/LoginHero';
import LoginForm from './login/LoginForm';

interface LoginProps {
    onLogin: (email: string, password: string) => Promise<void>;
    initialError?: string | null;
}

const Login: React.FC<LoginProps> = ({ onLogin, initialError }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(initialError || null);
    const [loginAttempts, setLoginAttempts] = useState(0);
    const [lockoutUntil, setLockoutUntil] = useState<Date | null>(null);
    const [downloadUrl, setDownloadUrl] = useState('');

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const hostUrl = `${window.location.protocol}//${window.location.host}/downloads/app-release.apk`;
            setDownloadUrl(hostUrl);
        }
    }, []);

    useEffect(() => {
        if (initialError) setError(initialError);
        
        const storedLockout = localStorage.getItem('loginLockout');
        if (storedLockout) {
            const lockoutTime = new Date(storedLockout);
            if (lockoutTime > new Date()) setLockoutUntil(lockoutTime);
            else localStorage.removeItem('loginLockout');
        }
        
        const storedAttempts = localStorage.getItem('loginAttempts');
        const attemptsTime = localStorage.getItem('loginAttemptsTime');
        if (storedAttempts && attemptsTime) {
            const attemptDate = new Date(attemptsTime);
            const thirtyMinutesAgo = new Date();
            thirtyMinutesAgo.setMinutes(thirtyMinutesAgo.getMinutes() - 30);
            
            if (attemptDate > thirtyMinutesAgo) setLoginAttempts(parseInt(storedAttempts));
            else {
                localStorage.removeItem('loginAttempts');
                localStorage.removeItem('loginAttemptsTime');
            }
        }
    }, [initialError]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!email.trim() || !password.trim()) return setError('Email dan password tidak boleh kosong');
        
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) return setError('Format email tidak valid');
        
        if (lockoutUntil && lockoutUntil > new Date()) {
            const minutesLeft = Math.ceil((lockoutUntil.getTime() - new Date().getTime()) / 60000);
            return setError(`Terlalu banyak percobaan login. Coba lagi dalam ${minutesLeft} menit.`);
        }
        
        const csrfToken = generateCSRFToken();
        storeCSRFToken(csrfToken);
        
        setError(null);
        setLoading(true);
        try {
            Object.keys(localStorage).forEach(key => {
                if (key.startsWith('app_data_') || key.startsWith('profile_')) localStorage.removeItem(key);
            });
            await onLogin(email, password);
            setLoginAttempts(0);
            localStorage.removeItem('loginAttempts');
            localStorage.removeItem('loginAttemptsTime');
            localStorage.removeItem('loginLockout');
        } catch (err: any) {
            const newAttempts = loginAttempts + 1;
            setLoginAttempts(newAttempts);
            localStorage.setItem('loginAttempts', newAttempts.toString());
            localStorage.setItem('loginAttemptsTime', new Date().toISOString());
            
            if (newAttempts >= 5) {
                const lockoutTime = new Date();
                lockoutTime.setMinutes(lockoutTime.getMinutes() + 15);
                setLockoutUntil(lockoutTime);
                localStorage.setItem('loginLockout', lockoutTime.toISOString());
                setError(`Terlalu banyak percobaan login. Coba lagi dalam 15 menit.`);
            } else {
                setError(err.message || 'Login gagal. Periksa kembali email dan password Anda.');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="relative min-h-screen overflow-hidden bg-[#061f1d]">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(6,115,106,0.35),_transparent_28%),radial-gradient(circle_at_top_right,_rgba(255,255,255,0.16),_transparent_20%),linear-gradient(135deg,_#061f1d_0%,_#093732_50%,_#041514_100%)]" />
            <div className="absolute -top-24 -right-24 h-72 w-72 rounded-full bg-[#21d3c2]/15 blur-3xl" />
            <div className="absolute -bottom-24 -left-24 h-80 w-80 rounded-full bg-white/10 blur-3xl" />

            <div className="relative mx-auto flex min-h-screen max-w-7xl items-center px-4 py-8 sm:px-6 lg:px-8">
                <div className="grid w-full gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:gap-12">
                    <LoginHero />

                    <div className="flex items-center justify-center">
                        <div className="w-full max-w-lg rounded-[2rem] border border-white/15 bg-white/90 p-5 shadow-[0_30px_80px_rgba(0,0,0,0.35)] backdrop-blur-xl sm:p-8 animate-loginCard">
                            <div className="mb-6 flex items-center gap-4">
                                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[#06736a] to-[#089c8e] text-white shadow-lg shadow-[#06736a]/30">
                                    {/* Modern medical cross / HR shield icon */}
                                    <svg width="30" height="30" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                                        {/* Shield outline */}
                                        <path d="M16 3L5 7.5V15.5C5 21.8 9.8 27.7 16 29C22.2 27.7 27 21.8 27 15.5V7.5L16 3Z" stroke="white" strokeWidth="1.8" strokeLinejoin="round" fill="rgba(255,255,255,0.12)"/>
                                        {/* Cross / plus symbol */}
                                        <path d="M16 11V21M11 16H21" stroke="white" strokeWidth="2.4" strokeLinecap="round"/>
                                    </svg>
                                </div>
                                <div>
                                    <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#06736a]">HRMS Pro</p>
                                    <h2 className="text-2xl font-black text-slate-900">Selamat Datang</h2>
                                    <p className="mt-1 text-xs font-medium uppercase tracking-[0.15em] text-slate-400">Portal Karyawan RSU Meloy</p>
                                </div>
                            </div>

                            <p className="mb-5 text-sm leading-6 text-slate-500">
                                Masuk menggunakan email dan password yang diberikan oleh bagian HRD.
                            </p>

                            <DatabaseStatus />

                            <LoginForm
                                email={email} setEmail={setEmail}
                                password={password} setPassword={setPassword}
                                error={error} loading={loading} onSubmit={handleSubmit}
                            />

                            {downloadUrl && (
                                <div className="mt-8 border-t border-slate-200/80 pt-6">
                                    <div className="rounded-2xl bg-emerald-50/50 p-4 border border-emerald-100/50">
                                        <div className="flex flex-col sm:flex-row items-center gap-4">
                                            {/* QR Code Container */}
                                            <div className="bg-white p-2 rounded-xl border border-emerald-100 shadow-sm flex-shrink-0">
                                                <QRCodeSVG 
                                                    value={downloadUrl} 
                                                    size={100} 
                                                    level="H"
                                                    fgColor="#042f2c"
                                                    imageSettings={{
                                                        src: `data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'><rect width='32' height='32' rx='8' fill='%23065f46'/><path d='M16 8v16M8 16h16' stroke='white' stroke-width='3.5' stroke-linecap='round'/></svg>`,
                                                        x: undefined,
                                                        y: undefined,
                                                        height: 20,
                                                        width: 20,
                                                        excavate: true,
                                                    }}
                                                />
                                            </div>
                                            {/* Info & Download Button */}
                                            <div className="flex-1 text-center sm:text-left">
                                                <h3 className="text-sm font-bold text-slate-800 flex items-center justify-center sm:justify-start gap-2">
                                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="text-[#06736a]" aria-hidden="true">
                                                        <rect x="5" y="2" width="14" height="20" rx="2" />
                                                        <path d="M12 18h.01" />
                                                    </svg>
                                                    <span>Aplikasi Absensi Mobile</span>
                                                </h3>
                                                <p className="mt-1 text-xs text-slate-500 leading-normal">
                                                    Pindai QR Code dengan kamera HP Anda, atau unduh file APK langsung ke perangkat Android.
                                                </p>
                                                <a
                                                    href={downloadUrl}
                                                    download="HRMS-Absensi-Mobile.apk"
                                                    className="mt-3 inline-flex items-center gap-2 rounded-lg bg-[#06736a] hover:bg-[#054f46] px-3 py-1.5 text-xs font-semibold text-white shadow transition-all duration-200 hover:-translate-y-0.5"
                                                >
                                                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                                        <polyline points="7 10 12 15 17 10" />
                                                        <line x1="12" y1="15" x2="12" y2="3" />
                                                    </svg>
                                                    <span>Unduh APK</span>
                                                </a>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;
