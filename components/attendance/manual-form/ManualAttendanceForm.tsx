import React from 'react';
import { ManualAttendanceFormProps } from './types.ts';
import { useManualAttendanceFormState } from './useManualAttendanceFormState.ts';
import { ManualAttendanceFormFields } from './ManualAttendanceFormFields.tsx';
import { UareUFingerprintModal } from '../../UareUFingerprintModal.tsx';
import { ClockIcon } from '../../icons.tsx';

export const ManualAttendanceForm: React.FC<ManualAttendanceFormProps> = ({
  employees,
  canManageAttendance,
  onSave,
  loadPendingRequests,
  calculateAttendanceDetails,
  isGeofenceConfigured,
  officeLat,
  officeLng,
  officeRadiusMeters,
}) => {
  const state = useManualAttendanceFormState({
    employees,
    isGeofenceConfigured,
    officeLat,
    officeLng,
    officeRadiusMeters,
    onSave,
    calculateAttendanceDetails,
  });

  const selectedEmployee = employees.find(emp => emp.id === state.newRecord.employeeId);

  return (
    <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-gray-200 dark:border-slate-700 mb-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="p-2 bg-teal-50 dark:bg-teal-950/60 text-[#06736a] dark:text-teal-400 rounded-xl">
            <ClockIcon className="w-5 h-5" />
          </span>
          <div>
            <h3 className="text-base font-bold text-gray-900 dark:text-slate-100">
              Input Presensi Manual
            </h3>
            <p className="text-xs text-gray-500 dark:text-slate-400">
              Catat atau sesuaikan presensi masuk/pulang karyawan
            </p>
          </div>
        </div>
      </div>

      <ManualAttendanceFormFields
        employees={employees}
        newRecord={state.newRecord}
        setNewRecord={state.setNewRecord}
        isLocating={state.isLocating}
        fingerprintVerified={state.fingerprintVerified}
        setCurrentTime={state.setCurrentTime}
        setFingerprintModal={state.setFingerprintModal}
        handleUseCurrentLocation={state.handleUseCurrentLocation}
        isSaving={state.isSaving}
        handleSaveAttendance={state.handleSaveAttendance}
      />

      {/* UareU Fingerprint Modal */}
      {state.fingerprintModal.isOpen && selectedEmployee && (
        <UareUFingerprintModal
          isOpen={state.fingerprintModal.isOpen}
          onClose={() => state.setFingerprintModal({ isOpen: false, targetField: 'clockIn' })}
          employee={selectedEmployee}
          mode="verify"
          onSuccess={state.handleFingerprintSuccess}
        />
      )}
    </div>
  );
};
