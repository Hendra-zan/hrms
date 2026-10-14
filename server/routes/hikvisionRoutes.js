import express from 'express';
import crypto from 'crypto';
import https from 'https';
import { runManualSyncOnServer } from '../services/hikvisionSyncService.js';

function md5(str) {
  return crypto.createHash('md5').update(str).digest('hex');
}

function generateHikCentralSignature(appSecret, method, accept, contentType, path, timestamp, appKey) {
  const headers = `x-ca-key:${appKey}\nx-ca-timestamp:${timestamp}`;
  const stringToSign = `${method}\n${accept}\n\n${contentType}\n\n${headers}\n${path}`;
  return crypto.createHmac('sha256', appSecret).update(stringToSign).digest('base64');
}

function parseDigestHeader(header) {
  const params = {};
  const regex = /(\w+)=["']?([^"',]+)["']?/g;
  let match;
  while ((match = regex.exec(header)) !== null) {
    params[match[1]] = match[2];
  }
  return params;
}

function calculateDigestResponse(username, password, realm, nonce, method, uri, qop, nc, cnonce) {
  const ha1 = md5(`${username}:${realm}:${password}`);
  const ha2 = md5(`${method}:${uri}`);
  if (qop === 'auth' || qop === 'auth-int') {
    return md5(`${ha1}:${nonce}:${nc}:${cnonce}:${qop}:${ha2}`);
  }
  return md5(`${ha1}:${nonce}:${ha2}`);
}

async function fetchWithDigest(url, options = {}, username, password) {
  // Clone options to avoid modifying input
  const fetchOptions = { ...options };
  fetchOptions.headers = { ...options.headers };

  // Remove Authorization header from initial request to trigger 401 challenge
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
  
  // Re-run the request with the calculated Authorization header
  const finalHeaders = {
    ...options.headers,
    'Authorization': authValue,
  };

  const finalOptions = {
    ...options,
    headers: finalHeaders
  };

  return fetch(url, finalOptions);
}

