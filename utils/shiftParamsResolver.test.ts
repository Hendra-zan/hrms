import { describe, expect, it } from 'vitest';
import {
  computeIsLate,
  computeOvertimeHours,
  computeEarlyLeaveMinutes,
  resolveNightShiftDate,
  computeFullAttendanceSummary,
} from './shiftParamsResolver';
import { mergeShiftDefs, findShiftDef } from './mergeShiftDefs';

describe('shiftParamsResolver & mergeShiftDefs', () => {
  describe('resolveNightShiftDate (Task A2)', () => {
    it('detects early morning check-in (e.g. 00:15) and calculates previous date', () => {
      const result = resolveNightShiftDate('2026-08-30', '00:15');
      expect(result.shouldCheckPrevDay).toBe(true);
      expect(result.prevDate).toBe('2026-08-29');
    });

    it('detects early morning check-in at 05:30 as potential night shift completion', () => {
      const result = resolveNightShiftDate('2026-08-30', '05:30');
      expect(result.shouldCheckPrevDay).toBe(true);
      expect(result.prevDate).toBe('2026-08-29');
    });

    it('does not flag normal morning check-in (07:30) as previous day', () => {
      const result = resolveNightShiftDate('2026-08-30', '07:30');
      expect(result.shouldCheckPrevDay).toBe(false);
    });
  });

  describe('computeIsLate (Task A1 & A2)', () => {
    it('accurately evaluates unit tolerance (5 mins IGD) -> late at 6 mins', () => {
      const onTime = computeIsLate('07:05', '07:00', 5);
      expect(onTime.isLate).toBe(false);
      expect(onTime.lateMinutes).toBe(0);

      const late = computeIsLate('07:06', '07:00', 5);
      expect(late.isLate).toBe(true);
      expect(late.lateMinutes).toBe(1);
    });

    it('accurately evaluates global tolerance (15 mins) -> on time at 14 mins, late at 16 mins', () => {
      const onTime = computeIsLate('08:14', '08:00', 15);
      expect(onTime.isLate).toBe(false);

      const late = computeIsLate('08:16', '08:00', 15);
      expect(late.isLate).toBe(true);
      expect(late.lateMinutes).toBe(1);
    });

    it('correctly handles night shift cross-midnight check-in (shift 21:00, in at 00:15)', () => {
      // 21:00 with 15 mins tolerance: cutoff is 21:15.
      // Clock in at 00:15 (next morning) = 3 hours and 15 mins after shift start (late)
      const late = computeIsLate('00:15', '21:00', 15);
      expect(late.isLate).toBe(true);
      expect(late.lateMinutes).toBe(180); // 3 hours late
    });

    it('returns false for empty or missing times', () => {
      expect(computeIsLate('', '08:00', 15).isLate).toBe(false);
      expect(computeIsLate('08:00', '', 15).isLate).toBe(false);
    });
  });

  describe('computeOvertimeHours', () => {
    it('calculates regular overtime correctly', () => {
      // Shift 08:00 to 16:00 (8h). In at 08:00, out at 18:00 (10h) -> 2h overtime
      const ot = computeOvertimeHours('08:00', '18:00', '08:00', '16:00', 0, 0);
      expect(ot).toBe(2.0);
    });

    it('accounts for break duration', () => {
      // Shift 08:00 to 16:00 (8h). In at 08:00, out at 18:00 (10h - 60min break = 9h net) -> 1h overtime
      const ot = computeOvertimeHours('08:00', '18:00', '08:00', '16:00', 60, 0);
      expect(ot).toBe(1.0);
    });

    it('respects auto-overtime threshold (e.g. 30 mins minimum)', () => {
      // Extra 20 mins (< 30 min threshold) -> 0 OT
      const underThreshold = computeOvertimeHours('08:00', '16:20', '08:00', '16:00', 0, 30);
      expect(underThreshold).toBe(0);

      // Extra 45 mins (>= 30 min threshold) -> 0.75h OT
      const overThreshold = computeOvertimeHours('08:00', '16:45', '08:00', '16:00', 0, 30);
      expect(overThreshold).toBe(0.75);
    });

    it('handles overnight shift overtime (21:00 to 05:00, out at 07:00 -> 2h OT)', () => {
      const ot = computeOvertimeHours('21:00', '07:00', '21:00', '05:00', 0, 0);
      expect(ot).toBe(2.0);
    });
  });

  describe('computeEarlyLeaveMinutes (Task C2)', () => {
    it('detects early leave when clockOut is before shiftEnd', () => {
      // Shift ends at 16:00, leaves at 14:30 -> 90 minutes early
      const early = computeEarlyLeaveMinutes('14:30', '16:00', '08:00');
      expect(early).toBe(90);
    });

    it('returns null when on time or leaves late', () => {
      const onTime = computeEarlyLeaveMinutes('16:00', '16:00', '08:00');
      expect(onTime).toBeNull();

      const leavesLate = computeEarlyLeaveMinutes('17:00', '16:00', '08:00');
      expect(leavesLate).toBeNull();
    });

    it('handles overnight shift early leave (ends at 07:00, leaves at 06:00 -> 60 min early)', () => {
      const early = computeEarlyLeaveMinutes('06:00', '07:00', '21:00');
      expect(early).toBe(60);
    });
  });

  describe('computeFullAttendanceSummary', () => {
    it('returns complete summary in one call', () => {
      const summary = computeFullAttendanceSummary('08:10', '17:00', {
        shiftStart: '08:00',
        shiftEnd: '16:00',
        toleranceMinutes: 15,
        breakMinutes: 0,
        autoOTThresholdMinutes: 0,
      });

      expect(summary.isLate).toBe(false);
      expect(summary.status).toBe('Hadir');
      expect(summary.overtimeHours).toBe(0.83); // 50 mins extra / 60
      expect(summary.earlyLeaveMinutes).toBeNull();
    });
  });

  describe('mergeShiftDefs & findShiftDef (Task 2.2 & 5.1)', () => {
    it('gives priority to unit shifts over global shifts when names match', () => {
      const globalShifts: any[] = [{ name: 'Pagi', startTime: '08:00', endTime: '16:00', lateToleranceMinutes: 15 }];
      const unitShifts: any[] = [{ name: 'Pagi', startTime: '07:00', endTime: '14:00', lateToleranceMinutes: 5 }];

      const merged = mergeShiftDefs(globalShifts, unitShifts);
      expect(merged.length).toBe(1);
      expect(merged[0].startTime).toBe('07:00');
      expect(merged[0].lateToleranceMinutes).toBe(5);
    });

    it('finds shift definition case-insensitively with space trimming', () => {
      const shifts: any[] = [{ name: 'Shift Malam', startTime: '21:00' }];
      const found = findShiftDef('  shift malam  ', shifts);
      expect(found).toBeDefined();
      expect(found?.startTime).toBe('21:00');
    });
  });
});
