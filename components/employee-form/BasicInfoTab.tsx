import React from 'react';
import { Employee, Role } from '../../types';

interface BasicInfoTabProps {
    employee: Employee;
    employeeToEdit: Employee | null;
    handleChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
    isAdmin: boolean;
    handleGenerateNIK: () => void;
    errors: Record<string, string>;
    password?: string;
    setPassword?: (pwd: string) => void;
    showPasswordReset?: boolean;
    setShowPasswordReset?: (val: boolean) => void;
    newPassword?: string;
    setNewPassword?: (pwd: string) => void;
    onPhotoUpload?: (file: File) => Promise<string | null>;
    isUploadingPhoto?: boolean;
}

const BasicInfoTab: React.FC<BasicInfoTabProps> = ({
    employee,
    employeeToEdit,
    handleChange,
    isAdmin,
    handleGenerateNIK,
    errors,
    password = '',
    setPassword,
    showPasswordReset = false,
    setShowPasswordReset,
    newPassword = '',
    setNewPassword,
    onPhotoUpload,
    isUploadingPhoto = false,
}) => {
    const fileInputRef = React.useRef<HTMLInputElement>(null);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0 && onPhotoUpload) {
            const file = e.target.files[0];
            await onPhotoUpload(file);
        }
    };

    const triggerFileSelect = () => {
        if (fileInputRef.current) {
            fileInputRef.current.click();
        }
    };

    const handleRemovePhoto = () => {
        const dummyEvent = {
            target: {
                name: 'foto',
                value: ''
            }
        } as unknown as React.ChangeEvent<HTMLInputElement>;
        handleChange(dummyEvent);
    };
    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Informasi Dasar */}
                <div className="space-y-5 p-6 border rounded-lg bg-gray-50">
                    <h3 className="font-semibold text-lg text-[#06736a]">Informasi Dasar</h3>
                    
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Nama Lengkap *</label>
                        <input 
                            type="text" 
                            name="nama" 
                            value={employee.nama} 
                            onChange={handleChange} 
                            className={`mt-1 block w-full border-gray-300 rounded-lg shadow-sm focus:ring-[#06736a] focus:border-[#06736a] p-3 ${errors.nama ? 'border-red-500' : ''}`}
                            placeholder="Contoh: Dr. John Doe"
                            required
                        />
                        {errors.nama && <p className="mt-1 text-sm text-red-600">{errors.nama}</p>}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">NIK (Nomor Induk Karyawan)</label>
                        <div className="flex gap-2 items-center">
                            <input
                                type="text"
                                name="nik"
                                value={employee.nik || ''}
                                onChange={isAdmin ? handleChange : undefined}
                                className={`mt-1 block w-full border-gray-300 rounded-lg shadow-sm focus:ring-[#06736a] focus:border-[#06736a] p-3 ${errors.nik ? 'border-red-500' : ''}`}
                                placeholder="Contoh: 24010101001"
                                readOnly={!isAdmin}
                            />
                            {isAdmin && (
                                <button
                                    type="button"
                                    onClick={handleGenerateNIK}
                                    className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm whitespace-nowrap"
                                >
                                    Generate NIK
                                </button>
                            )}
                        </div>
                        {errors.nik && <p className="mt-1 text-sm text-red-600">{errors.nik}</p>}
                    </div>

                    {/* PIN Mesin Absensi — hanya untuk Admin/HRD */}
                    {isAdmin && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                ID Mesin Absensi
                                <span
                                    className="ml-2 inline-flex items-center justify-center w-4 h-4 rounded-full bg-gray-300 text-gray-600 text-xs cursor-help"
                                    title="Nomor ID karyawan yang terdaftar di mesin absensi fisik (Hikvision, ZKTeco, dll). Biasanya berupa angka pendek 1–300. Biarkan kosong jika karyawan belum didaftarkan di mesin."
                                >
                                    ?
                                </span>
                            </label>
                            <div className="flex items-center gap-3">
                                <input
                                    type="text"
                                    name="pin_mesin"
                                    value={employee.pin_mesin || ''}
                                    onChange={handleChange}
                                    inputMode="numeric"
                                    pattern="\d*"
                                    maxLength={20}
                                    onKeyPress={(e) => {
                                        if (!/\d/.test(e.key)) e.preventDefault();
                                    }}
                                    className={`mt-1 block w-full border-gray-300 rounded-lg shadow-sm focus:ring-[#06736a] focus:border-[#06736a] p-3 ${errors.pin_mesin ? 'border-red-500' : ''}`}
                                    placeholder="Contoh: 5 atau 123"
                                />
                                {/* Status badge */}
                                {employee.pin_mesin ? (
                                    <span className="mt-1 flex items-center gap-1 text-xs font-medium text-green-700 bg-green-100 px-2 py-1 rounded-full whitespace-nowrap">
                                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                        </svg>
                                        Terhubung
                                    </span>
                                ) : (
                                    <span className="mt-1 flex items-center gap-1 text-xs font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded-full whitespace-nowrap">
                                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                        </svg>
                                        Belum terhubung
                                    </span>
                                )}
                            </div>
                            {errors.pin_mesin && <p className="mt-1 text-sm text-red-600">{errors.pin_mesin}</p>}
                            <p className="mt-1 text-xs text-gray-500">
                                Isi dengan angka ID karyawan di mesin absensi fisik (1–300). Kosongkan jika belum terdaftar.
                            </p>
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Kredensial</label>
                        <input 
                            type="text" 
                            name="kredensial" 
                            value={employee.kredensial || ''} 
                            onChange={handleChange} 
                            className="mt-1 block w-full border-gray-300 rounded-lg shadow-sm focus:ring-[#06736a] focus:border-[#06736a] p-3"
                            placeholder="Contoh: Sp.PD, M.Kes"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Email *</label>
                        <input 
                            type="email" 
                            name="email" 
                            value={employee.email} 
                            onChange={handleChange} 
                            className={`mt-1 block w-full border-gray-300 rounded-lg shadow-sm focus:ring-[#06736a] focus:border-[#06736a] p-3 ${errors.email ? 'border-red-500' : ''}`}
                            placeholder="email@hospital.com"
                            required
                        />
                        {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Telepon</label>
                        <input 
                            type="tel" 
                            name="telepon" 
                            value={employee.telepon || ''} 
                            onChange={handleChange} 
                            className="mt-1 block w-full border-gray-300 rounded-lg shadow-sm focus:ring-[#06736a] focus:border-[#06736a] p-3"
                            placeholder="081234567890"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Tanggal Lahir</label>
                        <input 
                            type="date" 
                            name="birthDate" 
                            value={employee.birthDate || ''} 
                            onChange={handleChange} 
                            className="mt-1 block w-full border-gray-300 rounded-lg shadow-sm focus:ring-[#06736a] focus:border-[#06736a] p-3"
                            title="Tanggal lahir karyawan"
                        />
                    </div>

                    <div className="space-y-3">
                        <label className="block text-sm font-medium text-gray-700">Foto Profil Karyawan</label>
                        
                        {/* Area Upload & Preview */}
                        <div className="flex items-center gap-4 p-3 border rounded-xl bg-white shadow-sm">
                            {/* Preview */}
                            <div className="relative h-16 w-16 rounded-full overflow-hidden bg-gray-100 border border-gray-200 flex-shrink-0 flex items-center justify-center">
                                {employee.foto && employee.foto.startsWith('http') ? (
                                    <img src={employee.foto} alt="Preview" className="h-full w-full object-cover" />
                                ) : (
                                    <span className="text-gray-400 font-bold text-lg">
                                        {(employee.nama || 'K').split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()}
                                    </span>
                                )}
                            </div>

                            {/* Actions */}
                            <div className="flex-1 flex flex-col gap-1.5">
                                <div className="flex gap-2">
                                    <input 
                                        type="file" 
                                        ref={fileInputRef}
                                        onChange={handleFileChange}
                                        className="hidden" 
                                        accept="image/*"
                                    />
                                    <button
                                        type="button"
                                        onClick={triggerFileSelect}
                                        disabled={isUploadingPhoto}
                                        className="px-3.5 py-2 bg-[#06736a] text-white hover:bg-[#089c8e] transition-colors rounded-lg text-xs font-semibold flex items-center gap-1.5 disabled:opacity-50"
                                    >
                                        {isUploadingPhoto ? (
                                            <>
                                                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                                Mengunggah...
                                            </>
                                        ) : (
                                            <>
                                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                                                </svg>
                                                Upload Foto
                                            </>
                                        )}
                                    </button>
                                    
                                    {employee.foto && (
                                        <button
                                            type="button"
                                            onClick={handleRemovePhoto}
                                            className="px-3 py-2 bg-red-50 text-red-600 hover:bg-red-100 transition-colors rounded-lg text-xs font-semibold"
                                        >
                                            Hapus
                                        </button>
                                    )}
                                </div>
                                <p className="text-[10px] text-gray-500">Format JPG/PNG, Maks. 2MB</p>
                            </div>
                        </div>

                        {/* Input URL Alternatif (Sinkron) */}
                        <div>
                            <span className="block text-xs font-medium text-gray-500 mb-1">Atau masukkan URL Teks manual</span>
                            <input 
                                type="text" 
                                name="foto" 
                                value={employee.foto || ''} 
                                onChange={handleChange} 
                                className="block w-full border-gray-300 rounded-lg shadow-sm focus:ring-[#06736a] focus:border-[#06736a] p-2.5 text-xs"
                                placeholder="https://contoh.com/foto.jpg"
                            />
                        </div>
                    </div>
                </div>

                {/* Login & Password */}
                <div className="space-y-5 p-6 border rounded-lg bg-gray-50">
                    <h3 className="font-semibold text-lg text-[#06736a]">Login & Password</h3>
                    
                    {!employeeToEdit && setPassword && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Password *</label>
                            <input 
                                type="password" 
                                value={password} 
                                onChange={(e) => setPassword(e.target.value)} 
                                className={`mt-1 block w-full border-gray-300 rounded-lg shadow-sm focus:ring-[#06736a] focus:border-[#06736a] p-3 ${errors.password ? 'border-red-500' : ''}`}
                                placeholder="Minimal 6 karakter"
                                required
                            />
                            {errors.password && <p className="mt-1 text-sm text-red-600">{errors.password}</p>}
                        </div>
                    )}

                    {employeeToEdit && setShowPasswordReset && setNewPassword && (
                        <div>
                            <button 
                                type="button" 
                                onClick={() => setShowPasswordReset(!showPasswordReset)} 
                                className="text-sm text-blue-600 hover:text-blue-800"
                            >
                                {showPasswordReset ? 'Batalkan Reset Password' : 'Reset Password'}
                            </button>
                            {showPasswordReset && (
                                <div className="mt-3">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Password Baru</label>
                                    <input 
                                        type="password" 
                                        value={newPassword} 
                                        onChange={(e) => setNewPassword(e.target.value)} 
                                        className="mt-1 block w-full border-gray-300 rounded-lg shadow-sm focus:ring-[#06736a] focus:border-[#06736a] p-3"
                                        placeholder="Minimal 6 karakter"
                                    />
                                </div>
                            )}
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Role</label>
                        <select 
                            name="role" 
                            value={employee.role || 'karyawan'} 
                            onChange={isAdmin ? handleChange : undefined}
                            disabled={!isAdmin} 
                            className={`mt-1 block w-full border-gray-300 rounded-lg shadow-sm focus:ring-[#06736a] focus:border-[#06736a] p-3 ${!isAdmin ? 'bg-gray-100 cursor-not-allowed text-gray-600' : ''}`}
                            title="Pilih role pengguna"
                        >
                            <option value="karyawan">Karyawan</option>
                            <option value="kepala_ruangan">Kepala Ruangan</option>
                            <option value="hrd">HRD</option>
                            <option value="admin">Admin</option>
                        </select>
                    </div>
                    
                    <div className="mt-4 p-3.5 bg-amber-50 border border-amber-200 rounded-xl flex gap-2.5 items-start">
                        <svg className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <div className="text-xs text-amber-800 leading-relaxed">
                            <p className="font-semibold mb-0.5">Simulator Email (Mailpit):</p>
                            <p>
                                Karyawan baru otomatis memiliki password default <strong>M123456</strong>. 
                                Jika karyawan meminta reset password, Anda dapat mengambil link reset tersebut di <a href={typeof window !== 'undefined' && window.location.hostname ? `${window.location.protocol}//${window.location.hostname}:54324` : 'http://127.0.0.1:54324'} target="_blank" rel="noopener noreferrer" className="underline font-bold text-amber-900 hover:text-amber-950">Simulator Email (Mailpit)</a>.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BasicInfoTab;
