#!/bin/bash
# Bersihkan semua chunk JS lama kecuali yang terbaru
cd /home/hrms/HRMS-Pro/dist/assets

PATTERNS=(
  "UnitScheduleManagement"
  "SystemSettings"
  "ScheduleCalendarPanel"
  "AttendanceManagement"
  "KepalaRuanganDashboard"
  "EmployeeTable"
  "EmployeeSelfService"
  "NotesPanel"
  "GuidePanel"
  "index"
)

for pattern in "${PATTERNS[@]}"; do
  newest=$(ls -t ${pattern}-*.js 2>/dev/null | head -1)
  if [ -n "$newest" ]; then
    count=$(ls ${pattern}-*.js 2>/dev/null | grep -v "$newest" | wc -l)
    ls ${pattern}-*.js 2>/dev/null | grep -v "$newest" | xargs -r rm -f
    echo "Cleaned $count old chunks for $pattern → kept: $newest"
  fi
done

echo "=== Cleanup DONE ==="
echo "Remaining chunk count: $(ls *.js | wc -l)"
