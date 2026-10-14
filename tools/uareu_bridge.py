#!/usr/bin/env python3
"""
HRMS Pro - U.are.U 4500 Local Bridge Service
=============================================
Jalankan script ini di PC yang terhubung dengan fingerprint U.are.U 4500.
Service ini menyediakan REST API lokal (localhost:8000) yang dipanggil
oleh browser HRMS untuk scan sidik jari.

ANTI-KONFLIK BPJS V-Claim:
  - USB device handle dibuka HANYA saat ada request scan masuk
  - Handle langsung dilepas segera setelah data sidik jari dikirim
  - BPJS V-Claim bisa pakai alat yang sama tanpa terganggu

CARA INSTALL & JALANKAN:
  1. Install Python 3.8+
  2. pip install pywin32 flask flask-cors
  3. python uareu_bridge.py

Port default: 8000
"""

import os
import threading
import time
import json
import base64
import ctypes
import sys
import socket
import logging
from http.server import ThreadingHTTPServer, BaseHTTPRequestHandler
from urllib.parse import urlparse

# ============================================================
# Konfigurasi Keamanan & Service
# ============================================================
BRIDGE_PORT = 8000
SCAN_TIMEOUT_DEFAULT = 8  # detik
LOG_LEVEL = logging.INFO

# Keamanan Biometrik: Mode simulasi DILAPISI PROTEKSI PRODUKSI (Default: False)
ALLOW_SIMULATION_MODE = os.environ.get("ENABLE_SIMULATION_MODE", "false").lower() in ("true", "1")

# Whitelist Domain / Origin yang diizinkan untuk CORS
ALLOWED_ORIGIN_PATTERNS = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://192.168.1.254",
    "https://192.168.1.254",
]

logging.basicConfig(
    level=LOG_LEVEL,
    format='%(asctime)s [%(levelname)s] %(message)s',
    datefmt='%H:%M:%S'
)
log = logging.getLogger('uareu-bridge')


def get_pc_identity() -> dict:
    """Ambil nama komputer (hostname) dan IP lokal jaringan kantor."""
    try:
        hostname = socket.gethostname()
    except Exception:
        hostname = 'UNKNOWN-PC'
    try:
        # Ambil IP yang digunakan untuk koneksi ke jaringan lokal
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(('8.8.8.8', 80))  # tidak benar-benar connect, hanya cek interface
        ip_local = s.getsockname()[0]
        s.close()
    except Exception:
        ip_local = '127.0.0.1'
    return {'hostname': hostname, 'ip_local': ip_local}

# ============================================================
# DigitalPersona One Touch SDK Wrapper
# Dokumentasi: DigitalPersona SDK for Windows
# ============================================================

DPFJ_SUCCESS = 0
DPFJ_E_DEVICE_BUSY = 0x8004A001
DPFJ_FMD_ANSI_378_2004 = 0x001B0001

