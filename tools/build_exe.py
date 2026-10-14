#!/usr/bin/env python3
"""
HRMS Pro - PyInstaller Standalone Executable Builder
=====================================================
Menyusun `uareu_bridge.py` menjadi 1 berkas `uareu_bridge.exe` mandiri
agar dapat dijalankan di PC Windows mana pun tanpa instalasi Python terpisah.

CARA PENGGUNAAN:
1. Pastikan PyInstaller terinstall: pip install pyinstaller pywin32 flask flask-cors
2. Jalankan: python build_exe.py
3. Berkas `uareu_bridge.exe` akan berada di folder `dist/`
"""

import os
import subprocess
import sys

def build_exe():
    tools_dir = os.path.dirname(os.path.abspath(__file__))
    bridge_script = os.path.join(tools_dir, "uareu_bridge.py")
    
    print("=" * 60)
    print("  HRMS Pro - Building Standalone uareu_bridge.exe")
    print("=" * 60)

    if not os.path.exists(bridge_script):
        print(f"[ERROR] Berkas {bridge_script} tidak ditemukan!")
        sys.exit(1)

    cmd = [
        sys.executable,
        "-m", "PyInstaller",
        "--onefile",
        "--noconsole",
        "--name=uareu_bridge",
        "--clean",
        bridge_script
    ]

    print(f"Executing: {' '.join(cmd)}")
    try:
        res = subprocess.run(cmd, cwd=tools_dir, check=True)
        print("\n[SUKSES] Berkas uareu_bridge.exe berhasil dibuat di folder dist/!")
    except subprocess.CalledProcessError as e:
        print(f"\n[ERROR] Gagal membuat executable. Pastikan pyinstaller terinstall (pip install pyinstaller). Error: {e}")
    except Exception as err:
        print(f"\n[ERROR] Unexpected error: {err}")

if __name__ == "__main__":
    build_exe()
