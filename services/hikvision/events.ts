import logger from '../logger.ts';
import { HikvisionConfig, HikvisionAttendanceEvent } from './types.ts';
import { callHikvisionProxy } from './client.ts';

export const ALLOWED_MINOR_CODES = [75, 76, 38, 50, 112, 113, 114, 115, 116, 117, 1, 2, 3, 4];

export function detectEventType(item: Record<string, unknown>): 'checkIn' | 'checkOut' {
  const state = String(item.attendanceState || '').toLowerCase();
  if (state.includes('checkout') || state.includes('out')) {
    return 'checkOut';
  }
  if (state.includes('checkin') || state.includes('in')) {
    return 'checkIn';
  }

  const minor = Number(item.minor);
  if (minor === 76) return 'checkOut';
  return 'checkIn';
}

export function mapEventToAttendance(
  event: HikvisionAttendanceEvent,
  config: HikvisionConfig
): Record<string, unknown> {
  const dt = new Date(event.time);
  const tanggal = dt.toISOString().split('T')[0];
  const hhmm = `${String(dt.getHours()).padStart(2, '0')}:${String(dt.getMinutes()).padStart(2, '0')}`;
  const matchScore = typeof event.matchScore === 'number' ? event.matchScore / 100 : null;

  const isCheckOut = event.type === 'checkOut';

  return {
    employeeId: event.employeeNoString,
    tanggal,
    clockIn: isCheckOut ? null : hhmm,
    clockOut: isCheckOut ? hhmm : null,
    location: config.deviceLocation,
    isLate: false,
    overtimeHours: 0,
    status: 'Recorded',
    source: 'web-admin',
    deviceId: null,
    biometric_type: 'face',
    biometricVerified: true,
    face_match_score_check_in: !isCheckOut && matchScore !== null ? matchScore : null,
    face_match_score_check_out: isCheckOut && matchScore !== null ? matchScore : null,
    notes: `Absensi dari device Hikvision (${event.verifyMode})`,
  };
}

export async function fetchAttendanceEventsFromDevice(
  config: HikvisionConfig,
  startTime: string,
  endTime: string
): Promise<HikvisionAttendanceEvent[]> {
  const isHikCentral = config.username && config.username !== 'admin' && config.username.length > 5;
  const events: HikvisionAttendanceEvent[] = [];

  if (isHikCentral) {
    logger.info('[HikCentral] Fetching events from HikCentral OpenAPI...', { startTime, endTime });

    const getISOWithOffset = (isoStr: string) => {
      const d = new Date(isoStr);
      if (isNaN(d.getTime())) return isoStr;

      const tzOffset = -d.getTimezoneOffset();
      const diff = tzOffset >= 0 ? '+' : '-';
      const pad = (num: number) => String(num).padStart(2, '0');
      const offsetHours = pad(Math.floor(Math.abs(tzOffset) / 60));
      const offsetMinutes = pad(Math.abs(tzOffset) % 60);
      return `${isoStr}${diff}${offsetHours}:${offsetMinutes}`;
    };

    const formattedStart = getISOWithOffset(startTime);
    const formattedEnd = getISOWithOffset(endTime);

    let pageNo = 1;
    let hasMore = true;
    const pageSize = 500;

    while (hasMore) {
      const body = {
        startTime: formattedStart,
        endTime: formattedEnd,
        pageNo,
        pageSize,
      };

      const response = await callHikvisionProxy(
        config,
        '/artemis/api/acs/v1/door/events',
        'POST',
        body
      );

      if (!response.ok) {
        throw new Error(`HikCentral OpenAPI error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      if (data?.code !== '0') {
        throw new Error(`HikCentral OpenAPI returned error code ${data?.code}: ${data?.msg}`);
      }

      const rawList = data?.data?.list ?? [];

      for (const item of rawList) {
        const employeeNoString = String(item.personCode || item.personId || item.cardNo || '').trim();
        if (!employeeNoString) {
          continue;
        }

        const authMethod = String(item.authMethod || '').toLowerCase();
        let verifyMode = 'face';
        if (authMethod.includes('finger') || authMethod.includes('fp') || authMethod.includes('sidik')) {
          verifyMode = 'fp';
        } else if (authMethod.includes('card') || authMethod.includes('kartu') || authMethod.includes('rfid')) {
          verifyMode = 'card';
        }

        const isCheckOut = item.checkInAndOutType === '1' || String(item.checkInAndOutType).toLowerCase() === 'checkout';

        events.push({
          employeeNoString,
          name: item.personName || '',
          time: item.eventTime || '',
          deviceSerial: item.doorIndexCode || config.ip,
          verifyMode,
          matchScore: undefined,
          pictureName: '',
          type: isCheckOut ? 'checkOut' : 'checkIn',
        });
      }

      const totalCount = data?.data?.totalCount ?? 0;
      const fetchedCount = pageNo * pageSize;
      if (rawList.length < pageSize || fetchedCount >= totalCount) {
        hasMore = false;
      } else {
        pageNo++;
      }
    }
  } else {
    const maxResults = 500;
    const minorCodes = [75, 76, 38, 50];

    for (const minorCode of minorCodes) {
      let searchResultPosition = 0;
      let hasMore = true;

      while (hasMore) {
        const body = {
          AcsEventCond: {
            searchID: `HRMS-${Date.now()}-${minorCode}`,
            searchResultPosition,
            maxResults,
            major: 5,
            minor: minorCode,
            startTime,
            endTime,
          },
        };

        const response = await callHikvisionProxy(
          config,
          '/ISAPI/AccessControl/AcsEvent?format=json',
          'POST',
          body
        );

        if (!response.ok) {
          logger.warn(`Hikvision kueri minor ${minorCode} gagal, melewati...`, { status: response.status });
          hasMore = false;
          continue;
        }

        const data = await response.json();
        const rawList = data?.AcsEvent?.InfoList ?? [];

        for (const item of rawList) {
          const employeeNoString = String(item.employeeNoString || item.cardNo || '').trim();
          if (!employeeNoString) {
            continue;
          }

          events.push({
            employeeNoString,
            name: item.name || '',
            time: item.time || '',
            deviceSerial: item.deviceSerial || config.ip,
            verifyMode: item.currentVerifyMode || (minorCode === 38 ? 'fp' : minorCode === 50 ? 'card' : 'face'),
            matchScore: item.faceMatchScore !== undefined ? item.faceMatchScore : undefined,
            pictureName: item.pictureName || '',
            type: detectEventType(item),
          });
        }

        const responseStatus = data?.AcsEvent?.responseStatusStrg;
        const isComplete = responseStatus === 'NO MATCH' || rawList.length < maxResults;
        if (isComplete) {
          hasMore = false;
        } else {
          searchResultPosition += rawList.length;
        }
      }
    }
  }

  events.sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime());
  return events;
}
