import { supabase } from '../supabaseClient.ts';
import logger from '../logger.ts';
import {
  HikvisionConfig,
  HikvisionAttendanceEvent,
  HikvisionSyncResult,
  getHikvisionConfig,
} from './types.ts';
import {
  fetchEmployeeShiftParams,
  computeIsLate,
  computeFullAttendanceSummary,
  resolveNightShiftDate,
} from '../../utils/shiftParamsResolver.ts';
import { resolveEmployeeId } from './employeeMapping.ts';

export async function syncAttendanceToSupabase(
  events: HikvisionAttendanceEvent[],
  config: HikvisionConfig
): Promise<{ synced: number; failed: number; errors: string[] }> {
  let synced = 0;
  let failed = 0;
  const errors: string[] = [];

  for (const event of events) {
    if (!event.employeeNoString) continue;

    try {
      const employeeId = await resolveEmployeeId(event.employeeNoString);
      if (!employeeId) {
        failed++;
        errors.push(`[NIK: ${event.employeeNoString}] Karyawan tidak ditemukan di HRMS Pro. Pastikan NIK di device sama dengan field NIK di data karyawan.`);
        continue;
      }

      const dt = new Date(event.time);
      const eventHhmm = `${String(dt.getHours()).padStart(2, '0')}:${String(dt.getMinutes()).padStart(2, '0')}`;
      const tanggal = dt.toISOString().split('T')[0];
      const matchScore = typeof event.matchScore === 'number' ? event.matchScore / 100 : null;
      const isCheckOut = event.type === 'checkOut';

      const { data: existing } = await (supabase as any)
        .from('attendance')
        .select('id, clockIn, clockOut, extra_taps, isLate, is_late, status')
        .eq('employeeId', employeeId)
        .eq('tanggal', tanggal)
        .maybeSingle();

      if (existing && existing.clockIn && existing.clockOut) {
        const direction = isCheckOut ? 'Out' : 'In';
        const tapInfo = `${eventHhmm} (${direction})`;
        let newExtraTaps = existing.extra_taps || '';
        if (!newExtraTaps.includes(tapInfo)) {
          newExtraTaps = newExtraTaps ? `${newExtraTaps}, ${tapInfo}` : tapInfo;
          await (supabase as any)
            .from('attendance')
            .update({ extra_taps: newExtraTaps })
            .eq('id', existing.id);
        }
      } else if (existing && existing.clockIn && !existing.clockOut) {
        const [inH, inM] = String(existing.clockIn).split(':').map(Number);
        const [curH, curM] = eventHhmm.split(':').map(Number);
        let gapMinutes = (curH * 60 + curM) - (inH * 60 + inM);
        if (gapMinutes < 0) gapMinutes += 24 * 60;

        if (gapMinutes < 30) {
          const tapInfo = `${eventHhmm} (Tap Ulang Masuk)`;
          let newExtraTaps = existing.extra_taps || '';
          if (!newExtraTaps.includes(tapInfo)) {
            newExtraTaps = newExtraTaps ? `${newExtraTaps}, ${tapInfo}` : tapInfo;
            await (supabase as any)
              .from('attendance')
              .update({ extra_taps: newExtraTaps })
              .eq('id', existing.id);
          }
        } else {
          const shiftParams = await fetchEmployeeShiftParams(supabase, employeeId, tanggal, existing.clockIn);
          const summary = computeFullAttendanceSummary(existing.clockIn, eventHhmm, shiftParams);

          const { error } = await (supabase as any)
            .from('attendance')
            .update({
              clockOut: eventHhmm,
              isLate: summary.isLate,
              overtimeHours: summary.overtimeHours,
              status: summary.status,
              face_match_score_check_out: matchScore,
            })
            .eq('id', existing.id);

          if (error) throw error;
        }
      } else {
        const isEarlyMorning = dt.getHours() < 8;
        let resolvedByPrevDay = false;

        if (isEarlyMorning || isCheckOut) {
          const { shouldCheckPrevDay, prevDate } = resolveNightShiftDate(tanggal, eventHhmm);
          const checkDate = shouldCheckPrevDay ? prevDate : (() => {
            const d = new Date(dt);
            d.setDate(d.getDate() - 1);
            return d.toISOString().split('T')[0];
          })();

          const { data: prevExisting } = await (supabase as any)
            .from('attendance')
            .select('id, clockIn, clockOut, extra_taps')
            .eq('employeeId', employeeId)
            .eq('tanggal', checkDate)
            .maybeSingle();

          if (prevExisting && prevExisting.clockIn && !prevExisting.clockOut) {
            const [pInH, pInM] = String(prevExisting.clockIn).split(':').map(Number);
            const [curH, curM] = eventHhmm.split(':').map(Number);
            let gapMinutes = (curH * 60 + curM) - (pInH * 60 + pInM);
            if (gapMinutes < 0) gapMinutes += 24 * 60;

            if (gapMinutes >= 30) {
              const prevShiftParams = await fetchEmployeeShiftParams(supabase, employeeId, checkDate, prevExisting.clockIn);
              const summary = computeFullAttendanceSummary(prevExisting.clockIn, eventHhmm, prevShiftParams);

              const { error } = await (supabase as any)
                .from('attendance')
                .update({
                  clockOut: eventHhmm,
                  isLate: summary.isLate,
                  overtimeHours: summary.overtimeHours,
                  status: summary.status,
                  face_match_score_check_out: matchScore,
                })
                .eq('id', prevExisting.id);

              if (error) throw error;
              resolvedByPrevDay = true;
            }
          }
        }

        if (!resolvedByPrevDay) {
          if (isCheckOut) {
            await (supabase as any)
              .from('attendance')
              .update({
                clockOut: eventHhmm,
                face_match_score_check_out: matchScore,
              })
              .eq('employeeId', employeeId)
              .eq('tanggal', tanggal);
          } else {
            const shiftParams = await fetchEmployeeShiftParams(supabase, employeeId, tanggal, eventHhmm);
            const { isLate } = computeIsLate(eventHhmm, shiftParams.shiftStart, shiftParams.toleranceMinutes);
            const status = isLate ? 'Terlambat' : 'Hadir';

            const record = {
              employeeId,
              tanggal,
              clockIn: eventHhmm,
              clockOut: null,
              location: config.deviceLocation,
              isLate,
              overtimeHours: 0,
              status,
              source: 'web-admin',
              deviceId: null,
              biometric_type: 'face',
              biometricVerified: true,
              face_match_score_check_in: matchScore,
              face_match_score_check_out: null,
              notes: `Absensi dari device Hikvision (${event.verifyMode})`,
            };

            const { error } = await (supabase as any)
              .from('attendance')
              .upsert(record, { onConflict: 'employeeId,tanggal' });

            if (error) throw error;
          }
        }
      }

      synced++;
    } catch (err: unknown) {
      failed++;
      const msg = err instanceof Error ? err.message : String(err);
      errors.push(`[${event.employeeNoString}] ${msg}`);
      logger.error('Hikvision sync error', err);
    }
  }

  return { synced, failed, errors };
}

