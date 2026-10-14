import { supabase } from '../config/supabase';
import { secureStorage } from '../lib/storage';
import type { Payslip } from '../types';

const STORAGE_KEY_PREFIX = 'hrms_cache_payslips_';

function mapPayslipFromDatabase(data: any): Payslip {
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
}

export const payslipService = {
  /**
   * Mengambil riwayat slip gaji untuk karyawan tertentu.
   * Jika online, mengambil dari Supabase lalu memperbarui cache lokal.
   * Jika offline, memuat data dari cache lokal.
   */
  async getEmployeePayslips(employeeId: string): Promise<{ data: Payslip[]; isOffline: boolean }> {
    const storageKey = `${STORAGE_KEY_PREFIX}${employeeId}`;
    
    try {
      // Ambil dari database Supabase
      const { data, error } = await supabase
        .from('payslips')
        .select('*')
        .eq('employee_id', employeeId)
        .order('periode', { ascending: false });

      if (error) {
        throw error;
      }

      const mappedData = (data || []).map(mapPayslipFromDatabase);
      
      // Update cache lokal secara asinkron
      void secureStorage.setJSON(storageKey, mappedData);

      return { data: mappedData, isOffline: false };
    } catch (err) {
      console.warn('[payslipService] Gagal memuat dari server, mencoba memuat dari cache lokal:', err);
      
      // Load dari cache lokal jika terjadi error koneksi
      const cached = await secureStorage.getJSON<Payslip[] | null>(storageKey, null);
      if (cached) {
        return { data: cached, isOffline: true };
      }
      
      // Jika benar-benar tidak ada data cache, lemparkan error atau kembalikan data kosong
      return { data: [], isOffline: true };
    }
  }
};
