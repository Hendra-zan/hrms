import React, { useState, useEffect } from 'react';
import { Employee } from '../../types';
import { checkUareUDeviceStatus, captureEnrollmentSamples, type UareUDeviceStatus } from '../../services/uareuFingerprintService';
import { enrollFingerprintAdmin, removeFingerprintAdmin } from '../../services/adminSupabaseClient';

interface FingerprintEnrollmentPanelProps {
  employees: Employee[];
  onRefreshEmployees?: () => void;
}

export const FingerprintEnrollmentPanel: React.FC<FingerprintEnrollmentPanelProps> = ({
  employees,
  onRefreshEmployees,
}) => {
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [deviceStatus, setDeviceStatus] = useState<UareUDeviceStatus | null>(null);
  const [isCheckingDevice, setIsCheckingDevice] = useState(false);
  const [isEnrolling, setIsEnrolling] = useState(false);
  const [currentStep, setCurrentStep] = useState(0); // 0 = idle, 1..3 = steps
  const [enrollStatusMsg, setEnrollStatusMsg] = useState('');
  const [enrollError, setEnrollError] = useState<string | null>(null);
  const [enrollSuccess, setEnrollSuccess] = useState<string | null>(null);

  // Check device status on mount
  useEffect(() => {
    refreshDeviceStatus();
  }, []);

  const refreshDeviceStatus = async () => {
    setIsCheckingDevice(true);
    try {
      const status = await checkUareUDeviceStatus();
      setDeviceStatus(status);
    } catch {
      setDeviceStatus({ isConnected: false, serviceOnline: false, hardwareAttached: false, sdkStatus: 'not_running' });
    } finally {
      setIsCheckingDevice(false);
    }
  };

  const filteredEmployees = employees.filter(emp =>
    emp.nama.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (emp.nik && emp.nik.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (emp.jabatan && emp.jabatan.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const selectedEmployee = employees.find(e => e.id === selectedEmployeeId);

  const handleStartEnrollment = async () => {
    if (!selectedEmployeeId || !selectedEmployee) {
      setEnrollError('Pilih karyawan terlebih dahulu.');
      return;
    }

    if (!deviceStatus?.isConnected) {
      setEnrollError('Scanner U.are.U 4500 / Bridge Service belum terhubung ke PC ini.');
      return;
    }

    setIsEnrolling(true);
    setEnrollError(null);
    setEnrollSuccess(null);
    setCurrentStep(1);
    setEnrollStatusMsg('Tempelkan jari pertama pada scanner...');

    try {
      const result = await captureEnrollmentSamples(3, 10, (current, _total) => {
        setCurrentStep(current);
        setEnrollStatusMsg(`Tempelkan jari sampel ke-${current} dari 3...`);
      });

      if (!result.success || result.samples.length === 0) {
        setEnrollError(result.error || 'Gagal merekam 3 sampel sidik jari.');
        return;
      }

      setEnrollStatusMsg('Menyimpan template sidik jari ke database...');

      // Save best sample (sample 0 / composite) to database via secure admin proxy
      const primaryTemplate = result.samples[0];
      const { error: dbError } = await enrollFingerprintAdmin(
        selectedEmployeeId,
        primaryTemplate,
        result.format || 'ANSI-378'
      );

      if (dbError) {
        // Fallback: If DB table employees doesn't have the column yet, inform user nicely
        console.error('DB Update Error:', dbError);
        setEnrollError(`Gagal menyimpan template: ${dbError.message}`);
        return;
      }

      setEnrollSuccess(`Sidik jari ${selectedEmployee.nama} berhasil didaftarkan! (3 sampel tersimpan)`);
      if (onRefreshEmployees) onRefreshEmployees();
    } catch (err: any) {
      setEnrollError(err.message || 'Terjadi kesalahan sistem saat registrasi sidik jari.');
    } finally {
      setIsEnrolling(false);
      setCurrentStep(0);
    }
  };

  const handleRemoveFingerprint = async (employeeId: string, employeeName: string) => {
    if (!confirm(`Hapus pendaftaran sidik jari untuk ${employeeName}?`)) return;

    try {
      const { error } = await removeFingerprintAdmin(employeeId);
      if (error) throw error;

      setEnrollSuccess(`Pendaftaran sidik jari ${employeeName} telah dihapus.`);
      if (onRefreshEmployees) onRefreshEmployees();
    } catch (err: any) {
      setEnrollError(`Gagal menghapus: ${err.message}`);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 dark:border-gray-700 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xl">🖐️</span>
            <h3 className="font-bold text-gray-900 dark:text-white text-lg">
              Registrasi Sidik Jari Karyawan (U.are.U 4500)
            </h3>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Daftarkan 3 sampel sidik jari karyawan melalui scanner USB desktop untuk absensi ESS.
          </p>
        </div>

        {/* Device Status Badge */}
        <div className="flex items-center gap-2">
          <button
            onClick={refreshDeviceStatus}
            disabled={isCheckingDevice}
            className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
            title="Cek ulang koneksi scanner"
          >
            <span className={isCheckingDevice ? 'animate-spin inline-block' : ''}>🔄</span>
          </button>
          <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold ${
            deviceStatus?.isConnected
              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300'
              : 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300'
          }`}>
            <span className={`w-2 h-2 rounded-full ${deviceStatus?.isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
            {deviceStatus?.isConnected
              ? `Scanner Ready (${deviceStatus.deviceName || 'U.are.U 4500'})`
              : 'Scanner / Bridge Tidak Terdeteksi'}
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column: Form Registrasi */}
        <div className="space-y-4">
          <h4 className="text-sm font-semibold text-gray-800 dark:text-gray-200">
            1. Pilih Karyawan
          </h4>

          {/* Search Box */}
          <div className="relative">
            <input
              type="text"
              placeholder="Cari nama, NIK, atau jabatan..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <span className="absolute left-3 top-2.5 text-gray-400 text-sm">🔍</span>
          </div>

          {/* Select Dropdown */}
          <div>
            <select
              value={selectedEmployeeId}
              onChange={e => setSelectedEmployeeId(e.target.value)}
              disabled={isEnrolling}
              className="w-full py-2.5 px-3 bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">-- Pilih Karyawan --</option>
              {filteredEmployees.map(emp => {
                const isEnrolled = !!(emp as any).fingerprint_enrolled_at || !!(emp as any).fingerprint_template;
                return (
                  <option key={emp.id} value={emp.id}>
                    {isEnrolled ? '✅ ' : '⏳ '} {emp.nama} {emp.nik ? `(${emp.nik})` : ''} — {emp.jabatan || 'Staf'}
                  </option>
                );
              })}
            </select>
          </div>

          {/* Employee Detail Card */}
          {selectedEmployee && (
            <div className="p-4 bg-gray-50 dark:bg-gray-700/30 rounded-xl border border-gray-100 dark:border-gray-700 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-gray-800 dark:text-white text-sm">{selectedEmployee.nama}</span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  (selectedEmployee as any).fingerprint_enrolled_at
                    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'
                    : 'bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
                }`}>
                  {(selectedEmployee as any).fingerprint_enrolled_at ? 'Sudah Terdaftar' : 'Belum Terdaftar'}
                </span>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                NIK: {selectedEmployee.nik || '-'} · Dept: {selectedEmployee.departemen || '-'}
              </p>
              {(selectedEmployee as any).fingerprint_enrolled_at && (
                <p className="text-[11px] text-emerald-600 dark:text-emerald-400">
                  🗓️ Terdaftar pada: {new Date((selectedEmployee as any).fingerprint_enrolled_at).toLocaleDateString('id-ID', {
                    day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'
                  })}
                </p>
              )}
            </div>
          )}

          {/* Progress / Step UI */}
          {isEnrolling && (
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl space-y-3">
              <div className="flex items-center justify-between text-xs font-bold text-blue-700 dark:text-blue-300">
                <span>Registrasi Berlangsung...</span>
                <span>Sampel {currentStep} / 3</span>
              </div>
              
              {/* Step indicator dots */}
              <div className="flex gap-2">
                {[1, 2, 3].map(step => (
                  <div
                    key={step}
                    className={`flex-1 h-2 rounded-full transition-all duration-300 ${
                      step < currentStep
                        ? 'bg-emerald-500'
                        : step === currentStep
                        ? 'bg-blue-600 animate-pulse'
                        : 'bg-gray-200 dark:bg-gray-700'
                    }`}
                  />
                ))}
              </div>

              <p className="text-xs text-blue-600 dark:text-blue-300 font-medium text-center">
                {enrollStatusMsg}
              </p>
            </div>
          )}

          {/* Error Message */}
          {enrollError && (
            <div className="p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-xl text-xs text-red-600 dark:text-red-300">
              ⚠️ {enrollError}
            </div>
          )}

          {/* Success Message */}
          {enrollSuccess && (
            <div className="p-3 bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-800 rounded-xl text-xs text-emerald-700 dark:text-emerald-300">
              ✅ {enrollSuccess}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-2">
            <button
              onClick={handleStartEnrollment}
              disabled={isEnrolling || !selectedEmployeeId || !deviceStatus?.isConnected}
              className="flex-1 py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-xl transition shadow-lg shadow-blue-600/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isEnrolling ? (
                <>
                  <span className="animate-spin inline-block">⟳</span>
                  <span>Merekam Jari ({currentStep}/3)...</span>
                </>
              ) : (
                <>
                  <span>🖐️</span>
                  <span>Mulai Registrasi Jari (3 Sampel)</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Right Column: Daftar Karyawan Terdaftar */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold text-gray-800 dark:text-gray-200">
              2. Status Pendaftaran Karyawan
            </h4>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {employees.filter(e => !!(e as any).fingerprint_enrolled_at || !!(e as any).fingerprint_template).length} dari {employees.length} terdaftar
            </span>
          </div>

          <div className="max-h-80 overflow-y-auto rounded-xl border border-gray-200 dark:border-gray-700 divide-y divide-gray-100 dark:divide-gray-700">
            {employees.length === 0 ? (
              <div className="p-6 text-center text-xs text-gray-400">Tidak ada data karyawan</div>
            ) : (
              employees.map(emp => {
                const isEnrolled = !!(emp as any).fingerprint_enrolled_at || !!(emp as any).fingerprint_template;
                return (
                  <div
                    key={emp.id}
                    className="p-3 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700/40 transition-colors"
                  >
                    <div>
                      <p className="text-xs font-bold text-gray-800 dark:text-gray-200">{emp.nama}</p>
                      <p className="text-[10px] text-gray-400">
                        {emp.jabatan || 'Staf'} {emp.nik ? `· NIK: ${emp.nik}` : ''}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      {isEnrolled ? (
                        <>
                          <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300 text-[10px] font-bold rounded-md">
                            Terdaftar
                          </span>
                          <button
                            onClick={() => handleRemoveFingerprint(emp.id, emp.nama)}
                            className="p-1 text-gray-400 hover:text-red-500 text-xs transition-colors"
                            title="Hapus sidik jari"
                          >
                            🗑️
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => setSelectedEmployeeId(emp.id)}
                          className="px-2.5 py-1 bg-gray-100 hover:bg-blue-50 hover:text-blue-600 text-gray-600 dark:bg-gray-700 dark:text-gray-300 text-[11px] font-semibold rounded-lg transition-colors"
                        >
                          + Daftarkan
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
