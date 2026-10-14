/**

 * Data Mapping Utilities

 * Convert between database (snake_case) and UI (camelCase) formats

 */



export const mapEmployeeToDatabase = (data: any) => {

  const {

    // camelCase fields — will be converted to snake_case below

    ktpNumber,

    bpjsKesehatan,

    bpjsKetenagakerjaan,

    maritalStatus,

    emergencyContacts,

    workHistory,

    bankAccount,

    isProfileCompleted,

    isVerified,

    verifiedBy,

    verifiedAt,

    isLocked,

    managedUnitId,

    unitKerjaId,

    // UI-only fields — strip before sending to DB

    compensation,

    gaji_pokok: _gaji_pokok,

    tunjangan_profesi: _tunjangan_profesi,

    documents,

    // These snake_case duplicates come from mapEmployeeFromDatabase spread, must be stripped

    // to avoid sending both camelCase AND snake_case versions simultaneously

    ktp_number: _ktp_number,

    bpjs_kesehatan: _bpjs_kesehatan,

    bpjs_ketenagakerjaan: _bpjs_ketenagakerjaan,

    marital_status: _marital_status,

    emergency_contacts: _emergency_contacts,

    work_history: _work_history,

    bank_account: _bank_account,

    is_profile_completed: _is_profile_completed,

    is_verified: _is_verified,

    verified_by: _verified_by,

    verified_at: _verified_at,

    is_locked: _is_locked,

    managed_unit_id: _managed_unit_id,

    unit_kerja_id: _unit_kerja_id,

    ...rest

  } = data;



  const resolvedUnitKerjaId = String(unitKerjaId ?? _unit_kerja_id ?? '').trim() || null;



  return {

    ...rest,

    gajiPokok: compensation?.gajiPokok ?? data.gajiPokok ?? _gaji_pokok ?? null,

    tunjanganProfesi: compensation?.tunjanganProfesi ?? data.tunjanganProfesi ?? _tunjangan_profesi ?? null,

    unitKerjaId: resolvedUnitKerjaId,

    ktp_number: ktpNumber ?? _ktp_number,

    bpjs_kesehatan: bpjsKesehatan ?? _bpjs_kesehatan,

    bpjs_ketenagakerjaan: bpjsKetenagakerjaan ?? _bpjs_ketenagakerjaan,

    marital_status: maritalStatus ?? _marital_status,

    emergency_contacts: emergencyContacts ?? _emergency_contacts,

    work_history: workHistory ?? _work_history,

    bank_account: bankAccount ?? _bank_account,

    is_profile_completed: isProfileCompleted ?? _is_profile_completed,

    is_verified: isVerified ?? _is_verified,

    verified_by: verifiedBy ?? _verified_by,

    verified_at: verifiedAt ?? _verified_at,

    is_locked: isLocked ?? _is_locked,

    managed_unit_id: (managedUnitId ?? _managed_unit_id) || null,

  };

};



export const mapEmployeeFromDatabase = (data: any) => {

  // Always rebuild the compensation nested object from flat DB columns.
  // This ensures the form always receives the correct nested structure
  // regardless of whether data comes from initialization, update, or realtime.
  const gajiPokok = Number(data.gajiPokok ?? data.gaji_pokok ?? data.compensation?.gajiPokok ?? 0);
  const tunjanganProfesi = Number(data.tunjanganProfesi ?? data.tunjangan_profesi ?? data.compensation?.tunjanganProfesi ?? 0);

  return {

    ...data,

    // Always provide the compensation object so the form never sees undefined
    compensation: {
      gajiPokok,
      tunjanganProfesi,
    },

    ktpNumber: data.ktpNumber ?? data.ktp_number,

    bpjsKesehatan: data.bpjsKesehatan ?? data.bpjs_kesehatan,

    bpjsKetenagakerjaan: data.bpjsKetenagakerjaan ?? data.bpjs_ketenagakerjaan,

    maritalStatus: data.maritalStatus ?? data.marital_status,

    emergencyContacts: data.emergencyContacts ?? data.emergency_contacts,

    workHistory: data.workHistory ?? data.work_history,

    bankAccount: data.bankAccount ?? data.bank_account,

    isProfileCompleted: data.isProfileCompleted ?? data.is_profile_completed,

    isVerified: data.isVerified ?? data.is_verified,

    verifiedBy: data.verifiedBy ?? data.verified_by,

    verifiedAt: data.verifiedAt ?? data.verified_at,

    isLocked: data.isLocked ?? data.is_locked,

    managedUnitId: data.managed_unit_id ?? data.managedUnitId,

    unitKerjaId: data.unitKerjaId ?? data.unit_kerja_id,

  };

};



