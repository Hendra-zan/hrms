import { useCallback } from 'react';
import * as XLSX from 'xlsx';
import { supabase } from '../../services/supabaseClient.ts';
import {
  excelDateToIso,
  toSafeString,
  normalizeStatus,
} from '../../utils/dateUtils.ts';
import {
  getImportField,
  hasMeaningfulImportContent,
  normalizeImportMaritalStatus,
  ImportValidationError,
} from '../../utils/employeeImportUtils.ts';
import {
  isUuid,
  isValidEmail,
  sanitizeInput,
  MAX_FILE_SIZE,
} from './types.ts';

export const useEmployeeImportRowParser = (showError: (title: string, error?: any) => void) => {
  const getField = useCallback(getImportField, []);
  const normalizeMaritalStatus = useCallback(normalizeImportMaritalStatus, []);

  const downloadErrorReport = useCallback((errorRows: ImportValidationError[]) => {
    if (errorRows.length === 0) return;

    const reportRows = errorRows.map((item) => ({
      Baris: item.baris,
      Kategori: item.kategori || 'ERROR',
      Nama: item.nama,
      Email: item.email,
      NIK: item.nik,
      Error: item.error,
    }));

    const worksheet = XLSX.utils.json_to_sheet(reportRows);
    worksheet['!cols'] = [
      { wch: 10 },
      { wch: 12 },
      { wch: 28 },
      { wch: 32 },
      { wch: 18 },
      { wch: 80 },
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Error Import');
    XLSX.writeFile(
      workbook,
      `error_report_import_karyawan_${new Date().toISOString().split('T')[0]}.xlsx`
    );
  }, []);

  const checkSchemaSupport = useCallback(async () => {
    try {
      const nikProbe = await supabase
        .from('employees')
        .select('id,nik')
        .limit(1);
      const supportsNik = !nikProbe.error;

      const extendedProbe = await supabase
        .from('employees')
        .select('id,ktp_number')
        .limit(1);
      const supportsExtendedProfileColumns = !extendedProbe.error;

      if (!supportsNik || !supportsExtendedProfileColumns) {
        throw new Error(
          'Schema database belum lengkap untuk import data karyawan full. Jalankan migration kolom NIK dan data lengkap employees terlebih dahulu.'
        );
      }

      return true;
    } catch (error: any) {
      showError('Schema validation gagal', error);
      throw error;
    }
  }, [showError]);

  const fetchUnits = useCallback(async (): Promise<Map<string, string>> => {
    const { data, error } = await supabase.from('units').select('id, nama');
    if (error || !data) return new Map();
    const map = new Map<string, string>();
    (data as any[]).forEach((u) => {
      const normalizedKey = String(u.nama).toLowerCase().replace(/[^a-z0-9]/g, '');
      map.set(normalizedKey, u.id);
    });
    return map;
  }, []);

  const parseEmployeeRow = useCallback(
    (row: any, _index: number, unitNameMap: Map<string, string>): any | null => {
      if (!hasMeaningfulImportContent(row)) return null;

      const nama = sanitizeInput(toSafeString(getField(row, 'Nama', 'nama')));
      if (!nama) return null;

      const rawEmail = toSafeString(getField(row, 'Email', 'email')).toLowerCase();
      const email = isValidEmail(rawEmail) ? rawEmail : '';
      const nik = toSafeString(getField(row, 'NIK', 'nik'));
      const telepon = sanitizeInput(toSafeString(getField(row, 'Telepon', 'telepon')));
      const birthDate = excelDateToIso(getField(row, 'Tanggal_Lahir', 'TanggalLahir', 'Tanggal Lahir', 'birthDate', 'Birth Date'));
      const hireDate = excelDateToIso(getField(row, 'Tanggal_Masuk', 'TanggalMasuk', 'Tanggal Masuk', 'hireDate', 'Hire Date'));
      const status = normalizeStatus(getField(row, 'Status', 'status'));
      const gajiPokok = Math.max(0, Number(getField(row, 'Gaji_Pokok', 'GajiPokok', 'Gaji Pokok', 'gajiPokok')) || 0);
      const tunjanganProfesi = Math.max(0, Number(getField(row, 'Tunjangan_Profesi', 'TunjanganProfesi', 'Tunjangan Profesi', 'tunjanganProfesi')) || 0);
      const ktpNumber = toSafeString(getField(row, 'KTP', 'KTP_Number', 'ktpNumber'));
      const npwp = toSafeString(getField(row, 'NPWP', 'npwp'));
      const bpjsKesehatan = sanitizeInput(toSafeString(getField(row, 'BPJS_Kesehatan', 'BPJS Kesehatan', 'bpjsKesehatan')));
      const bpjsKetenagakerjaan = sanitizeInput(toSafeString(getField(row, 'BPJS_Ketenagakerjaan', 'BPJS Ketenagakerjaan', 'bpjsKetenagakerjaan')));
      const agama = sanitizeInput(toSafeString(getField(row, 'Agama', 'agama'))) || undefined;
      const jabatan = sanitizeInput(toSafeString(getField(row, 'Jabatan', 'jabatan'))) || undefined;
      const departemen = sanitizeInput(toSafeString(getField(row, 'Departemen', 'departemen'))) || undefined;
      const unitKerjaName = toSafeString(getField(row, 'Unit_Kerja', 'UnitKerja', 'Unit Kerja', 'unitKerjaId', 'unitkerja'));
      const normalizedUnitKey = unitKerjaName.toLowerCase().replace(/[^a-z0-9]/g, '');
      const unitKerjaId = unitNameMap.get(normalizedUnitKey) || (isUuid(unitKerjaName) ? unitKerjaName : null);
      const maritalStatus = normalizeMaritalStatus(getField(row, 'Status_Nikah', 'StatusNikah', 'Status Nikah', 'maritalStatus'));
      const dependents = Math.max(0, Number(getField(row, 'Jumlah_Tanggungan', 'JumlahTanggungan', 'Jumlah Tanggungan', 'dependents')) || 0);
      const addressKtp = sanitizeInput(toSafeString(getField(row, 'Alamat_KTP', 'AlamatKTP', 'Alamat KTP')));
      const addressDomisili = sanitizeInput(toSafeString(getField(row, 'Alamat_Domisili', 'AlamatDomisili', 'Alamat Domisili')));
      const province = sanitizeInput(toSafeString(getField(row, 'Provinsi', 'province')));
      const city = sanitizeInput(toSafeString(getField(row, 'Kota', 'city')));
      const postalCode = toSafeString(getField(row, 'Kode_Pos', 'KodePos', 'Kode Pos', 'postalCode'));
      const bankName = sanitizeInput(toSafeString(getField(row, 'Bank', 'bankName')));
      const accountNumber = sanitizeInput(toSafeString(getField(row, 'No_Rekening', 'NoRekening', 'No Rekening', 'accountNumber')));
      const accountHolder = sanitizeInput(toSafeString(getField(row, 'Nama_Rekening', 'NamaRekening', 'Nama Rekening', 'accountHolder'))) || nama;
      const pinMesin = sanitizeInput(toSafeString(getField(row, 'ID_Mesin', 'IDMesin', 'Id Mesin', 'pin_mesin', 'pinMesin'))) || undefined;

      return {
        nik: nik || null,
        nama,
        email,
        telepon,
        jabatan: jabatan || null,
        departemen: departemen || null,
        birthDate: birthDate || null,
        hireDate: hireDate || null,
        status,
        gajiPokok,
        tunjanganProfesi,
        ktp_number: ktpNumber || null,
        npwp: npwp || null,
        bpjs_kesehatan: bpjsKesehatan || null,
        bpjs_ketenagakerjaan: bpjsKetenagakerjaan || null,
        agama: agama || null,
        unitKerjaId: unitKerjaId || null,
        marital_status: maritalStatus,
        dependents,
        address: addressKtp || addressDomisili || province || city || postalCode ? {
          ktp: addressKtp,
          domisili: addressDomisili,
          province,
          city,
          postalCode,
        } : null,
        bank_account: bankName || accountNumber || accountHolder ? {
          bankName,
          accountNumber,
          accountHolder,
        } : null,
        pin_mesin: pinMesin || null,
      };
    },
    [getField, normalizeMaritalStatus]
  );

  const validateFile = useCallback((file: File): { valid: boolean; error?: string } => {
    if (file.size > MAX_FILE_SIZE) {
      return { valid: false, error: `Ukuran file maksimal 5MB. File Anda ${(file.size / 1024 / 1024).toFixed(2)}MB.` };
    }

    const validTypes = ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.ms-excel'];
    const validExtensions = ['.xlsx', '.xls'];
    const hasValidType = validTypes.includes(file.type);
    const hasValidExtension = validExtensions.some(ext => file.name.toLowerCase().endsWith(ext));

    if (!hasValidType && !hasValidExtension) {
      return { valid: false, error: 'Format file tidak didukung. Gunakan file Excel (.xlsx atau .xls).' };
    }

    return { valid: true };
  }, []);

  return {
    getField,
    normalizeMaritalStatus,
    downloadErrorReport,
    checkSchemaSupport,
    fetchUnits,
    parseEmployeeRow,
    validateFile,
  };
};
