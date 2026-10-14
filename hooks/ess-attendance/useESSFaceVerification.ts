/**
 * hooks/ess-attendance/useESSFaceVerification.ts
 * Helper hook untuk status enrollment wajah & UareU bridge fingerprint.
 */

import { useState, useEffect } from 'react';
import { faceVerificationService } from '../../services/faceVerificationService.ts';
import { checkUareUDeviceStatus } from '../../services/uareuFingerprintService.ts';

export function useESSFaceVerification(userId: string) {
  const [faceEnrolled, setFaceEnrolled] = useState<boolean | null>(null);
  const [bridgeDetected, setBridgeDetected] = useState<boolean | null>(null);
  const [isVerificationFlowOpen, setIsVerificationFlowOpen] = useState(false);
  const [isFingerprintModalOpen, setIsFingerprintModalOpen] = useState(false);
  const [isFaceEnrollmentOpen, setIsFaceEnrollmentOpen] = useState(false);
  const [verificationActionType, setVerificationActionType] = useState<'checkin' | 'checkout'>('checkin');

  useEffect(() => {
    if (!userId) return;
    faceVerificationService.hasEnrolledFace(userId).then(setFaceEnrolled);

    checkUareUDeviceStatus()
      .then((status) => setBridgeDetected(status.isConnected))
      .catch(() => setBridgeDetected(false));
  }, [userId]);

  return {
    faceEnrolled,
    setFaceEnrolled,
    bridgeDetected,
    setBridgeDetected,
    isVerificationFlowOpen,
    setIsVerificationFlowOpen,
    isFingerprintModalOpen,
    setIsFingerprintModalOpen,
    isFaceEnrollmentOpen,
    setIsFaceEnrollmentOpen,
    verificationActionType,
    setVerificationActionType,
  };
}
