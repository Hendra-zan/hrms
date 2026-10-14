export const normalizeStr = (str: any) => String(str || '').toLowerCase().trim();

export const findMatchingShift = (shifts: any[], shiftName: string) => {
  if (!shifts || !Array.isArray(shifts) || !shiftName) return null;
  const target = normalizeStr(shiftName);

  let found = shifts.find((s: any) => normalizeStr(s.name) === target);
  if (found) return found;

  found = shifts.find((s: any) => {
    const sName = normalizeStr(s.name);
    return sName.includes(target) || target.includes(sName);
  });
  if (found) return found;

  if (target.includes('siang') || target.includes('sore')) {
    found = shifts.find(
      (s: any) => normalizeStr(s.name).includes('siang') || normalizeStr(s.name).includes('sore')
    );
  } else if (target.includes('malam')) {
    found = shifts.find((s: any) => normalizeStr(s.name).includes('malam'));
  } else if (target.includes('pagi')) {
    found = shifts.find((s: any) => normalizeStr(s.name).includes('pagi'));
  }
  return found || null;
};

export const computeAttendanceSummary = (
  clockIn: string,
  clockOut: string,
  shiftStart = '08:00',
  shiftEnd = '16:00',
  tolerance = 15,
  breakDurationMinutes = 0,
  autoOvertimeThresholdMinutes = 0
) => {
  const [inHour, inMinute] = clockIn.split(':').map(Number);
  const [outHour, outMinute] = clockOut.split(':').map(Number);
  const [startH, startM] = shiftStart.split(':').map(Number);
  const [endH, endM] = shiftEnd.split(':').map(Number);

  let shiftDuration = endH + endM / 60 - (startH + startM / 60);
  if (shiftDuration <= 0) shiftDuration += 24;

  let adjustedInH = inHour;
  if (startH >= 18 && inHour <= 12) {
    adjustedInH += 24;
  }

  const isLate = adjustedInH * 60 + inMinute > startH * 60 + startM + tolerance;

  const inValue = inHour + inMinute / 60;
  const startValue = startH + startM / 60;

  let effectiveInValue = inValue;
  if (startH < 18 || inHour >= 12) {
    if (inValue < startValue) {
      effectiveInValue = startValue;
    }
  }

  let outValue = outHour + outMinute / 60;
  if (outValue < effectiveInValue) outValue += 24;

  const workDuration = outValue - effectiveInValue;
  const netPresence = workDuration - breakDurationMinutes / 60;
  const rawOvertime = Math.max(0, netPresence - shiftDuration);

  let calculatedOvertime = rawOvertime;
  if (autoOvertimeThresholdMinutes > 0 && rawOvertime * 60 < autoOvertimeThresholdMinutes) {
    calculatedOvertime = 0;
  }

  const overtimeHours = Number(calculatedOvertime.toFixed(2));
  return { isLate, overtimeHours, status: isLate ? ('Terlambat' as const) : ('Hadir' as const) };
};
