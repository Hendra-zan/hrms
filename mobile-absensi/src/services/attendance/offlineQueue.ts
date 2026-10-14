/**
 * mobile-absensi/src/services/attendance/offlineQueue.ts
 * Buffer antrean presensi lokal (AsyncStorage) untuk ketahanan jaringan saat blind-spot.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../../config/supabase';

const OFFLINE_QUEUE_KEY = 'hrms_offline_attendance_queue';

export interface QueuedAttendanceAction {
  id: string;
  type: 'checkIn' | 'checkOut';
  userId: string;
  payload: Record<string, any>;
  timestamp: string;
}

export async function getOfflineQueue(): Promise<QueuedAttendanceAction[]> {
  try {
    const raw = await AsyncStorage.getItem(OFFLINE_QUEUE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export async function saveToOfflineQueue(action: Omit<QueuedAttendanceAction, 'id' | 'timestamp'>): Promise<void> {
  try {
    const queue = await getOfflineQueue();
    const item: QueuedAttendanceAction = {
      ...action,
      id: `queue-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      timestamp: new Date().toISOString(),
    };
    queue.push(item);
    await AsyncStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue));
  } catch (err) {
    console.warn('[OfflineQueue] Failed to save offline action:', err);
  }
}

export async function flushOfflineQueue(): Promise<{ synced: number; remaining: number }> {
  try {
    const queue = await getOfflineQueue();
    if (queue.length === 0) return { synced: 0, remaining: 0 };

    const remaining: QueuedAttendanceAction[] = [];
    let synced = 0;

    for (const item of queue) {
      try {
        const { error } = await supabase
          .from('attendance')
          .upsert(item.payload, { onConflict: 'employeeId,tanggal' });

        if (error) {
          remaining.push(item);
        } else {
          synced++;
        }
      } catch {
        remaining.push(item);
      }
    }

    await AsyncStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(remaining));
    return { synced, remaining: remaining.length };
  } catch {
    return { synced: 0, remaining: 0 };
  }
}
