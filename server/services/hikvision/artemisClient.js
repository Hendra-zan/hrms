/**
 * server/services/hikvision/artemisClient.js
 * Klien protokol OpenAPI HikCentral (Artemis) dengan HMAC-SHA256 signature.
 */

import crypto from 'crypto';
import https from 'https';
import loggingService from '../loggingService.js';

export function generateHikCentralSignature(appSecret, method, accept, contentType, path, timestamp, appKey) {
  const headers = `x-ca-key:${appKey}\nx-ca-timestamp:${timestamp}`;
  const stringToSign = `${method}\n${accept}\n\n${contentType}\n\n${headers}\n${path}`;
  return crypto.createHmac('sha256', appSecret).update(stringToSign).digest('base64');
}

export async function fetchEventsFromHikCentral(ip, port, appKey, appSecret, startTime, endTime) {
  const rawEvents = [];

  const getISOWithOffset = (isoStr) => {
    const d = new Date(isoStr);
    if (isNaN(d.getTime())) return isoStr;
    const tzOffset = -d.getTimezoneOffset();
    const diff = tzOffset >= 0 ? '+' : '-';
    const pad = (num) => String(num).padStart(2, '0');
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
    const targetPath = '/artemis/api/acs/v1/door/events';
    const timestamp = String(Date.now());
    const accept = '*/*';
    const contentType = 'application/json';

    const signature = generateHikCentralSignature(
      appSecret,
      'POST',
      accept,
      contentType,
      targetPath,
      timestamp,
      appKey
    );

    const targetUrl = `https://${ip}:${port || 443}${targetPath}`;
    const body = {
      startTime: formattedStart,
      endTime: formattedEnd,
      pageNo,
      pageSize,
    };

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    try {
      const response = await fetch(targetUrl, {
        method: 'POST',
        headers: {
          Accept: accept,
          'Content-Type': contentType,
          'x-ca-key': appKey,
          'x-ca-timestamp': timestamp,
          'x-ca-signature': signature,
          'x-ca-signature-headers': 'x-ca-key,x-ca-timestamp',
        },
        body: JSON.stringify(body),
        signal: controller.signal,
        agent: targetUrl.startsWith('https')
          ? new https.Agent({ rejectUnauthorized: false })
          : undefined,
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        const data = await response.json();
        if (data?.code === '0' || data?.code === 0) {
          const list = data?.data?.list ?? [];
          for (const item of list) {
            rawEvents.push({
              employeeNoString: item.personCode || item.personId || item.cardNo,
              name: item.personName,
              time: item.eventTime,
              minor: 75,
              currentVerifyMode: 'face',
              attendanceState: item.checkInAndOutType === '1' ? 'checkOut' : 'checkIn',
              doorIndexCode: item.doorIndexCode,
            });
          }
          const totalCount = data?.data?.totalCount ?? 0;
          const fetchedCount = pageNo * pageSize;
          if (list.length < pageSize || fetchedCount >= totalCount) {
            hasMore = false;
          } else {
            pageNo++;
          }
        } else {
          loggingService.warn(`[HikCentral Sync] OpenAPI returned code ${data?.code}: ${data?.msg}`);
          hasMore = false;
        }
      } else {
        loggingService.warn(`[HikCentral Sync] HTTP error: ${response.status}`);
        hasMore = false;
      }
    } catch (err) {
      clearTimeout(timeoutId);
      loggingService.error(`[HikCentral Sync] Request failed: ${err.message}`);
      hasMore = false;
    }
  }

  return rawEvents;
}
