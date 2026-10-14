import { supabase } from '../supabaseClient.ts';
import { HikvisionConfig, getHikvisionConfig } from './types.ts';

export function buildBasicAuth(username: string, password: string): string {
  return 'Basic ' + btoa(`${username}:${password}`);
}

export function buildBaseUrl(config: HikvisionConfig): string {
  return `http://${config.ip}:${config.port}`;
}

export async function callHikvisionProxy(
  config: HikvisionConfig,
  path: string,
  method: 'GET' | 'POST',
  body?: any
): Promise<Response> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token || '';

  const proxyPayload = {
    ip: config.ip,
    port: config.port,
    path,
    method,
    headers: {
      'Content-Type': 'application/json',
      Authorization: buildBasicAuth(config.username, config.password),
    },
    body,
  };

  return fetch('/api/hikvision/proxy', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(proxyPayload),
  });
}

export async function testHikvisionConnection(
  config?: HikvisionConfig
): Promise<{ connected: boolean; deviceInfo?: Record<string, unknown>; error?: string }> {
  const cfg = config ?? getHikvisionConfig();
  const isHikCentral = cfg.username && cfg.username !== 'admin' && cfg.username.length > 5;

  try {
    if (isHikCentral) {
      const tzOffset = -new Date().getTimezoneOffset();
      const diff = tzOffset >= 0 ? '+' : '-';
      const pad = (num: number) => String(num).padStart(2, '0');
      const offsetHours = pad(Math.floor(Math.abs(tzOffset) / 60));
      const offsetMinutes = pad(Math.abs(tzOffset) % 60);

      const formatISO = (date: Date) => {
        const yyyy = date.getFullYear();
        const mm = pad(date.getMonth() + 1);
        const dd = pad(date.getDate());
        const hh = pad(date.getHours());
        const min = pad(date.getMinutes());
        const ss = pad(date.getSeconds());
        return `${yyyy}-${mm}-${dd}T${hh}:${min}:${ss}${diff}${offsetHours}:${offsetMinutes}`;
      };

      const now = new Date();
      const startTime = formatISO(new Date(now.getTime() - 60 * 1000));
      const endTime = formatISO(now);

      const response = await callHikvisionProxy(
        cfg,
        '/artemis/api/acs/v1/door/events',
        'POST',
        {
          startTime,
          endTime,
          pageNo: 1,
          pageSize: 1,
        }
      );

      if (!response.ok) {
        return { connected: false, error: `Artemis HTTP ${response.status}: ${response.statusText}` };
      }

      const data = await response.json();
      if (data?.code !== '0') {
        return { connected: false, error: `HikCentral OpenAPI error ${data?.code}: ${data?.msg}` };
      }

      return {
        connected: true,
        deviceInfo: {
          deviceModel: 'HikCentral OpenAPI Gateway',
          serialNumber: 'HikCentral Centralized API Server',
        },
      };
    } else {
      const response = await callHikvisionProxy(
        cfg,
        '/ISAPI/System/deviceInfo?format=json',
        'GET'
      );

      if (!response.ok) {
        return { connected: false, error: `HTTP ${response.status}: ${response.statusText}` };
      }

      const text = await response.text();
      const cleanText = text.trim();

      if (cleanText.startsWith('<')) {
        const modelMatch = cleanText.match(/<deviceModel>([^<]+)<\/deviceModel>/i);
        const serialMatch = cleanText.match(/<serialNumber>([^<]+)<\/serialNumber>/i);

        const deviceInfo = {
          deviceModel: modelMatch ? modelMatch[1] : 'Hikvision Device',
          serialNumber: serialMatch ? serialMatch[1] : 'Unknown Serial',
        };
        return { connected: true, deviceInfo };
      } else {
        const data = JSON.parse(cleanText);
        return { connected: true, deviceInfo: data?.DeviceInfo ?? data };
      }
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { connected: false, error: msg };
  }
}
