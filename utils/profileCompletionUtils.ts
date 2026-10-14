import { Employee } from '../types';

export interface ProfileCompletionResult {
  percentage: number;
  completedCount: number;
  totalCount: number;
  missingFields: string[];
}

export const calculateProfileCompletion = (user?: Employee | null): ProfileCompletionResult => {
  if (!user) {
    return { percentage: 0, completedCount: 0, totalCount: 12, missingFields: [] };
  }

  const fields = [
    { name: 'NIK', value: user.nik },
    { name: 'No. KTP', value: user.ktpNumber },
    { name: 'NPWP', value: user.npwp },
    { name: 'No. Telepon / WA', value: user.telepon },
    { name: 'Tanggal Lahir', value: user.birthDate },
    { name: 'Agama', value: user.agama },
    { name: 'Status Pernikahan', value: user.maritalStatus },
    { name: 'BPJS Kesehatan', value: user.bpjsKesehatan },
    { name: 'BPJS Ketenagakerjaan', value: user.bpjsKetenagakerjaan },
    { name: 'No. Rekening Bank', value: user.bankAccount?.accountNumber },
    { name: 'Nama Bank', value: user.bankAccount?.bankName },
    { name: 'Alamat KTP', value: user.address?.ktp },
  ];

  let completedCount = 0;
  const missingFields: string[] = [];

  for (const field of fields) {
    if (field.value && String(field.value).trim() !== '') {
      completedCount++;
    } else {
      missingFields.push(field.name);
    }
  }

  const totalCount = fields.length;
  const percentage = Math.round((completedCount / totalCount) * 100);

  return {
    percentage,
    completedCount,
    totalCount,
    missingFields,
  };
};
