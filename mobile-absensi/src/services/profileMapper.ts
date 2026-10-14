import type { MobileUser } from '../types';

export function mapEmployeeRowToMobileUser(employee: any, authEmail?: string, authId?: string): MobileUser {
  return {
    id: String(employee.id || authId || ''),
    userId: String(employee.user_id || authId || ''),
    employeeId: String(employee.id || ''),
    nik: employee.nik || undefined,
    email: employee.email || authEmail || '',
    name: employee.nama || authEmail || 'Karyawan',
    role: employee.role || 'karyawan',
    jabatan: employee.jabatan || undefined,
    departemen: employee.departemen || undefined,
    unitName: employee.units?.nama || employee.unitKerjaId || employee.managed_unit_id || employee.managedUnitId || undefined,
    shift: employee.shift || undefined,
    status: employee.status || undefined,
    sisaCuti:
      typeof employee.sisaCuti === 'number'
        ? employee.sisaCuti
        : typeof employee.sisa_cuti === 'number'
        ? employee.sisa_cuti
        : undefined,
    telepon: employee.telepon || employee.phone || undefined,
    foto: employee.foto || employee.foto_url || employee.photo_url || undefined,
    managedUnitId: employee.managed_unit_id || employee.managedUnitId || undefined,
  };
}
