import { supabase } from './supabaseClient';
import logger from './logger.ts';

// Generate NIK otomatis dengan format: YYMMUUJJNNN (11 digit angka)
export const generateNIK = async (unitKerjaId: string, jabatan: string, hireDate: string): Promise<string> => {
    try {
        // Ambil tahun dan bulan dari hire date
        const dateObj = new Date(hireDate);
        const year = dateObj.getFullYear().toString().slice(-2); // 2 digit tahun
        const month = (dateObj.getMonth() + 1).toString().padStart(2, '0'); // 2 digit bulan
        
        // Dapatkan kode unit dari tabel units berdasarkan ID (unitKerjaId)
        const { data: unitData, error: unitError } = await supabase
            .from('units')
            .select('kode')
            .eq('id', unitKerjaId)
            .maybeSingle();
            
        if (unitError) {
            logger.error('Error fetching unit code', unitError);
        }
        const unitCode = unitData?.kode || '00';
        
        // Dapatkan kode jabatan dari tabel positions berdasarkan nama
        const { data: posData, error: posError } = await supabase
            .from('positions')
            .select('kode')
            .eq('nama', jabatan)
            .maybeSingle();
            
        if (posError) {
            logger.error('Error fetching position code', posError);
        }
        const posCode = posData?.kode || '00';
        
        const prefix = `${year}${month}${unitCode}${posCode}`;
        
        // Cari NIK terakhir dengan pattern prefix% (YYMMUUJJ%)
        const { data: existingEmployees, error } = await supabase
            .from('employees')
            .select('nik')
            .like('nik', `${prefix}%`)
            .order('nik', { ascending: false })
            .limit(1);
        
        if (error) {
            logger.error('Error fetching existing NIKs', error);
            return `${prefix}001`;
        }
        
        // Hitung urutan berikutnya
        let nextNumber = 1;
        if (existingEmployees && existingEmployees.length > 0 && existingEmployees[0].nik) {
            const lastNIK = existingEmployees[0].nik;
            if (lastNIK.length === 11 && lastNIK.startsWith(prefix)) {
                const lastNumberStr = lastNIK.substring(8);
                const lastNumber = parseInt(lastNumberStr, 10);
                if (!isNaN(lastNumber)) {
                    nextNumber = lastNumber + 1;
                }
            }
        }
        
        // Format dengan leading zeros (3 digit)
        const sequence = nextNumber.toString().padStart(3, '0');
        
        return `${prefix}${sequence}`;
        
    } catch (error) {
        logger.error('Error generating NIK', error);
        // Fallback jika ada error
        const dateObj = new Date(hireDate);
        const year = dateObj.getFullYear().toString().slice(-2);
        const month = (dateObj.getMonth() + 1).toString().padStart(2, '0');
        return `${year}${month}0000001`;
    }
};

// Validasi format NIK (11 digit angka)
export const validateNIK = (nik: string): boolean => {
    const nikPattern = /^\d{11}$/;
    return nikPattern.test(nik);
};

// Cek apakah NIK sudah ada (untuk validasi uniqueness)
export const isNIKUnique = async (nik: string, excludeEmployeeId?: string): Promise<boolean> => {
    try {
        let query = supabase
            .from('employees')
            .select('id')
            .eq('nik', nik);
        
        if (excludeEmployeeId) {
            query = query.neq('id', excludeEmployeeId);
        }
        
        const { data, error } = await query;
        
        if (error) {
            logger.error('Error checking NIK uniqueness', error);
            return false;
        }
        
        return !data || data.length === 0;
    } catch (error) {
        logger.error('Error in isNIKUnique', error);
        return false;
    }
};

// Cek apakah ID/PIN Mesin sudah ada (untuk validasi uniqueness)
export const isPinMesinUnique = async (pinMesin: string, excludeEmployeeId?: string): Promise<boolean> => {
    const trimmed = (pinMesin || '').trim();
    if (!trimmed) return true;
    try {
        let query = supabase
            .from('employees')
            .select('id')
            .eq('pin_mesin', trimmed);
        
        if (excludeEmployeeId) {
            query = query.neq('id', excludeEmployeeId);
        }
        
        const { data, error } = await query;
        
        if (error) {
            logger.error('Error checking PIN Mesin uniqueness', error);
            return false;
        }
        
        return !data || data.length === 0;
    } catch (error) {
        logger.error('Error in isPinMesinUnique', error);
        return false;
    }
};

