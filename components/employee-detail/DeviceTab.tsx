import React, { useEffect, useState } from 'react';
import { Employee } from '../../types.ts';
import { supabase } from '../../services/supabaseClient.ts';
import { updateDeviceAdmin, deleteDeviceAdmin } from '../../services/adminSupabaseClient.ts';

interface DeviceTabProps {
    employee: Employee;
}

interface DBDevice {
    id: string;
    deviceId: string;
    deviceName: string;
    platform: 'Android' | 'iOS';
    deviceFingerprint: string;
    biometricEnabled: boolean;
    isPrimary: boolean;
    registeredAt: string;
    status: 'Active' | 'Inactive' | 'Blocked';
}

const DeviceTab: React.FC<DeviceTabProps> = ({ employee }) => {
    const [devices, setDevices] = useState<DBDevice[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchDevices = async () => {
        setLoading(true);
        setError(null);
        try {
            const { data, error: dbErr } = await supabase
                .from('employee_devices' as any)
                .select('*')
                .eq('employeeId', employee.id)
                .order('registeredAt', { ascending: false });

            if (dbErr) throw dbErr;
            setDevices((data as any) || []);
        } catch (err: any) {
            console.error('[DeviceTab] Error fetching devices:', err);
            setError(err?.message || 'Gagal memuat daftar perangkat.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDevices();
    }, [employee.id]);

    const handleUpdateStatus = async (id: string, newStatus: 'Active' | 'Inactive' | 'Blocked') => {
        try {
            const { error: updateErr } = await updateDeviceAdmin(id, { status: newStatus });
            if (updateErr) throw updateErr;
            await fetchDevices();
        } catch (err: any) {
            alert(`Gagal mengubah status perangkat: ${err?.message || 'Error'}`);
        }
    };

    const handleDeleteDevice = async (id: string, deviceName: string) => {
        const confirmDelete = window.confirm(`Apakah Anda yakin ingin menghapus/un-bind perangkat "${deviceName}"? Karyawan harus mendaftarkan ulang perangkat ini jika ingin menggunakannya kembali.`);
        if (!confirmDelete) return;

        try {
            const { error: deleteErr } = await deleteDeviceAdmin(id);
            if (deleteErr) throw deleteErr;
            await fetchDevices();
        } catch (err: any) {
            alert(`Gagal menghapus perangkat: ${err?.message || 'Error'}`);
        }
    };

    return (
        <div>
            <div className="mb-4 flex items-center justify-between">
                <div>
                    <h4 className="font-semibold text-primary text-lg">Kelola Perangkat Absen</h4>
                    <p className="text-xs text-gray-500 mt-0.5">Daftar ponsel/tablet yang terdaftar untuk absensi biometrik karyawan ini.</p>
                </div>
                <button
                    onClick={fetchDevices}
                    disabled={loading}
                    className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
                >
                    {loading ? 'Memuat...' : 'Refresh'}
                </button>
            </div>

            {loading ? (
                <div className="flex items-center justify-center py-8">
                    <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                </div>
            ) : error ? (
                <div className="rounded-lg bg-red-50 p-4 text-sm text-red-700">{error}</div>
            ) : devices.length > 0 ? (
                <div className="space-y-4">
                    {devices.map((device) => {
                        const isBlocked = device.status === 'Blocked';
                        const isActive = device.status === 'Active';

                        return (
                            <div key={device.id} className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md">
                                <div className="flex items-start justify-between gap-4">
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <span className="font-semibold text-gray-800 text-sm">
                                                📱 {device.deviceName || 'Perangkat Tanpa Nama'}
                                            </span>
                                            <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-2xs font-semibold uppercase ${
                                                isActive 
                                                    ? 'bg-green-100 text-green-800' 
                                                    : isBlocked 
                                                        ? 'bg-red-100 text-red-800' 
                                                        : 'bg-gray-100 text-gray-800'
                                            }`}>
                                                {device.status}
                                            </span>
                                            {device.isPrimary && (
                                                <span className="bg-[#06736a]/10 text-[#06736a] text-2xs px-2 py-0.5 rounded-full font-medium">Utama</span>
                                            )}
                                        </div>
                                        <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-1 text-xs text-gray-500">
                                            <p><span className="font-medium text-gray-700">Platform:</span> {device.platform}</p>
                                            <p><span className="font-medium text-gray-700">Tanggal Daftar:</span> {new Date(device.registeredAt).toLocaleString('id-ID')}</p>
                                            <p className="md:col-span-2 truncate"><span className="font-medium text-gray-700">ID Perangkat:</span> {device.deviceId}</p>
                                            <p className="md:col-span-2 truncate"><span className="font-medium text-gray-700">Fingerprint:</span> {device.deviceFingerprint || '-'}</p>
                                        </div>
                                    </div>
                                    <div className="flex flex-col gap-2">
                                        {isBlocked ? (
                                            <button
                                                onClick={() => handleUpdateStatus(device.id, 'Active')}
                                                className="rounded-lg bg-emerald-50 px-2.5 py-1 text-2xs font-bold text-emerald-700 hover:bg-emerald-100 border border-emerald-200 transition-colors"
                                            >
                                                Buka Blokir
                                            </button>
                                        ) : (
                                            <button
                                                onClick={() => handleUpdateStatus(device.id, 'Blocked')}
                                                className="rounded-lg bg-amber-50 px-2.5 py-1 text-2xs font-bold text-amber-700 hover:bg-amber-100 border border-amber-200 transition-colors"
                                            >
                                                Blokir Perangkat
                                            </button>
                                        )}
                                        <button
                                            onClick={() => handleDeleteDevice(device.id, device.deviceName)}
                                            className="rounded-lg bg-red-50 px-2.5 py-1 text-2xs font-bold text-red-700 hover:bg-red-100 border border-red-200 transition-colors"
                                        >
                                            Hapus Perangkat
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            ) : (
                <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 p-6 text-center text-sm text-gray-500">
                    Tidak ada perangkat absensi yang terdaftar untuk karyawan ini. Karyawan akan mendaftarkan perangkat secara otomatis saat pertama kali melakukan absen di aplikasi mobile.
                </div>
            )}
        </div>
    );
};

export default DeviceTab;
