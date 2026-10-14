import React, { Suspense, useEffect, useRef, useState } from 'react';
import logger from '../services/logger.ts';
import { supabase } from '../services/supabaseClient';

import { lazyWithRetry } from '../utils/lazyWithRetry';
const DatabaseSetup = lazyWithRetry(() => import('./DatabaseSetup.tsx'));

const DatabaseStatus: React.FC = () => {
    const [status, setStatus] = useState<'checking' | 'connected' | 'error'>('checking');
    const [error, setError] = useState<string>('');
    const hasChecked = useRef(false);

    useEffect(() => {
        if (hasChecked.current) return;
        hasChecked.current = true;

        const checkConnection = async () => {
            try {
                const { error } = await supabase.from('departments').select('count', { count: 'exact', head: true });
                if (error) {
                    logger.error('Database connection error', error);
                    setError(error.message);
                    setStatus('error');
                } else {
                    setStatus('connected');
                }
            } catch (err: any) {
                logger.error('Connection test failed', err);
                setError(err.message || 'Unknown error');
                setStatus('error');
            }
        };

        checkConnection();
    }, []);

    if (status === 'checking') {
        return (
            <div className="mb-5 flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
                <div className="flex-shrink-0 h-5 w-5 rounded-full border-2 border-amber-400 border-t-transparent animate-spin" />
                <p className="text-sm text-amber-700 font-medium">
                    Sedang memeriksa koneksi sistem...
                </p>
            </div>
        );
    }

    if (status === 'error') {
        const errorMessage = String(error || '').toLowerCase();
        const isTableMissing = errorMessage.includes('relation') && errorMessage.includes('does not exist');
        const isConnectionRefused =
            errorMessage.includes('failed to fetch') ||
            errorMessage.includes('connection refused') ||
            errorMessage.includes('err_connection_refused');
        const isAuthError = errorMessage.includes('auth') || errorMessage.includes('permission');

        // Tentukan pesan ramah user berdasarkan jenis error
        let title = 'Sistem sedang tidak dapat terhubung';
        let description = 'Terjadi gangguan pada koneksi sistem. Silakan coba beberapa saat lagi.';
        let actionHint = 'Jika masalah berlanjut, hubungi staf IT atau Admin sistem.';

        if (isConnectionRefused) {
            title = 'Jaringan rumah sakit belum siap';
            description = 'Sistem HRMS belum dapat terhubung ke jaringan internal RSU Meloy. Pastikan komputer Anda terhubung ke jaringan LAN rumah sakit.';
            actionHint = 'Coba periksa kabel LAN atau koneksi WiFi Anda, lalu muat ulang halaman ini.';
        } else if (isTableMissing) {
            title = 'Database belum dikonfigurasi';
            description = 'Struktur database sistem belum selesai disiapkan oleh tim IT.';
            actionHint = 'Hubungi Administrator IT untuk menyelesaikan konfigurasi awal database.';
        } else if (isAuthError) {
            title = 'Izin akses sistem bermasalah';
            description = 'Sistem tidak memiliki izin yang cukup untuk mengakses database.';
            actionHint = 'Hubungi Admin IT untuk memeriksa konfigurasi keamanan sistem.';
        }

        return (
            <>
                <div className="mb-5 rounded-xl border border-red-200 bg-red-50 p-4">
                    <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 mt-0.5">
                            <svg className="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm-.75-4.75a.75.75 0 001.5 0v-4.5a.75.75 0 00-1.5 0v4.5zm.75-7.5a1 1 0 110 2 1 1 0 010-2z" clipRule="evenodd" />
                            </svg>
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-red-800">{title}</p>
                            <p className="mt-1 text-xs leading-relaxed text-red-700">{description}</p>
                            <div className="mt-2 rounded-lg bg-red-100 px-3 py-2">
                                <p className="text-xs font-medium text-red-800">
                                    💡 {actionHint}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {isTableMissing && (
                    <Suspense fallback={<div className="text-sm text-gray-500 mt-3">Memuat panduan setup database...</div>}>
                        <DatabaseSetup />
                    </Suspense>
                )}
            </>
        );
    }

    return (
        <div className="mb-5 flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3">
            <div className="flex-shrink-0 h-5 w-5 rounded-full bg-emerald-400 flex items-center justify-center">
                <svg className="h-3 w-3 text-white" viewBox="0 0 12 12" fill="currentColor" aria-hidden="true">
                    <path d="M10.28 2.28L4.5 8.06 1.72 5.28.28 6.72l4.22 4.22 7.22-7.22-1.44-1.44z"/>
                </svg>
            </div>
            <p className="text-sm font-medium text-emerald-800">
                Sistem siap — silakan masuk dengan akun Anda
            </p>
        </div>
    );
};

export default DatabaseStatus;