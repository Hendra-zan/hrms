import { getRedisClient } from '../services/redisClient.js';
import { loggingService } from '../services/loggingService.js';

// In-memory fallback store when Redis is offline
const inMemoryJobs = new Map();

/**
 * Enqueue a mass payroll calculation job asynchronously
 */
export async function enqueuePayrollJob(periodKey, employeeIds = [], requestedBy = 'system') {
  const jobId = `payroll_${periodKey}_${Date.now()}_${Math.random().toString(36).substring(7)}`;
  const jobPayload = {
    id: jobId,
    periodKey,
    totalEmployees: employeeIds.length,
    processedCount: 0,
    status: 'queued', // queued, processing, completed, failed
    employeeIds,
    requestedBy,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    error: null,
  };

  try {
    const redis = await getRedisClient();
    if (redis && redis.isOpen) {
      await redis.setEx(`job:${jobId}`, 3600, JSON.stringify(jobPayload));
      await redis.lPush('queue:payroll', jobId);
      loggingService.info('Payroll job enqueued to Redis', { jobId, periodKey, total: employeeIds.length });
    } else {
      inMemoryJobs.set(jobId, jobPayload);
      loggingService.info('Payroll job enqueued in-memory', { jobId, periodKey, total: employeeIds.length });
    }
  } catch (err) {
    inMemoryJobs.set(jobId, jobPayload);
    loggingService.warn('Redis unavailable, falling back to in-memory payroll job queue', { error: err.message });
  }

  return jobPayload;
}

/**
 * Get current progress/status of a payroll job
 */
export async function getPayrollJobStatus(jobId) {
  try {
    const redis = await getRedisClient();
    if (redis && redis.isOpen) {
      const raw = await redis.get(`job:${jobId}`);
      if (raw) return JSON.parse(raw);
    }
  } catch (err) {
    // Fallback to in-memory
  }
  return inMemoryJobs.get(jobId) || null;
}

/**
 * Update progress of a running payroll job
 */
export async function updatePayrollJobProgress(jobId, processedCount, status = 'processing', error = null) {
  const current = await getPayrollJobStatus(jobId);
  if (!current) return null;

  const updated = {
    ...current,
    processedCount,
    status,
    error,
    updatedAt: new Date().toISOString(),
  };

  try {
    const redis = await getRedisClient();
    if (redis && redis.isOpen) {
      await redis.setEx(`job:${jobId}`, 3600, JSON.stringify(updated));
    }
  } catch (err) {
    // ignore
  }

  inMemoryJobs.set(jobId, updated);
  return updated;
}
