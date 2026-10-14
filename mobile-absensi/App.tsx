import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from './src/features/auth/AuthContext';
import { AppShell } from './src/shell/AppShell';
import { ErrorBoundary } from './src/components/ErrorBoundary';
import { ForceUpdateGate } from './src/components/ForceUpdateGate';
import { SystemSettingsProvider } from './src/contexts/SystemSettingsContext';
import { initErrorReporting } from './src/services/errorReportingService';

export default function App() {
  // Init Sentry sekali di root. No-op bila SDK belum ter-install (dev).
  useEffect(() => {
    initErrorReporting();
  }, []);

  return (
    <SafeAreaProvider>
      <ErrorBoundary>
        <SystemSettingsProvider>
          <ForceUpdateGate>
            <AuthProvider>
              <StatusBar style="dark" />
              <AppShell />
            </AuthProvider>
          </ForceUpdateGate>
        </SystemSettingsProvider>
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}
