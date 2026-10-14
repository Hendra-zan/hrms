/**
 * hooks/ess-attendance/useESSGeoLocation.ts
 * Helper hook untuk resolusi GPS browser dan validasi radius geofencing kantor.
 */

import { useMemo } from 'react';

export function useESSGeoLocation() {
  const officeLat = Number(import.meta.env.VITE_ATTENDANCE_CENTER_LAT || '0');
  const officeLng = Number(import.meta.env.VITE_ATTENDANCE_CENTER_LNG || '0');
  const officeRadiusMeters = Number(import.meta.env.VITE_ATTENDANCE_RADIUS_METERS || '300');
  const isGeofenceConfigured = useMemo(
    () => Number.isFinite(officeLat) && Number.isFinite(officeLng) && officeLat !== 0 && officeLng !== 0,
    [officeLat, officeLng]
  );

  const resolveCurrentLocation = async (): Promise<{ location: string; latitude?: number; longitude?: number }> => {
    if (typeof navigator === 'undefined' || !('geolocation' in navigator)) {
      return { location: 'Portal Mobile (lokasi tidak tersedia)' };
    }
    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const latitude = Number(position.coords.latitude.toFixed(6));
          const longitude = Number(position.coords.longitude.toFixed(6));
          resolve({
            location: `GPS ${latitude.toFixed(5)}, ${longitude.toFixed(5)}`,
            latitude,
            longitude,
          });
        },
        () => {
          resolve({ location: 'Portal Mobile (lokasi gagal dideteksi)' });
        },
        { enableHighAccuracy: false, timeout: 7000, maximumAge: 30000 }
      );
    });
  };

  return {
    officeLat,
    officeLng,
    officeRadiusMeters,
    isGeofenceConfigured,
    resolveCurrentLocation,
  };
}
