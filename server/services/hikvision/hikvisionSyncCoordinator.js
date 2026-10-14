/**
 * server/services/hikvision/hikvisionSyncCoordinator.js
 * Koordinator background daemon & manual sync trigger untuk Hikvision.
 */

import loggingService from '../loggingService.js';
import { getHikvisionServerConfig, formatLocalISOString } from './hikvisionConfig.js';
import { fetchEventsFromISAPI } from './isapiClient.js';
import { fetchEventsFromHikCentral } from './artemisClient.js';
import { processEventRecord } from './attendanceSaver.js';

let syncIntervalId = null;

export async function executeHikvisionSync(supabaseClient, customConfig = null, hoursBack = 2) {
  const config = customConfig || getHikvisionServerConfig();
  const { ip, port, username, password, deviceLocation } = config;

  if (!ip) {
    return { success: false, synced: 0, failed: 0, errors: ['IP Device belum dikonfigurasi'] };
  }

  const now = new Date();
  const startTime = formatLocalISOString(new Date(now.getTime() - hoursBack * 60 * 60 * 1000));
  const endTime = formatLocalISOString(now);

  const isHikCentral = username && username !== 'admin' && username.length > 5;
  let rawEvents = [];

  if (isHikCentral) {
    rawEvents = await fetchEventsFromHikCentral(ip, port, username, password, startTime, endTime);
  } else {
    rawEvents = await fetchEventsFromISAPI(ip, port, username, password, startTime, endTime);
  }

  rawEvents.sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime());

  let synced = 0;
  let failed = 0;
  const errors = [];

  for (const item of rawEvents) {
    try {
      const res = await processEventRecord(supabaseClient, item, deviceLocation, ip);
      if (res.success) {
        synced++;
      } else if (res.reason !== 'no_pin') {
        failed++;
        if (res.error) errors.push(res.error.message || String(res.error));
      }
    } catch (err) {
      failed++;
      errors.push(err.message || String(err));
    }
  }

  return { success: true, synced, failed, errors };
}

export function startServerHikvisionSync(supabaseClient) {
  const config = getHikvisionServerConfig();
  if (!config.syncEnabled || !config.ip) {
    loggingService.info('[Hikvision Sync] Daemon disabled or IP not configured.');
    return;
  }

  if (syncIntervalId) return;

  const intervalMs = config.syncIntervalMinutes * 60 * 1000;
  loggingService.info(`[Hikvision Sync] Starting background sync daemon. Interval: ${config.syncIntervalMinutes} minutes.`);

  const tick = async () => {
    try {
      await executeHikvisionSync(supabaseClient, config, 2);
    } catch (err) {
      loggingService.error(`[Hikvision Sync] Background tick error: ${err.message}`);
    }
  };

  setTimeout(tick, 5000);
  syncIntervalId = setInterval(tick, intervalMs);
}

export function stopServerHikvisionSync() {
  if (syncIntervalId) {
    clearInterval(syncIntervalId);
    syncIntervalId = null;
    loggingService.info('[Hikvision Sync] Daemon stopped.');
  }
}

export async function runManualSyncOnServer(supabaseClient, hoursBack = 24, customConfig = null) {
  return executeHikvisionSync(supabaseClient, customConfig, hoursBack);
}