/**

 * Attendance record mapping for handling both camelCase and snake_case column names

 */

export const mapAttendanceRecordToUI = (record: any) => ({

  ...record,

  employeeId: record.employeeId ?? record.employee_id ?? '',

  tanggal: record.tanggal ?? record.date ?? '',

  clockIn: record.clockIn ?? record.check_in ?? '',

  clockOut: record.clockOut ?? record.check_out ?? '',

  location: record.location ?? record.lokasi ?? '',

  latitude: record.latitude ?? record.lat ?? undefined,

  longitude: record.longitude ?? record.lng ?? undefined,

  isLate:

    record.isLate ??

    record.is_late ??

    String(record.status || '').toLowerCase() === 'terlambat',

  overtimeHours: Number(record.overtimeHours ?? record.overtime_hours ?? 0),

  status: record.status ?? record.status ?? undefined,

  source: record.source ?? undefined,

  notes: record.notes ?? undefined,

  photoUrl: record.photoUrl ?? record.photo_url ?? undefined,

  deviceId: record.deviceId ?? record.device_id ?? undefined,

  biometricType: record.biometricType ?? record.biometric_type ?? undefined,

  biometricVerified: record.biometricVerified ?? record.biometric_verified ?? undefined,

  faceMatchScoreCheckIn: record.faceMatchScoreCheckIn ?? record.face_match_score_check_in ?? undefined,

  faceMatchScoreCheckOut: record.faceMatchScoreCheckOut ?? record.face_match_score_check_out ?? undefined,

  checkOutLatitude: record.checkOutLatitude ?? record.check_out_latitude ?? undefined,

  checkOutLongitude: record.checkOutLongitude ?? record.check_out_longitude ?? undefined,

  checkOutLocation: record.checkOutLocation ?? record.check_out_location ?? undefined,

  earlyLeaveReason: record.earlyLeaveReason ?? record.early_leave_reason ?? undefined,

  dailyWorkLog: record.dailyWorkLog ?? record.daily_work_log ?? undefined,

  shiftHandoverConfirmed: record.shiftHandoverConfirmed ?? record.shift_handover_confirmed ?? false,

  extra_taps: record.extra_taps ?? record.extraTaps ?? undefined,

});



export const sortAttendanceByDateDesc = (records: any[]) => {

  return [...records].sort(

    (a, b) =>

      new Date(b.tanggal || 0).getTime() - new Date(a.tanggal || 0).getTime()

  );

};

export const mapPayslipToDatabase = (payslip: any): any => {
  return {
    id: payslip.id,
    employee_id: payslip.employeeId,
    periode: payslip.periode,
    gaji_pokok: payslip.gajiPokok,
    tunjangan_profesi: payslip.tunjanganProfesi,
    upah_lembur: payslip.upahLembur,
    total_pendapatan: payslip.totalPendapatan,
    potongan_pph21: payslip.potonganPPh21,
    potongan_bpjs: payslip.potonganBPJS,
    potongan_bpjs_kesehatan: payslip.potonganBPJSKesehatan ?? payslip.potonganBPJS ?? 0,
    potongan_bpjs_ketenagakerjaan: payslip.potonganBPJSKetenagakerjaan ?? 0,
    potongan_jht: payslip.potonganJHT ?? 0,
    potongan_jp: payslip.potonganJP ?? 0,
    total_potongan: payslip.totalPotongan,
    gaji_bersih: payslip.gajiBersih,
  };
};

export const mapPayslipFromDatabase = (data: any): any => {
  return {
    id: data.id,
    employeeId: data.employee_id,
    periode: data.periode,
    gajiPokok: Number(data.gaji_pokok || 0),
    tunjanganProfesi: Number(data.tunjangan_profesi || 0),
    upahLembur: Number(data.upah_lembur || 0),
    totalPendapatan: Number(data.total_pendapatan || 0),
    potonganPPh21: Number(data.potongan_pph21 || 0),
    potonganBPJS: Number(data.potongan_bpjs || 0),
    potonganBPJSKesehatan: Number(data.potongan_bpjs_kesehatan || 0),
    potonganBPJSKetenagakerjaan: Number(data.potongan_bpjs_ketenagakerjaan || 0),
    potonganJHT: Number(data.potongan_jht || 0),
    potonganJP: Number(data.potongan_jp || 0),
    totalPotongan: Number(data.total_potongan || 0),
    gajiBersih: Number(data.gaji_bersih || 0),
  };
};