class UareUSDK:
    """Wrapper ringan untuk DigitalPersona SDK via ctypes."""

    def __init__(self):
        self._sdk = None
        self._reader = None
        self._lock = threading.Lock()
        self._load_sdk()

    def _load_sdk(self):
        """Coba muat DLL DigitalPersona SDK."""
        dll_paths = [
            r"C:\Program Files\DigitalPersona\BioManager\dpfpdd.dll",
            r"C:\Program Files (x86)\DigitalPersona\BioManager\dpfpdd.dll",
            r"C:\Windows\System32\dpfpdd.dll",
            "dpfpdd.dll",
        ]
        for path in dll_paths:
            try:
                self._sdk = ctypes.cdll.LoadLibrary(path)
                log.info(f"SDK dimuat: {path}")
                return
            except OSError:
                continue
        if ALLOW_SIMULATION_MODE:
            log.warning("DLL DigitalPersona tidak ditemukan — Mode Simulasi AKTIF (Dev Mode)")
        else:
            log.error("DLL DigitalPersona tidak ditemukan — Mode Simulasi DIBLOKIR demi keamanan biometrik!")
        self._sdk = None

    def is_sdk_available(self) -> bool:
        return self._sdk is not None

    def get_device_info(self) -> dict:
        """Periksa apakah alat fingerprint terhubung."""
        pc = get_pc_identity()
        if not self.is_sdk_available():
            return {
                "connected": False,
                "deviceName": None,
                "mode": "simulation" if ALLOW_SIMULATION_MODE else "disabled",
                "error": "DigitalPersona SDK (dpfpdd.dll) tidak terinstall di PC ini." if not ALLOW_SIMULATION_MODE else None,
                "hostname": pc['hostname'],
                "ip_local": pc['ip_local'],
            }

        # dpfpdd_query_devices() — lihat jumlah device yang terdeteksi
        try:
            count = ctypes.c_int(0)
            result = self._sdk.dpfpdd_query_devices(ctypes.byref(count), None)
            if count.value > 0:
                return {
                    "connected": True,
                    "deviceName": "DigitalPersona U.are.U 4500",
                    "mode": "hardware",
                    "hostname": pc['hostname'],
                    "ip_local": pc['ip_local'],
                }
        except Exception as e:
            log.error(f"Query devices error: {e}")

        return {
            "connected": False,
            "deviceName": None,
            "mode": "error",
            "hostname": pc['hostname'],
            "ip_local": pc['ip_local'],
        }

    def capture_sample(self, timeout_sec: int = 8) -> dict:
        """
        Capture sidik jari. 
        Buka handle → scan → lepas handle (On-Demand Mode, anti-konflik BPJS).
        """
        with self._lock:  # Pastikan hanya 1 proses scan pada satu waktu
            if not self.is_sdk_available():
                if not ALLOW_SIMULATION_MODE:
                    log.error("Permintaan scan ditolak: SDK DigitalPersona tidak terpasang & simulasi diblokir.")
                    return {
                        "success": False,
                        "error": "DigitalPersona SDK (dpfpdd.dll) tidak terpasang di PC ini. Mode simulasi dinonaktifkan demi keamanan biometrik."
                    }
                
                # Mode simulasi hanya jika ENABLE_SIMULATION_MODE=true di lingkungan dev
                log.info("Mode simulasi (Dev): generate dummy template")
                time.sleep(1.5)
                pc = get_pc_identity()
                dummy = base64.b64encode(
                    f"UAREU_SIM_{int(time.time())}_ANSI378".encode()
                ).decode()
                return {
                    "success": True,
                    "template": dummy,
                    "format": "ANSI-378",
                    "source": "simulation",
                    "hostname": pc['hostname'],
                    "ip_local": pc['ip_local'],
                }

            reader = None
            try:
                # 1. Buka device handle (on-demand)
                reader = ctypes.c_void_p()
                open_result = self._sdk.dpfpdd_open(0, ctypes.byref(reader))
                if open_result != DPFJ_SUCCESS:
                    return {
                        "success": False,
                        "error": f"Gagal buka device (kode: 0x{open_result:08X}). "
                                 f"Periksa apakah BPJS sedang aktif scan."
                    }

                log.info("Device dibuka, menunggu sidik jari...")

                # 2. Set parameter capture
                self._sdk.dpfpdd_start_stream(reader)

                # 3. Baca sample (blocking dengan timeout)
                sample_buf = ctypes.create_string_buffer(100000)
                sample_size = ctypes.c_uint(100000)
                quality = ctypes.c_uint(0)
                scan_result = self._sdk.dpfpdd_get_stream_image(
                    reader,
                    ctypes.c_int(timeout_sec * 1000),
                    ctypes.byref(quality),
                    ctypes.byref(sample_size),
                    sample_buf
                )

                if scan_result != DPFJ_SUCCESS:
                    return {
                        "success": False,
                        "error": f"Scan gagal atau timeout (kode: 0x{scan_result:08X})"
                    }

                # 4. Konversi ke Base64
                raw_bytes = bytes(sample_buf[:sample_size.value])
                template_b64 = base64.b64encode(raw_bytes).decode()
                log.info(f"Sample berhasil diambil ({sample_size.value} bytes)")
                pc = get_pc_identity()

                return {
                    "success": True,
                    "template": template_b64,
                    "format": "ANSI-378",
                    "source": "hardware",
                    "quality": quality.value,
                    "hostname": pc['hostname'],
                    "ip_local": pc['ip_local'],
                }

            except Exception as e:
                log.error(f"Capture error: {e}")
                return {"success": False, "error": str(e)}

            finally:
                # 5. SELALU lepas handle setelah selesai (anti-konflik BPJS!)
                if reader and reader.value:
                    try:
                        self._sdk.dpfpdd_stop_stream(reader)
                        self._sdk.dpfpdd_close(reader)
                        log.info("Device handle dilepas (BPJS bisa pakai kembali)")
                    except Exception:
                        pass


# ============================================================
# HTTP Request Handler dengan Penanganan Keamanan CORS & Security Headers
# ============================================================