export const setupHikvisionRoutes = (deps) => {
  const router = express.Router();
  const { getRequesterContext, logDetailedError, adminSupabase } = deps;

  router.post('/proxy', async (req, res) => {
    let timeoutId;
    try {
      // 1. Authenticate user session
      const context = await getRequesterContext(req);
      if (!context.ok) {
        return res.status(context.status).json({ success: false, error: context.error });
      }

      // 2. Extract proxy parameters
      const { ip, port, path: targetPath, method, headers, body } = req.body || {};
      if (!ip || !targetPath) {
        return res.status(400).json({ success: false, error: 'ip and path are required' });
      }

      // 3. Extract credentials from Basic Auth header sent by client
      const clientAuth = headers?.['Authorization'] || headers?.['authorization'];
      let username = 'admin';
      let password = '';

      if (clientAuth && clientAuth.startsWith('Basic ')) {
        const credentials = Buffer.from(clientAuth.substring(6), 'base64').toString('ascii');
        const index = credentials.indexOf(':');
        if (index !== -1) {
          username = credentials.substring(0, index);
          password = credentials.substring(index + 1);
        }
      }

      // 4. Determine protocol and perform request
      const isHikCentral = targetPath.startsWith('/artemis/');
      let deviceRes;

      // Set up abort controller for 8-second timeout (HikCentral might take slightly longer)
      const controller = new AbortController();
      timeoutId = setTimeout(() => controller.abort(), 8000);

      if (isHikCentral) {
        const appKey = username;
        const appSecret = password;
        const timestamp = String(Date.now());
        
        const accept = '*/*';
        const contentType = 'application/json';
        
        const signature = generateHikCentralSignature(
          appSecret,
          method || 'POST',
          accept,
          contentType,
          targetPath,
          timestamp,
          appKey
        );

        // HikCentral OpenAPI usually runs over HTTPS
        const targetUrl = `https://${ip}:${port || 443}${targetPath}`;
        
        const fetchOptions = {
          method: method || 'POST',
          headers: {
            'Accept': accept,
            'Content-Type': contentType,
            'x-ca-key': appKey,
            'x-ca-timestamp': timestamp,
            'x-ca-signature': signature,
            'x-ca-signature-headers': 'x-ca-key,x-ca-timestamp',
          },
          signal: controller.signal,
          agent: new https.Agent({ rejectUnauthorized: false }), // Allow self-signed SSL certs
        };

        if (body && (method === 'POST' || method === 'PUT')) {
          fetchOptions.body = typeof body === 'object' ? JSON.stringify(body) : body;
        }

        deviceRes = await fetch(targetUrl, fetchOptions);
      } else {
        const targetUrl = `http://${ip}:${port || 80}${targetPath}`;
        const fetchOptions = {
          method: method || 'GET',
          headers: {
            ...headers,
          },
          signal: controller.signal,
        };

        if (body && (method === 'POST' || method === 'PUT')) {
          fetchOptions.body = typeof body === 'object' ? JSON.stringify(body) : body;
        }

        deviceRes = await fetchWithDigest(targetUrl, fetchOptions, username, password);
      }

      clearTimeout(timeoutId);
      const responseText = await deviceRes.text();
      
      // 5. Forward status and headers back to client
      res.status(deviceRes.status);
      const contentType = deviceRes.headers.get('content-type');
      if (contentType) {
        res.setHeader('content-type', contentType);
      }
      
      return res.send(responseText);
    } catch (err) {
      if (timeoutId) clearTimeout(timeoutId);
      
      logDetailedError('Hikvision.proxy', err);
      const isAbort = err.name === 'AbortError';
      const errorMsg = isAbort 
        ? 'Koneksi ke mesin/server absensi timeout (8 detik)' 
        : 'Gagal terhubung ke mesin/server absensi: ' + (err.message || String(err));
      
      return res.status(isAbort ? 504 : 502).json({ success: false, error: errorMsg });
    }
  });

  router.post('/sync', async (req, res) => {
    try {
      const context = await getRequesterContext(req);
      if (!context.ok) {
        return res.status(context.status).json({ success: false, error: context.error });
      }
      
      const { config, hoursBack } = req.body || {};
      if (!config) {
        return res.status(400).json({ success: false, error: 'config is required' });
      }

      const result = await runManualSyncOnServer(adminSupabase, config, hoursBack || 24);
      return res.json(result);
    } catch (err) {
      logDetailedError('Hikvision.sync', err);
      return res.status(500).json({ success: false, error: err.message || String(err) });
    }
  });

  router.post('/event-webhook', async (req, res) => {
    try {
      const payload = req.body;
      const devicePin = String(payload?.employeeNoString || payload?.pin_mesin || payload?.pin || payload?.AccessControlEvent?.employeeNoString || '').trim();
      const eventTime = payload?.time || payload?.eventTime || payload?.AccessControlEvent?.time || new Date().toISOString();

      if (!devicePin) {
        return res.status(200).json({ success: true, message: 'Event ignored: no employee pin in payload' });
      }

      // 1. Resolve employee via pin_mesin
      const { data: employee, error: empErr } = await adminSupabase
        .from('employees')
        .select('id, nama, NIK, pin_mesin')
        .eq('pin_mesin', devicePin)
        .maybeSingle();

      if (empErr || !employee) {
        return res.status(200).json({ success: true, message: `Event ignored: employee not found for pin ${devicePin}` });
      }

      // 2. Insert attendance record into database
      const dateObj = new Date(eventTime);
      const dateStr = dateObj.toISOString().split('T')[0];
      const timeStr = dateObj.toTimeString().split(' ')[0];

      const { data: inserted, error: insertErr } = await adminSupabase
        .from('attendance')
        .insert({
          employeeId: employee.id,
          tanggal: dateStr,
          jamMasuk: timeStr,
          status: 'Hadir',
          lokasi: 'Mesin Absensi Fisik (Push Webhook)',
          device_fingerprint: `device_${devicePin}`,
        })
        .select('*')
        .maybeSingle();

      if (insertErr) {
        return res.status(200).json({ success: true, message: 'Clock-in recorded or duplicate skipped' });
      }

      return res.status(200).json({
        success: true,
        message: `Real-time clock-in recorded for ${employee.nama}`,
        data: inserted,
      });
    } catch (err) {
      logDetailedError('Hikvision.eventWebhook', err);
      return res.status(200).json({ success: true, message: 'Webhook error handled gracefully' });
    }
  });

  return router;
};
