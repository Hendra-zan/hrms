/**
 * server/services/hikvision/isapiClient.js
 * Klien protokol ISAPI Hikvision dengan otentikasi HTTP Digest.
 */

import crypto from 'crypto';
import loggingService from '../loggingService.js';

export function md5(str) {
  return crypto.createHash('md5').update(str).digest('hex');
}

export function parseDigestHeader(header) {
  const params = {};
  const regex = /(\w+)=["']?([^"',]+)["']?/g;
  let match;
  while ((match = regex.exec(header)) !== null) {
    params[match[1]] = match[2];
  }
  return params;
}

export function calculateDigestResponse(username, password, realm, nonce, method, uri, qop, nc, cnonce) {
  const ha1 = md5(`${username}:${realm}:${password}`);
  const ha2 = md5(`${method}:${uri}`);
  if (qop === 'auth' || qop === 'auth-int') {
    return md5(`${ha1}:${nonce}:${nc}:${cnonce}:${qop}:${ha2}`);
  }
  return md5(`${ha1}:${nonce}:${ha2}`);
}

export async function fetchWithDigest(url, options = {}, username, password) {
  const fetchOptions = { ...options };
  fetchOptions.headers = { ...options.headers };

  delete fetchOptions.headers['Authorization'];
  delete fetchOptions.headers['authorization'];

  const initialRes = await fetch(url, fetchOptions);

  if (initialRes.status !== 401) {
    return initialRes;
  }

  const authHeader = initialRes.headers.get('www-authenticate');
  if (!authHeader || !authHeader.startsWith('Digest')) {
    return initialRes;
  }

  const params = parseDigestHeader(authHeader);
  const realm = params.realm;
  const nonce = params.nonce;
  const qop = params.qop;

  const parsedUrl = new URL(url);
  const uri = parsedUrl.pathname + parsedUrl.search;

  const nc = '00000001';
  const cnonce = crypto.randomBytes(8).toString('hex');
  const method = fetchOptions.method || 'GET';

  const response = calculateDigestResponse(username, password, realm, nonce, method, uri, qop, nc, cnonce);

  let authValue = `Digest username="${username}", realm="${realm}", nonce="${nonce}", uri="${uri}", response="${response}"`;
  if (qop) {
    authValue += `, qop=${qop}, nc=${nc}, cnonce="${cnonce}"`;
  }

  const finalHeaders = {
    ...options.headers,
    'Authorization': authValue,
  };

  const finalOptions = {
    ...options,
    headers: finalHeaders,
  };

  return fetch(url, finalOptions);
}

export async function fetchEventsFromISAPI(ip, port, username, password, startTime, endTime) {
  const minorCodes = [75, 76, 38, 50];
  const rawEvents = [];

  for (const minorCode of minorCodes) {
    const url = `http://${ip}:${port}/ISAPI/AccessControl/AcsEvent?format=json`;
    const body = {
      AcsEventCond: {
        searchID: `HRMS-BACKEND-${Date.now()}-${minorCode}`,
        searchResultPosition: 0,
        maxResults: 500,
        major: 5,
        minor: minorCode,
        startTime,
        endTime,
      },
    };

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    try {
      const response = await fetchWithDigest(
        url,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
          signal: controller.signal,
        },
        username,
        password
      );

      clearTimeout(timeoutId);

      if (response.ok) {
        const data = await response.json();
        const rawList = data?.AcsEvent?.InfoList ?? [];
        for (const item of rawList) {
          rawEvents.push(item);
        }
      } else {
        loggingService.warn(`[Hikvision Sync] Query failed for minor ${minorCode}: ${response.status}`);
      }
    } catch (err) {
      clearTimeout(timeoutId);
      loggingService.warn(`[Hikvision Sync] Failed to fetch minor ${minorCode}: ${err.message}`);
    }
  }

  return rawEvents;
}
