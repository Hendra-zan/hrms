/**
 * ADMIN SERVICE CLIENT (SECURITY HARDENED)
 *
 * Direct VITE_SUPABASE_SERVICE_ROLE_KEY exposure in the browser HAS BEEN REMOVED.
 * All administrative operations requiring elevated privileges are now securely routed
 * through the backend API (/api/admin/*) using the authenticated user's JWT session.
 */

import { supabase } from './supabaseClient';

async function getAuthToken(): Promise<string> {
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token || '';
}

/**
 * Update an employee device record via secure backend proxy
 */
export async function updateDeviceAdmin(id: string, updates: Record<string, any>): Promise<{ error: Error | null; data?: any }> {
  try {
    const token = await getAuthToken();
    const res = await fetch('/api/admin/devices/update', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ id, updates }),
    });

    const result = await res.json();
    if (!res.ok || !result.success) {
      return { error: new Error(result.error || 'Gagal memperbarui perangkat.') };
    }
    return { error: null, data: result.data };
  } catch (err: any) {
    return { error: err };
  }
}

/**
 * Delete an employee device record via secure backend proxy
 */
export async function deleteDeviceAdmin(id: string): Promise<{ error: Error | null }> {
  try {
    const token = await getAuthToken();
    const res = await fetch('/api/admin/devices/delete', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ id }),
    });

    const result = await res.json();
    if (!res.ok || !result.success) {
      return { error: new Error(result.error || 'Gagal menghapus perangkat.') };
    }
    return { error: null };
  } catch (err: any) {
    return { error: err };
  }
}

/**
 * Enroll fingerprint template via secure backend proxy
 */
export async function enrollFingerprintAdmin(employeeId: string, template: string, format: string = 'ANSI-378'): Promise<{ error: Error | null }> {
  try {
    const token = await getAuthToken();
    const res = await fetch('/api/admin/fingerprint/enroll', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ employeeId, template, format }),
    });

    const result = await res.json();
    if (!res.ok || !result.success) {
      return { error: new Error(result.error || 'Gagal mendaftarkan sidik jari.') };
    }
    return { error: null };
  } catch (err: any) {
    return { error: err };
  }
}

/**
 * Remove fingerprint template via secure backend proxy
 */
export async function removeFingerprintAdmin(employeeId: string): Promise<{ error: Error | null }> {
  try {
    const token = await getAuthToken();
    const res = await fetch('/api/admin/fingerprint/remove', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ employeeId }),
    });

    const result = await res.json();
    if (!res.ok || !result.success) {
      return { error: new Error(result.error || 'Gagal menghapus sidik jari.') };
    }
    return { error: null };
  } catch (err: any) {
    return { error: err };
  }
}

/**
 * Proxy object for backward compatibility with components expecting `supabaseAdmin.from(...)`
 */
export const supabaseAdmin = {
  from(table: string) {
    return {
      update(updates: Record<string, any>) {
        return {
          eq(column: string, val: string) {
            if (table === 'employee_devices') {
              return updateDeviceAdmin(val, updates);
            }
            if (table === 'employees') {
              if (updates.fingerprint_template === null) {
                return removeFingerprintAdmin(val);
              }
              return enrollFingerprintAdmin(val, updates.fingerprint_template, updates.fingerprint_format);
            }
            // Fallback to standard authenticated client for other tables
            return (supabase as any).from(table).update(updates).eq(column, val);
          }
        };
      },
      delete() {
        return {
          eq(column: string, val: string) {
            if (table === 'employee_devices') {
              return deleteDeviceAdmin(val);
            }
            return (supabase as any).from(table).delete().eq(column, val);
          }
        };
      }
    };
  }
};
