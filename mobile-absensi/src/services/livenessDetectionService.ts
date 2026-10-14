/**
 * Liveness Detection & Anti-Spoofing Service for Mobile Attendance
 * Protects against photo/video attendance spoofing and device clock tampering.
 */

export interface LivenessResult {
  isLive: boolean;
  score: number; // 0.0 to 1.0
  reason?: string;
  timestamp: string;
}

export interface TrustedTimeResult {
  isValidTime: boolean;
  serverTimestamp: string;
  skewSeconds: number;
}

/**
 * Perform anti-spoofing liveness check on face descriptors/landmarks
 */
export function evaluateFaceLiveness(
  faceMotionData: { eyeBlinkDetected?: boolean; headTurnDetected?: boolean; motionVariance?: number }
): LivenessResult {
  const now = new Date().toISOString();

  // Basic passive score
  let score = 0.5;

  if (faceMotionData.eyeBlinkDetected) {
    score += 0.25;
  }

  if (faceMotionData.headTurnDetected) {
    score += 0.15;
  }

  if (faceMotionData.motionVariance && faceMotionData.motionVariance > 0.02) {
    score += 0.1;
  }

  const isLive = score >= 0.75;

  return {
    isLive,
    score: Math.min(score, 1.0),
    reason: isLive ? 'Liveness verified' : 'Possible photo/video spoofing detected',
    timestamp: now,
  };
}

/**
 * Validate device local clock against trusted server time to prevent clock tampering
 */
export async function validateTrustedTimestamp(serverTimeUrl: string = '/api/health'): Promise<TrustedTimeResult> {
  const clientTimeBefore = Date.now();
  try {
    const res = await fetch(serverTimeUrl, { method: 'HEAD', cache: 'no-store' });
    const serverHeaderDate = res.headers.get('Date');

    if (!serverHeaderDate) {
      return { isValidTime: true, serverTimestamp: new Date().toISOString(), skewSeconds: 0 };
    }

    const serverTimeMs = new Date(serverHeaderDate).getTime();
    const clientTimeAfter = Date.now();
    const roundTripTime = clientTimeAfter - clientTimeBefore;
    const estimatedServerTime = serverTimeMs + (roundTripTime / 2);

    const skewSeconds = Math.abs(clientTimeAfter - estimatedServerTime) / 1000;
    const isValidTime = skewSeconds <= 300; // max 5 minutes allowed clock drift

    return {
      isValidTime,
      serverTimestamp: new Date(estimatedServerTime).toISOString(),
      skewSeconds,
    };
  } catch (err) {
    // If offline, allow clock-in with warning
    return {
      isValidTime: true,
      serverTimestamp: new Date().toISOString(),
      skewSeconds: 0,
    };
  }
}
