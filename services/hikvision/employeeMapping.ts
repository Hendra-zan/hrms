import { supabase } from '../supabaseClient.ts';
import logger from '../logger.ts';
import {
  HikvisionConfig,
  PushEmployeePayload,
} from './types.ts';
import { callHikvisionProxy } from './client.ts';

export async function resolveEmployeeId(devicePin: string): Promise<string | null> {
  const { data: byPin, error: pinError } = await (supabase as any)
    .from('employees')
    .select('id, nama')
    .eq('pin_mesin', devicePin)
    .maybeSingle();

  if (!pinError && (byPin as any)?.id) {
    logger.debug('[Hikvision] Resolved via pin_mesin', { pin: devicePin, nama: (byPin as any).nama });
    return (byPin as any).id;
  }

  const { data: byNik, error: nikError } = await (supabase as any)
    .from('employees')
    .select('id, nama')
    .eq('nik', devicePin)
    .maybeSingle();

  if (!nikError && (byNik as any)?.id) {
    logger.debug('[Hikvision] Resolved via nik (fallback)', { nik: devicePin, nama: (byNik as any).nama });
    return (byNik as any).id;
  }

  const { data: byId } = await (supabase as any)
    .from('employees')
    .select('id')
    .eq('id', devicePin)
    .maybeSingle();

  if ((byId as any)?.id) {
    logger.debug('[Hikvision] Resolved via UUID (last resort)', { id: devicePin });
    return (byId as any).id;
  }

  logger.warn('[Hikvision] Employee not found', { devicePin });
  return null;
}

export async function pushEmployeeToDevice(
  config: HikvisionConfig,
  payload: PushEmployeePayload
): Promise<{ success: boolean; error?: string }> {
  try {
    const body = {
      UserInfo: {
        employeeNo: payload.pin_mesin,
        name: payload.nama.slice(0, 32),
        userType: 'normal',
        Valid: {
          enable: true,
          beginTime: '2000-01-01T00:00:00',
          endTime: '2037-12-31T23:59:59',
        },
        doorRight: '1',
        RightPlan: [{ doorNo: 1, planTemplateNo: '1' }],
      },
    };

    const response = await callHikvisionProxy(
      config,
      '/ISAPI/AccessControl/UserInfo/SetUp?format=json',
      'POST',
      body
    );

    if (!response.ok) {
      const text = await response.text();
      return { success: false, error: `HTTP ${response.status}: ${text}` };
    }

    const result = await response.json();
    const statusCode = result?.statusCode ?? result?.ResponseStatus?.statusCode;
    if (statusCode && statusCode !== 1) {
      return { success: false, error: `Device error code ${statusCode}: ${result?.statusString ?? ''}` };
    }

    logger.info('[Hikvision] Employee pushed to device', { pin_mesin: payload.pin_mesin, nama: payload.nama });
    return { success: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    logger.error('[Hikvision] pushEmployeeToDevice failed', err);
    return { success: false, error: msg };
  }
}

export async function fetchPinMesinMapping(): Promise<{
  mapped: Array<{ id: string; nama: string; pin_mesin: string; nik: string | null }>;
  unmapped: Array<{ id: string; nama: string; nik: string | null }>;
}> {
  const { data, error } = await (supabase as any)
    .from('employees')
    .select('id, nama, nik, pin_mesin')
    .eq('status', 'Aktif')
    .order('nama', { ascending: true });

  if (error || !data) {
    logger.error('[Hikvision] fetchPinMesinMapping failed', error);
    return { mapped: [], unmapped: [] };
  }

  const mapped: Array<{ id: string; nama: string; pin_mesin: string; nik: string | null }> = [];
  const unmapped: Array<{ id: string; nama: string; nik: string | null }> = [];

  for (const emp of data as any[]) {
    if (emp.pin_mesin) {
      mapped.push({ id: emp.id, nama: emp.nama, pin_mesin: emp.pin_mesin, nik: emp.nik });
    } else {
      unmapped.push({ id: emp.id, nama: emp.nama, nik: emp.nik });
    }
  }

  return { mapped, unmapped };
}
