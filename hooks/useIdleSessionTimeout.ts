import { useState, useEffect, useRef, useCallback } from 'react';

interface UseIdleSessionTimeoutOptions {
  enabled: boolean;
  idleTimeoutMinutes?: number; // Default 15 minutes
  warningSeconds?: number;     // Default 60 seconds
  onLogout: () => void;
}

export function useIdleSessionTimeout({
  enabled,
  idleTimeoutMinutes = 15,
  warningSeconds = 60,
  onLogout,
}: UseIdleSessionTimeoutOptions) {
  const [isWarningOpen, setIsWarningOpen] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(warningSeconds);

  const idleTimeoutMs = idleTimeoutMinutes * 60 * 1000;
  const warningMs = warningSeconds * 1000;
  const activeIdleTimeMs = Math.max(10000, idleTimeoutMs - warningMs);

  const idleTimerRef = useRef<NodeJS.Timeout | null>(null);
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const isWarningOpenRef = useRef(isWarningOpen);

  useEffect(() => {
    isWarningOpenRef.current = isWarningOpen;
  }, [isWarningOpen]);

  const clearAllTimers = useCallback(() => {
    if (idleTimerRef.current) {
      clearTimeout(idleTimerRef.current);
      idleTimerRef.current = null;
    }
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }
  }, []);

  const resetIdleTimer = useCallback(() => {
    if (!enabled) return;

    // Reset warning state if user moves mouse or interacts
    if (isWarningOpenRef.current) {
      // Don't auto-dismiss warning modal on minor mouse move, let user explicitly click "Stay Logged In"
      return;
    }

    clearAllTimers();

    idleTimerRef.current = setTimeout(() => {
      // Start warning phase
      setIsWarningOpen(true);
      setSecondsLeft(warningSeconds);
    }, activeIdleTimeMs);
  }, [enabled, activeIdleTimeMs, warningSeconds, clearAllTimers]);

  // Countdown timer during warning phase
  useEffect(() => {
    if (!isWarningOpen) return;

    setSecondsLeft(warningSeconds);

    countdownIntervalRef.current = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearAllTimers();
          setIsWarningOpen(false);
          onLogout();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
        countdownIntervalRef.current = null;
      }
    };
  }, [isWarningOpen, warningSeconds, onLogout, clearAllTimers]);

  // User explicitly clicks "Tetap Login"
  const extendSession = useCallback(() => {
    setIsWarningOpen(false);
    isWarningOpenRef.current = false;
    clearAllTimers();
    resetIdleTimer();
  }, [clearAllTimers, resetIdleTimer]);

  // Global activity listeners (mouse move, keydown, click, scroll, touch)
  useEffect(() => {
    if (!enabled) {
      clearAllTimers();
      setIsWarningOpen(false);
      return;
    }

    const events = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart'];
    const handleActivity = () => {
      if (!isWarningOpenRef.current) {
        resetIdleTimer();
      }
    };

    events.forEach((event) => window.addEventListener(event, handleActivity, { passive: true }));
    resetIdleTimer();

    return () => {
      events.forEach((event) => window.removeEventListener(event, handleActivity));
      clearAllTimers();
    };
  }, [enabled, resetIdleTimer, clearAllTimers]);

  return {
    isWarningOpen,
    secondsLeft,
    extendSession,
  };
}
