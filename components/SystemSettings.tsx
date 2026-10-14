/**
 * SystemSettings.tsx - REFACTORED
 * 
 * System settings container component with Multi-Theme Support.
 */
import React, { useState, useEffect } from 'react';
import logger from '../services/logger.ts';
import { SystemSettings as SystemSettingsType } from '../types.ts';
import { PencilIcon, CheckIcon, XMarkIcon } from './icons.tsx';
import LoadingSpinner from './LoadingSpinner.tsx';

// Sub-components
import ShiftConfigSection from './system-settings/ShiftConfigSection';
import PayrollConfigPanel from './system-settings/PayrollConfigPanel';
import HikvisionPanel from './HikvisionPanel';
import { FingerprintEnrollmentPanel } from './fingerprint/FingerprintEnrollmentPanel';
import { useAppData } from '../stores/appStore';

interface SystemSettingsProps {
    settings: SystemSettingsType | null;
    onUpdate: (settings: Partial<SystemSettingsType>, id?: string) => Promise<void>;
    loading: boolean;
}

const SystemSettings: React.FC<SystemSettingsProps> = ({ settings, onUpdate, loading }) => {
    const { employees } = useAppData();
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState<Partial<SystemSettingsType>>({
        institution_name: '',
        institution_type: 'Rumah Sakit',
        address: '',
        phone: ''
    });
    const [theme, setTheme] = useState<SystemSettingsType['ui_theme']>('light');
    const [saving, setSaving] = useState(false);
    const [activeTab, setActiveTab] = useState<'profile' | 'shift' | 'payroll' | 'machine'>('profile');

    useEffect(() => {
        if (settings) {
            setFormData({
                institution_name: settings.institution_name,
                institution_type: settings.institution_type,
                address: settings.address || '',
                phone: settings.phone || ''
            });
            setTheme((settings as any).ui_theme || 'light');
        }
    }, [settings]);

    useEffect(() => {
        try {
            document.documentElement.classList.remove('theme-dark', 'theme-indigo', 'theme-emerald', 'theme-turquoise');
            if (theme === 'dark') document.documentElement.classList.add('theme-dark');
            else if (theme === 'indigo') document.documentElement.classList.add('theme-indigo');
            else if (theme === 'emerald') document.documentElement.classList.add('theme-emerald');
            else if (theme === 'turquoise') document.documentElement.classList.add('theme-turquoise');
        } catch (err) {}
    }, [theme]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setSaving(true);
        try {
            const payload = { ...formData } as any;
            if (theme) payload.ui_theme = theme;
            await onUpdate(payload, settings?.id);
            try { localStorage.setItem('ui_theme', theme || 'light'); } catch (err) {}
            setIsEditing(false);
        } catch (error) {
            logger.error('Error updating settings', error);
        } finally {
            setSaving(false);
        }
    };

    const handleCancel = () => {
        setIsEditing(false);
        if (settings) {
            setFormData({
                institution_name: settings.institution_name,
                institution_type: settings.institution_type,
                address: settings.address || '',
                phone: settings.phone || ''
            });
            setTheme((settings as any).ui_theme || 'light');
        }
    };

    const getThemeLabel = (t?: string) => {
        switch (t) {
            case 'indigo': return '🌐 Royal Indigo Enterprise (#4f46e5)';
            case 'emerald': return '🌿 Emerald Hospital (#059669)';
            case 'turquoise': return '💎 Turquoise Modern (#0bd6ae)';
            case 'dark': return '🌙 Night Dark Mode (#0f172a)';
            default: return '🏥 Teal Medis Classic (#06736a) - Default RS';
        }
    };

    if (loading) {
        return <LoadingSpinner />;
    }

    return (
        <div className="space-y-6">
            {/* Header Hero Section */}
            <div className="bg-gradient-to-r from-[#06736a] via-[#055f57] to-teal-800 rounded-3xl p-6 text-white shadow-lg relative overflow-hidden">
                <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/10 rounded-full blur-2xl" />
                <div className="flex items-center justify-between relative z-10">
                    <div>
                        <h1 className="text-2xl font-bold">⚙️ Pengaturan Sistem & Tema Aplikasi</h1>
                        <p className="text-xs text-teal-100 mt-1">Konfigurasi profil institusi, preferensi warna tema desktop, shift kerja, dan gaji.</p>
                    </div>
                </div>
            </div>

            {/* Tab Navigation */}
            <div className="flex p-1 bg-gray-100/80 rounded-2xl gap-1">
                <button
                    onClick={() => setActiveTab('profile')}
                    className={`flex-1 py-2 px-4 text-xs font-bold rounded-xl transition-all duration-300 ${
                        activeTab === 'profile'
                            ? 'bg-white text-gray-900 shadow-md transform scale-[1.02]'
                            : 'text-gray-500 hover:text-gray-800 hover:bg-white/40'
                    }`}
                >
                    🏢 Profil & Tema Warna
                </button>
                <button
                    onClick={() => setActiveTab('shift')}
                    className={`flex-1 py-2 px-4 text-xs font-bold rounded-xl transition-all duration-300 ${
                        activeTab === 'shift'
                            ? 'bg-white text-gray-900 shadow-md transform scale-[1.02]'
                            : 'text-gray-500 hover:text-gray-800 hover:bg-white/40'
                    }`}
                >
                    ⏰ Shift Global
                </button>
                <button
                    onClick={() => setActiveTab('payroll')}
                    className={`flex-1 py-2 px-4 text-xs font-bold rounded-xl transition-all duration-300 ${
                        activeTab === 'payroll'
                            ? 'bg-white text-gray-900 shadow-md transform scale-[1.02]'
                            : 'text-gray-500 hover:text-gray-800 hover:bg-white/40'
                    }`}
                >
                    💰 Gaji & Payroll
                </button>
                <button
                    onClick={() => setActiveTab('machine')}
                    className={`flex-1 py-2 px-4 text-xs font-bold rounded-xl transition-all duration-300 ${
                        activeTab === 'machine'
                            ? 'bg-white text-gray-900 shadow-md transform scale-[1.02]'
                            : 'text-gray-500 hover:text-gray-800 hover:bg-white/40'
                    }`}
                >
                    🔌 Mesin Absensi
                </button>
            </div>

            {/* Tab Contents */}
            {activeTab === 'profile' && (
                <div className="bg-white shadow-xl rounded-3xl p-6 border border-gray-100 transition-all duration-500 animate-fadeIn">
                    <div className="flex justify-between items-center mb-6">
                        <div>
                            <h2 className="text-xl font-bold text-gray-800">🏢 Profil Institusi & Preferensi Tema</h2>
                            <p className="text-xs text-gray-500 mt-0.5">Informasi dasar dan preferensi tampilan tema desktop instansi.</p>
                        </div>
                        {!isEditing && (
                            <button
                                onClick={() => setIsEditing(true)}
                                className="flex items-center gap-2 px-4 py-2 bg-[#06736a] text-white rounded-xl hover:bg-[#055f57] transition-colors text-sm font-semibold shadow-md"
                                aria-label="Edit pengaturan sistem"
                            >
                                <PencilIcon />
                                <span>Edit Profil & Tema</span>
                            </button>
                        )}
                    </div>

                    {!isEditing ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100">
                                <label className="block text-xs font-medium text-gray-400 mb-1">Nama Institusi</label>
                                <p className="text-base font-semibold text-gray-800">{settings?.institution_name || 'Belum diatur'}</p>
                            </div>
                            <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100">
                                <label className="block text-xs font-medium text-gray-400 mb-1">Jenis Institusi</label>
                                <p className="text-base font-semibold text-gray-800">{settings?.institution_type || 'Belum diatur'}</p>
                            </div>
                            <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100">
                                <label className="block text-xs font-medium text-gray-400 mb-1">Tema Tampilan Aktif</label>
                                <p className="text-base font-semibold text-[#06736a]">{getThemeLabel((settings as any)?.ui_theme)}</p>
                            </div>
                            <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100">
                                <label className="block text-xs font-medium text-gray-400 mb-1">Telepon</label>
                                <p className="text-base font-semibold text-gray-800">{settings?.phone || 'Belum diatur'}</p>
                            </div>
                            <div className="md:col-span-2 p-4 rounded-2xl bg-gray-50 border border-gray-100">
                                <label className="block text-xs font-medium text-gray-400 mb-1">Alamat Lengkap</label>
                                <p className="text-base font-semibold text-gray-800">{settings?.address || 'Belum diatur'}</p>
                            </div>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 mb-1">Nama Institusi *</label>
                                    <input type="text" name="institution_name" value={formData.institution_name} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#06736a] focus:border-[#06736a] text-sm" required placeholder="Contoh: RS Harapan Sehat" />
                                </div>
                                <div>
                                    <label htmlFor="institution-type" className="block text-xs font-bold text-gray-700 mb-1">Jenis Institusi *</label>
                                    <select id="institution-type" name="institution_type" value={formData.institution_type} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#06736a] focus:border-[#06736a] text-sm" required>
                                        <option value="Rumah Sakit">Rumah Sakit</option>
                                        <option value="Klinik">Klinik</option>
                                        <option value="Puskesmas">Puskesmas</option>
                                    </select>
                                </div>
                                <div className="md:col-span-2 bg-teal-50/60 border border-teal-200 p-4 rounded-2xl space-y-2">
                                    <label className="block text-xs font-bold text-teal-900">🎨 Pilih Tema Warna Dasar Desktop</label>
                                    <select value={theme} onChange={(e) => setTheme(e.target.value as any)} className="w-full px-3.5 py-2.5 border border-teal-300 rounded-xl focus:ring-2 focus:ring-[#06736a] text-sm font-semibold bg-white text-gray-800">
                                        <option value="light">🏥 Teal Medis Classic (#06736a) - Default Original RS</option>
                                        <option value="indigo">🌐 Royal Indigo Enterprise (#4f46e5) - Biru Enterprise</option>
                                        <option value="emerald">🌿 Emerald Hospital (#059669) - Hijau Segar</option>
                                        <option value="turquoise">💎 Turquoise Modern (#0bd6ae) - Biru Toska</option>
                                        <option value="dark">🌙 Night Dark Mode (#0f172a) - Mode Malam</option>
                                    </select>
                                    <p className="text-[11px] text-teal-700">
                                        Pilihan tema akan langsung diterapkan pada seluruh komponen antarmuka desktop HRMS Pro.
                                    </p>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 mb-1">Telepon</label>
                                    <input type="tel" name="phone" value={formData.phone} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#06736a] focus:border-[#06736a] text-sm" placeholder="Nomor telepon institusi" />
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-xs font-bold text-gray-700 mb-1">Alamat</label>
                                    <textarea name="address" value={formData.address} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#06736a] focus:border-[#06736a] text-sm" rows={3} placeholder="Alamat lengkap institusi" />
                                </div>
                            </div>
                            <div className="flex gap-3 pt-4 border-t border-gray-100">
                                <button type="submit" disabled={saving} className="flex items-center gap-2 px-5 py-2.5 bg-[#06736a] hover:bg-[#055f57] text-white rounded-xl transition-colors disabled:bg-gray-400 text-sm font-semibold shadow-md">
                                    <CheckIcon />
                                    <span>{saving ? 'Menyimpan...' : 'Simpan Perubahan'}</span>
                                </button>
                                <button type="button" onClick={handleCancel} disabled={saving} className="flex items-center gap-2 px-5 py-2.5 bg-gray-500 hover:bg-gray-600 text-white rounded-xl transition-colors disabled:bg-gray-400 text-sm font-semibold shadow-md">
                                    <XMarkIcon />
                                    <span>Batal</span>
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            )}

            {activeTab === 'shift' && (
                <div className="transition-all duration-300 mt-0">
                    <ShiftConfigSection 
                        initialShifts={settings?.default_shifts || []} 
                        onSave={async (shifts) => await onUpdate({ default_shifts: shifts } as any)} 
                    />
                </div>
            )}

            {activeTab === 'payroll' && (
                <div className="transition-all duration-300 mt-0">
                    <PayrollConfigPanel 
                        overtimeRate={settings?.overtime_rate_per_hour ?? 30000} 
                        bpjsRate={settings?.bpjs_kesehatan_rate ?? 0.01} 
                        bpjsMaxWage={settings?.bpjs_kesehatan_max_wage ?? 12000000} 
                        onSave={async (data) => await onUpdate(data as any)} 
                    />
                </div>
            )}

            {activeTab === 'machine' && (
                <div className="transition-all duration-300 mt-0 space-y-6">
                    <FingerprintEnrollmentPanel employees={employees} />
                    <HikvisionPanel />
                </div>
            )}
        </div>
    );
};

export default SystemSettings;