export async function runHikvisionSync(
  config?: HikvisionConfig,
  hoursBack = 24
): Promise<HikvisionSyncResult> {
  const cfg = config ?? getHikvisionConfig();

  if (!cfg.syncEnabled || !cfg.ip) {
    return {
      success: false,
      synced: 0,
      failed: 0,
      errors: ['Hikvision sync disabled or device IP not configured'],
      lastSyncTime: new Date().toISOString(),
    };
  }

  try {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    const token = session?.access_token;

    const response = await fetch('/api/hikvision/sync', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token || ''}`,
      },
      body: JSON.stringify({ config: cfg, hoursBack }),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data?.error || `HTTP ${response.status}: ${response.statusText}`);
    }

    return {
      success: data.success,
      synced: data.synced || 0,
      failed: data.failed || 0,
      errors: data.errors || [],
      lastSyncTime: new Date().toISOString(),
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return {
      success: false,
      synced: 0,
      failed: 0,
      errors: [msg],
      lastSyncTime: new Date().toISOString(),
    };
  }
}

let syncTimer: ReturnType<typeof setInterval> | null = null;

export function startHikvisionAutoSync(
  onResult?: (result: HikvisionSyncResult) => void
): void {
  const cfg = getHikvisionConfig();
  if (!cfg.syncEnabled || !cfg.ip) {
    logger.warn('[Hikvision] Auto-sync skipped: not configured');
    return;
  }

  if (syncTimer) return;

  const intervalMs = cfg.syncIntervalMinutes * 60 * 1000;
  logger.info(`[Hikvision] Auto-sync started`, { intervalMin: cfg.syncIntervalMinutes });

  syncTimer = setInterval(async () => {
    logger.debug('[Hikvision] Running scheduled sync...');
    const result = await runHikvisionSync(cfg, 1);
    logger.debug('[Hikvision] Sync result', { synced: result.synced, failed: result.failed });
    onResult?.(result);
  }, intervalMs);
}

export function stopHikvisionAutoSync(): void {
  if (syncTimer) {
    clearInterval(syncTimer);
    syncTimer = null;
    logger.info('[Hikvision] Auto-sync stopped');
  }
}
