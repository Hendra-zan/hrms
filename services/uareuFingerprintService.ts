/**
 * DigitalPersona U.are.U 4500 USB Fingerprint Service
 *
 * Dedicated integration for desktop browser attendance.
 * Designed with On-Demand Device Handle Release to prevent conflicts
 * with BPJS V-Claim / Frista apps.
 *
 * SECURITY NOTE: This service distinguishes between:
 * 1. Bridge Service Online (Software status)
 * 2. USB Fingerprint Hardware Attached (Physical USB status)
 *
 * `isConnected` is TRUE ONLY IF BOTH HTTP Bridge is active AND physical USB scanner is plugged in.
 */

export interface UareUScanResult {
  success: boolean;
  template?: string;       // Base64 Minutiae Sample (ANSI-378)
  format?: string;
  quality?: number;        // 0–100, kualitas scan (dari bridge)
  error?: string;
  hostname?: string;       // Nama PC Windows tempat alat terpasang
  ip_local?: string;       // IP lokal jaringan kantor
  source: 'hardware';      // Selalu 'hardware' — tidak ada mock
}

export interface UareUDeviceStatus {
  isConnected: boolean;          // TRUE HANYA jika Bridge aktif DAN Fisik USB Scanner tercolok
  serviceOnline: boolean;        // TRUE jika Bridge Agent HTTP server aktif
  hardwareAttached: boolean;     // TRUE jika fisik USB scanner terdeteksi
  deviceName?: string;
  sdkStatus: 'ready' | 'no_device' | 'not_running' | 'busy' | 'error';
  hostname?: string;
  ip_local?: string;
  bridgeVersion?: string;
  errorReason?: string;
}

// Urutan endpoint dicoba: 127.0.0.1 lebih cepat dari localhost pada Windows
const LOCAL_BRIDGE_URLS = [
  'http://127.0.0.1:8000/api/uareu',
  'http://localhost:8000/api/uareu',
  'http://127.0.0.1:9001/uareu',
];

const BRIDGE_CHECK_TIMEOUT_MS = 1500;
const BRIDGE_SCAN_TIMEOUT_MS  = 12000; // 10s scan window + 2s buffer

/**
 * Periksa apakah DigitalPersona WebSDK / U.are.U Local Bridge Service
 * aktif dan scanner FISIK USB terhubung di PC ini.
 *
 * DUA TINGKAT VERIFIKASI:
 * 1. Memeriksa apakah HTTP Bridge Agent aktif di 127.0.0.1 (Software Service)
 * 2. Memeriksa apakah Fisik USB Fingerprint Scanner benar-benar dicolokkan ke PC (Hardware Device)
 */
export async function checkUareUDeviceStatus(): Promise<UareUDeviceStatus> {
  for (const url of LOCAL_BRIDGE_URLS) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), BRIDGE_CHECK_TIMEOUT_MS);

      const res = await fetch(`${url}/status`, {
        method: 'GET',
        signal: controller.signal,
        headers: { 'Accept': 'application/json' },
        cache: 'no-store',
      });

      clearTimeout(timeoutId);

      if (res.ok) {
        let data: any = {};
        try {
          data = await res.json();
        } catch {
          // Jika respons berupa HTML (misal SPA rewrite Vite dev server), abaikan (bukan bridge asli)
          continue;
        }

        if (typeof data !== 'object' || data === null) {
          continue;
        }

        // Deteksi apakah perangkat keras FISIK USB absen:
        const isHardwareAbsent =
          data.deviceFound === false ||
          data.deviceAttached === false ||
          data.hardwareAttached === false ||
          data.isAttached === false ||
          data.attached === false ||
          data.deviceConnected === false ||
          data.hardwareConnected === false ||
          data.deviceCount === 0 ||
          data.readerCount === 0 ||
          data.status === 'no_device' ||
          data.status === 'disconnected' ||
          data.status === 'device_not_found' ||
          (typeof data.error === 'string' && data.error.toLowerCase().includes('device not found')) ||
          (typeof data.error === 'string' && data.error.toLowerCase().includes('no reader'));

        const isHardwarePresent = !isHardwareAbsent && (
          data.deviceFound === true ||
          data.hardwareAttached === true ||
          data.deviceAttached === true ||
          data.isAttached === true ||
          data.attached === true ||
          data.hardwareConnected === true ||
          (typeof data.deviceCount === 'number' && data.deviceCount > 0) ||
          (typeof data.readerCount === 'number' && data.readerCount > 0) ||
          data.status === 'ready' ||
          (data.connected === true && data.deviceFound !== false)
        );

        const isConnected = isHardwarePresent;

        return {
          isConnected,
          serviceOnline: true,
          hardwareAttached: isHardwarePresent,
          deviceName: isHardwarePresent
            ? (data.deviceName || 'DigitalPersona U.are.U 4500')
            : 'Perangkat USB Fingerprint Tidak Terdeteksi',
          sdkStatus: isConnected ? 'ready' : 'no_device',
          hostname: data.hostname,
          ip_local: data.ip_local,
          bridgeVersion: data.version,
          errorReason: isHardwarePresent
            ? undefined
            : 'Aplikasi Bridge aktif, tetapi alat pemindai USB Fingerprint tidak ditancapkan ke komputer ini.',
        };
      }
    } catch {
      // Endpoint ini tidak menjawab — coba berikutnya
    }
  }

  // Semua endpoint gagal: bridge agent tidak berjalan di PC ini
  return {
    isConnected: false,
    serviceOnline: false,
    hardwareAttached: false,
    sdkStatus: 'not_running',
    errorReason: 'Aplikasi HRMS Fingerprint Bridge tidak berjalan di PC ini.',
  };
}

