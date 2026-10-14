import {
  Employee,
  Status,
  Compensation,
  Address,
  BankAccount,
} from '../../types.ts';

export type NewEmployeeData = Omit<Employee, 'id' | 'user_id'> & { password?: string };

export interface UseEmployeeFormProps {
  employeeToEdit: Employee | null;
  onSave: (employee: Employee | NewEmployeeData, newPassword?: string) => void;
  currentUserRole: string;
}

export const initialCompensation: Compensation = { gajiPokok: 0, tunjanganProfesi: 0 };
export const initialAddress: Address = { ktp: '', domisili: '', province: '', city: '', postalCode: '' };
export const initialBankAccount: BankAccount = { bankName: '', accountNumber: '', accountHolder: '' };

export const createInitialFormState = (): Employee => ({
  id: '',
  user_id: '',
  nama: '',
  foto: '',
  jabatan: '',
  departemen: '',
  email: '',
  telepon: '',
  hireDate: new Date().toISOString().split('T')[0],
  birthDate: '',
  status: Status.Aktif,
  shift: 'Pagi',
  spesialisasi: '',
  kredensial: '',
  nomorSTR: '',
  tanggalKadaluarsaSTR: '',
  unitKerjaId: '',
  sertifikasi: [],
  kompetensi: [],
  documents: [],
  compensation: initialCompensation,
  sisaCuti: 12,
  role: 'karyawan',
  ktpNumber: '',
  npwp: '',
  bpjsKesehatan: '',
  bpjsKetenagakerjaan: '',
  agama: undefined,
  maritalStatus: 'Single',
  dependents: 0,
  address: initialAddress,
  emergencyContacts: [],
  education: [],
  workHistory: [],
  bankAccount: initialBankAccount,
  pin_mesin: '',
});
