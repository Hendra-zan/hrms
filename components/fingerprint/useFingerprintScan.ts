import { useState, useEffect, useRef, useCallback } from 'react';
import {
  checkUareUDeviceStatus,
  captureUareUSample,
  type UareUDeviceStatus,
  type UareUScanResult,
} from '../../services/uareuFingerprintService.ts';
import { ScanPhase, SCAN_TIMEOUT_SECONDS } from './types.ts';

export const useFingerprintScan = (
  isOpen: boolean,
  onSuccess: (data: { template: string; format: string; quality?: number; hostname?: string; ip_local?: string }) => void
) => {
  const [phase, setPhase] = useState<ScanPhase>('checking');
  const [deviceStatus, setDeviceStatus] = useState<UareUDeviceStatus | null>(null);
  const [scanResult, setScanResult] = useState<UareUScanResult | null>(null);
  const [countdown, setCountdown] = useState(SCAN_TIMEOUT_SECONDS);
  const [retryCount, setRetryCount] = useState(0);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const scanAbortRef = useRef<boolean>(false);

  const clearCountdown = () => {
    if (countdownRef.current) {
      clearInterval(countdownRef.current);
      countdownRef.current = null;
    }
  };

  const startCountdown = useCallback(() => {
    clearCountdown();
    setCountdown(SCAN_TIMEOUT_SECONDS);
    countdownRef.current = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearCountdown();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, []);

  const checkBridge = async () => {
    setPhase('checking');
    const status = await checkUareUDeviceStatus();
    setDeviceStatus(status);
    if (status.isConnected) {
      setPhase('ready');
    } else if (status.serviceOnline && !status.hardwareAttached) {
      setPhase('no_device');
    } else {
      setPhase('bridge_error');
    }
  };

  const handleStartScan = async () => {
    if (phase !== 'ready' && phase !== 'scan_failed') return;
    scanAbortRef.current = false;
    setPhase('scanning');
    setScanResult(null);
    startCountdown();

    try {
      const result = await captureUareUSample(SCAN_TIMEOUT_SECONDS);
      clearCountdown();

      if (scanAbortRef.current) return;

      setScanResult(result);

      if (result.success && result.template) {
        setPhase('processing');
        await new Promise(r => setTimeout(r, 600));
        if (!scanAbortRef.current) {
          setPhase('success');
          onSuccess({
            template: result.template,
            format: result.format,
            quality: result.quality,
            hostname: result.hostname,
            ip_local: result.ip_local,
          });
        }
      } else {
        setPhase('scan_failed');
        setRetryCount(prev => prev + 1);
      }
    } catch {
      clearCountdown();
      if (!scanAbortRef.current) {
        setPhase('scan_failed');
        setRetryCount(prev => prev + 1);
      }
    }
  };

  useEffect(() => {
    if (!isOpen) {
      clearCountdown();
      scanAbortRef.current = true;
      return;
    }

    scanAbortRef.current = false;
    setPhase('checking');
    setScanResult(null);
    setRetryCount(0);
    setCountdown(SCAN_TIMEOUT_SECONDS);
    checkBridge();
  }, [isOpen]);

  return {
    phase,
    deviceStatus,
    scanResult,
    countdown,
    retryCount,
    checkBridge,
    handleStartScan,
  };
};
