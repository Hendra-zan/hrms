import { supabase } from '../config/supabase';

let _useSnakeCase: boolean | null = null;

export const dbSchemaService = {
  /**
   * Mengembalikan true jika skema database menggunakan snake_case,
   * false jika menggunakan camelCase. Menyimpan hasil deteksi di memori.
   */
  async useSnakeCase(): Promise<boolean> {
    if (_useSnakeCase !== null) {
      return _useSnakeCase;
    }

    try {
      // Deteksi secara asinkron satu kali dengan select kolom employee_id (snake_case)
      const { error } = await supabase.from('attendance').select('employee_id').limit(1);
      _useSnakeCase = !error;
    } catch {
      _useSnakeCase = false;
    }

    console.log(`[dbSchemaService] Detected schema style: ${_useSnakeCase ? 'snake_case' : 'camelCase'}`);
    return _useSnakeCase;
  },

  setUseSnakeCase(value: boolean) {
    _useSnakeCase = value;
  }
};
