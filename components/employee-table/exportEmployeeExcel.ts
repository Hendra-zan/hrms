import * as XLSX from 'xlsx';
import { Employee, WorkUnit } from '../../types.ts';
import { EMPLOYEE_XLSX_COL_WIDTHS, EMPLOYEE_XLSX_HEADERS } from '../../services/excelTemplateService.ts';

export function exportEmployeesToExcel(employees: Employee[], workUnits: WorkUnit[]): void {
  const data = employees.map(emp => {
    const raw = emp as any;
    const address = emp.address || raw.address || {};
    const bankAccount = emp.bankAccount || raw.bank_account || {};

    return {
      NIK: emp.nik || raw.nik || '',
      Nama: emp.nama || '',
      Email: emp.email || '',
      Telepon: emp.telepon || '',
      Tanggal_Lahir: emp.birthDate || raw.birthDate || '',
      Jabatan: emp.jabatan || '',
      Departemen: emp.departemen || '',
      Unit_Kerja: workUnits.find(u => u.id === (emp.unitKerjaId || raw.unitKerjaId))?.nama || emp.unitKerjaId || raw.unitKerjaId || '',
      Status: emp.status || 'Aktif',
      Tanggal_Masuk: emp.hireDate ? new Date(emp.hireDate).toISOString().split('T')[0] : '',
      Gaji_Pokok: emp.compensation?.gajiPokok ?? raw.gajiPokok ?? 0,
      Tunjangan_Profesi: emp.compensation?.tunjanganProfesi ?? raw.tunjanganProfesi ?? 0,
      KTP: emp.ktpNumber || raw.ktp_number || '',
      NPWP: emp.npwp || raw.npwp || '',
      BPJS_Kesehatan: emp.bpjsKesehatan || raw.bpjs_kesehatan || '',
      BPJS_Ketenagakerjaan: emp.bpjsKetenagakerjaan || raw.bpjs_ketenagakerjaan || '',
      Agama: emp.agama || raw.agama || '',
      Status_Nikah: emp.maritalStatus || raw.marital_status || 'Single',
      Jumlah_Tanggungan: emp.dependents ?? raw.dependents ?? 0,
      Alamat_KTP: address.ktp || '',
      Alamat_Domisili: address.domisili || '',
      Provinsi: address.province || '',
      Kota: address.city || '',
      Kode_Pos: address.postalCode || '',
      Bank: bankAccount.bankName || '',
      No_Rekening: bankAccount.accountNumber || '',
      Nama_Rekening: bankAccount.accountHolder || emp.nama || '',
      ID_Mesin: emp.pin_mesin || raw.pin_mesin || raw.pinMesin || '',
    };
  });

  const worksheet = XLSX.utils.json_to_sheet(data, { header: [...EMPLOYEE_XLSX_HEADERS] });
  worksheet['!cols'] = EMPLOYEE_XLSX_COL_WIDTHS;
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Template Karyawan');
  XLSX.writeFile(workbook, `data_karyawan_${new Date().toISOString().split('T')[0]}.xlsx`);
}