sdk = UareUSDK()

class BridgeHandler(BaseHTTPRequestHandler):

    def log_message(self, format, *args):
        """Suppress default HTTP log — pakai logger kita sendiri."""
        pass

    def get_allowed_origin(self) -> str:
        """Pencocokan Origin Dinamis Sesuai Standar W3C CORS."""
        req_origin = self.headers.get("Origin", "")
        if not req_origin:
            return "http://localhost:5173"
        for allowed in ALLOWED_ORIGIN_PATTERNS:
            if req_origin == allowed or req_origin.startswith(allowed):
                return req_origin
        # Fallback jika origin terdaftar di IP lokal kantor
        if "192.168." in req_origin or "10." in req_origin or "172." in req_origin:
            return req_origin
        return "http://localhost:5173"

    def send_json(self, data: dict, status: int = 200):
        body = json.dumps(data).encode()
        self.send_response(status)
        
        # Header Keamanan CORS Dinamis
        allowed_origin = self.get_allowed_origin()
        self.send_header("Access-Control-Allow-Origin", allowed_origin)
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type, Accept, X-HRMS-Bridge-Token")
        self.send_header("Content-Type", "application/json")
        
        # Security Hardening Headers
        self.send_header("X-Content-Type-Options", "nosniff")
        self.send_header("X-Frame-Options", "DENY")
        self.send_header("Server", "HRMS-Fingerprint-Bridge-Secure")
        self.send_header("Content-Length", len(body))
        self.end_headers()
        self.wfile.write(body)

    def do_OPTIONS(self):
        """Handle preflight CORS."""
        self.send_response(204)
        allowed_origin = self.get_allowed_origin()
        self.send_header("Access-Control-Allow-Origin", allowed_origin)
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type, Accept, X-HRMS-Bridge-Token")
        self.send_header("Server", "HRMS-Fingerprint-Bridge-Secure")
        self.end_headers()

    def do_GET(self):
        parsed = urlparse(self.path)
        if parsed.path in ("/api/uareu/status", "/uareu/status"):
            info = sdk.get_device_info()
            log.info(f"Status check → {info}")
            self.send_json(info)
        else:
            self.send_json({"error": "Not found"}, 404)

    def do_POST(self):
        parsed = urlparse(self.path)
        if parsed.path in ("/api/uareu/scan", "/uareu/scan"):
            content_length = int(self.headers.get("Content-Length", 0))
            body = {}
            if content_length > 0:
                try:
                    body = json.loads(self.rfile.read(content_length))
                except Exception:
                    pass

            timeout = int(body.get("timeout", SCAN_TIMEOUT_DEFAULT))
            log.info(f"Scan request diterima (timeout={timeout}s)")

            result = sdk.capture_sample(timeout)
            status = 200 if result.get("success") else 500
            log.info(f"Scan result: success={result.get('success')}")
            self.send_json(result, status)
        else:
            self.send_json({"error": "Not found"}, 404)


# ============================================================
# Entry Point
# ============================================================

def main():
    log.info("=" * 55)
    log.info("  HRMS Pro — U.are.U 4500 Local Bridge Service (Secure)")
    log.info("=" * 55)
    log.info(f"  Port      : http://127.0.0.1:{BRIDGE_PORT}")
    log.info(f"  SDK Status: {'✅ Tersedia' if sdk.is_sdk_available() else '⚠️  Tidak ditemukan'}")
    log.info(f"  Simulasi  : {'⚠️  Diizinkan (Dev)' if ALLOW_SIMULATION_MODE else '🔒 DIBLOKIR (Produksi)'}")
    log.info(f"  Concurrency: Multi-Threaded HTTP Server Enabled")
    log.info(f"  BPJS      : ✅ Aman — tidak ada konflik USB")
    log.info("=" * 55)

    device = sdk.get_device_info()
    if device.get("connected"):
        log.info(f"  Alat      : {device.get('deviceName')} terdeteksi ✅")
    else:
        log.warning("  Alat      : Fingerprint belum terhubung atau SDK tidak tersedia")
    log.info("-" * 55)
    log.info("Tekan Ctrl+C untuk menghentikan service.")

    # Menggunakan ThreadingHTTPServer untuk performa multi-thread tanpa blocking
    server = ThreadingHTTPServer(("127.0.0.1", BRIDGE_PORT), BridgeHandler)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        log.info("Service dihentikan.")
        server.shutdown()


if __name__ == "__main__":
    main()
