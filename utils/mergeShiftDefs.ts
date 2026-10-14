/**
 * utils/mergeShiftDefs.ts
 *
 * Helper untuk menggabungkan definisi shift dari dua sumber:
 * - Global: system_settings.default_shifts
 * - Unit:   units.shifts (ditetapkan Kepala Ruangan)
 *
 * Aturan merge: Unit shift OVERRIDE global shift jika nama sama (case-insensitive).
 * Ini memastikan aturan Kepala Ruangan selalu lebih prioritas.
 *
 * Digunakan oleh:
 *   - hooks/useViewRenderer.tsx (AttendanceManagement HRD mode normal & report)
 *   - components/EmployeeSelfService.tsx (ESS per-karyawan)
 *   - hooks/useESSAttendance.ts
 */

import { ShiftDefinition, DEFAULT_SHIFT_DEFINITIONS } from '../types';

// ── MERGE DUA SOURCE ──────────────────────────────────────────────────────────

/**
 * Merge global shifts + unit-specific shifts.
 * Unit shifts override global shifts jika nama (case-insensitive) sama.
 *
 * @param globalShifts  Dari system_settings.default_shifts
 * @param unitShifts    Dari units.shifts unit karyawan
 * @returns Array merged, unit shifts lebih prioritas
 */
export function mergeShiftDefs(
  globalShifts?: ShiftDefinition[] | null,
  unitShifts?: ShiftDefinition[] | null,
): ShiftDefinition[] {
  const base = (globalShifts && globalShifts.length > 0)
    ? globalShifts
    : DEFAULT_SHIFT_DEFINITIONS;

  if (!unitShifts || unitShifts.length === 0) return base;

  // Map berdasarkan nama lowercase agar case-insensitive
  const resultMap = new Map(base.map(s => [s.name.toLowerCase().trim(), s]));

  // Unit shifts override global (atau tambah jika nama baru)
  unitShifts.forEach(s => {
    resultMap.set(s.name.toLowerCase().trim(), s);
  });

  return [...resultMap.values()];
}

// ── MERGE SEMUA UNIT (UNTUK HRD ADMIN) ───────────────────────────────────────

/**
 * Merge global shifts + shifts dari SEMUA unit kerja.
 * Digunakan oleh AttendanceManagement (HRD) yang perlu mengenal semua shift
 * dari semua unit dalam satu tampilan.
 *
 * Jika ada nama shift yang sama antar unit, shift yang pertama ditemukan menang.
 * (Bisa diubah ke "unit terakhir menang" jika perlu)
 *
 * @param workUnits    Array unit kerja (masing-masing punya opsional .shifts)
 * @param globalShifts Dari system_settings.default_shifts
 * @returns Array merged semua shift (global + semua unit, deduplicated by name)
 */
export function mergeAllUnitShiftDefs(
  workUnits: Array<{ shifts?: ShiftDefinition[] | null; name?: string }>,
  globalShifts?: ShiftDefinition[] | null,
): ShiftDefinition[] {
  const base = (globalShifts && globalShifts.length > 0)
    ? globalShifts
    : DEFAULT_SHIFT_DEFINITIONS;

  const names = new Set(base.map(s => s.name.toLowerCase().trim()));
  const extra: ShiftDefinition[] = [];

  workUnits.forEach(unit => {
    (unit.shifts || []).forEach(s => {
      const key = s.name.toLowerCase().trim();
      if (!names.has(key)) {
        names.add(key);
        extra.push(s);
      }
    });
  });

  return [...base, ...extra];
}

// ── LOOKUP SHIFT DEF ──────────────────────────────────────────────────────────

/**
 * Cari ShiftDefinition berdasarkan nama (case-insensitive + normalisasi spasi).
 * Prioritas: unit-specific shifts > global shifts.
 *
 * @param shiftName    Nama shift yang dicari (dari employee_schedules.shift_name)
 * @param allShiftDefs Array gabungan hasil mergeShiftDefs / mergeAllUnitShiftDefs
 * @returns ShiftDefinition atau undefined jika tidak ditemukan
 */
export function findShiftDef(
  shiftName: string | null | undefined,
  allShiftDefs: ShiftDefinition[],
): ShiftDefinition | undefined {
  if (!shiftName) return undefined;
  const needle = shiftName.toLowerCase().trim();
  return allShiftDefs.find(s => s.name.toLowerCase().trim() === needle);
}