/**
 * Ambil satu sampel sidik jari (On-Demand Mode).
 * Melepas handle USB segera setelah capture untuk menghindari konflik
 * dengan aplikasi BPJS/Frista.
 */
export async function captureUareUSample(timeoutSeconds: number = 10): Promise<UareUScanResult> {
  for (const url of LOCAL_BRIDGE_URLS) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(
        () => controller.abort(),
        Math.min(timeoutSeconds * 1000 + 2000, BRIDGE_SCAN_TIMEOUT_MS)
      );

      const res = await fetch(`${url}/scan`, {
        method: 'POST',
        signal: controller.signal,
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({
          timeout: timeoutSeconds,
          releaseImmediately: true,   // Lepas handle USB segera setelah scan
          minQuality: 40,             // Tolak scan berkualitas rendah (0-100)
        }),
        cache: 'no-store',
      });

      clearTimeout(timeoutId);

      if (!res.ok) {
        let errMsg = `Bridge error: HTTP ${res.status}`;
        try {
          const errData = await res.json();
          errMsg = errData.error || errData.message || errMsg;
        } catch {}
        return { success: false, error: errMsg, source: 'hardware' };
      }

      const data = await res.json();

      if (!data.template && !data.minutiae) {
        return {
          success: false,
          error: data.error || 'Template sidik jari tidak terbaca — pastikan USB scanner terhubung dan tempelkan jari lebih kuat.',
          source: 'hardware',
        };
      }

      return {
        success: true,
        template: data.template || data.minutiae,
        format: data.format || 'ANSI-378',
        quality: typeof data.quality === 'number' ? data.quality : undefined,
        hostname: data.hostname,
        ip_local: data.ip_local,
        source: 'hardware',
      };
    } catch (err: any) {
      if (err?.name === 'AbortError') {
        continue;
      }
    }
  }

  return {
    success: false,
    error: 'Scanner USB tidak merespons. Pastikan kabel USB scanner ditancapkan ke komputer dan Bridge Agent berjalan.',
    source: 'hardware',
  };
}

/**
 * Capture multiple samples untuk enrollment (3 scan untuk akurasi lebih baik).
 */
export async function captureEnrollmentSamples(
  sampleCount: number = 3,
  timeoutSeconds: number = 10,
  onProgress?: (current: number, total: number) => void
): Promise<{ success: boolean; samples: string[]; format: string; error?: string }> {
  const samples: string[] = [];

  for (let i = 0; i < sampleCount; i++) {
    onProgress?.(i + 1, sampleCount);
    const result = await captureUareUSample(timeoutSeconds);

    if (!result.success || !result.template) {
      return {
        success: false,
        samples,
        format: 'ANSI-378',
        error: result.error || `Gagal mengambil sampel ke-${i + 1}.`,
      };
    }

    samples.push(result.template);

    if (i < sampleCount - 1) {
      await new Promise(r => setTimeout(r, 800));
    }
  }

  return { success: true, samples, format: 'ANSI-378' };
}
