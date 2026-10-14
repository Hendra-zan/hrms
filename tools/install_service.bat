@echo off
:: ============================================================
:: HRMS Pro - U.are.U 4500 Local Bridge Windows Service Installer
:: Jalankan file ini dengan Klik Kanan -> "Run as administrator"
:: ============================================================
TITLE Installing HRMS Fingerprint Bridge Windows Service...
COLOR 0A

echo ============================================================
echo   HRMS Pro - Installing U.are.U 4500 Bridge Service
echo ============================================================
echo.

:: Check Admin Privilege
net session >nul 2>&1
if %errorLevel% neq 0 (
    COLOR 0C
    echo [ERROR] Script ini HARUS dijalankan sebagai Administrator!
    echo Klik kanan installer ini lalu pilih "Run as administrator".
    echo.
    pause
    exit /b 1
)

set SERVICE_NAME=HRMSFingerprintBridge
set DISPLAY_NAME=HRMS Pro Fingerprint Bridge (U.are.U 4500)
set SCRIPT_DIR=%~dp0
set STANDALONE_EXE=%SCRIPT_DIR%dist\uareu_bridge.exe
if not exist "%STANDALONE_EXE%" set STANDALONE_EXE=%SCRIPT_DIR%uareu_bridge.exe
set BRIDGE_SCRIPT=%SCRIPT_DIR%uareu_bridge.py

:: Periksa ketersediaan executable standalone vs Python
if exist "%STANDALONE_EXE%" (
    echo [INFO] Berkas Standalone Executable (%STANDALONE_EXE%) terdeteksi.
    set RUN_CMD="%STANDALONE_EXE%"
) else (
    where python >nul 2>&1
    if %errorLevel% neq 0 (
        COLOR 0C
        echo [ERROR] Python 3 maupun Standalone EXE tidak ditemukan!
        echo Harap install Python 3.8+ dan centang "Add Python to PATH", atau gunakan uareu_bridge.exe.
        echo.
        pause
        exit /b 1
    )
    echo [1/4] Memeriksa & menginstall dependensi Python (pywin32, flask)...
    python -m pip install pywin32 flask flask-cors --quiet >nul 2>&1
    set RUN_CMD=python "%BRIDGE_SCRIPT%"
)

:: Hapus service lama jika ada
echo [2/4] Membersihkan service lama jika ada...
sc stop %SERVICE_NAME% >nul 2>&1
sc delete %SERVICE_NAME% >nul 2>&1

:: Buat startup VBS wrapper untuk running di background tanpa jendela console hitam
echo [3/4] Membuat wrapper background runner...
set VBS_SCRIPT=%SCRIPT_DIR%run_bridge_background.vbs
(
echo Set WshShell = CreateObject^("WScript.Shell"^^)
echo WshShell.Run "%RUN_CMD%", 0, False
) > "%VBS_SCRIPT%"

:: Registrasi ke Windows Task Scheduler Auto-Start (agar berjalan saat boot/startup sistem)
echo [4/4] Mendaftarkan service otomatis saat Windows booting...
schtasks /create /tn "%SERVICE_NAME%" /tr "wscript.exe \"%VBS_SCRIPT%\"" /sc onstart /ru "SYSTEM" /f >nul 2>&1

if %errorLevel% eq 0 (
    echo.
    echo ============================================================
    echo   [SUKSES] Windows Service HRMS Fingerprint Bridge Berhasil Dipasang!
    echo ============================================================
    echo   • Service Name : %SERVICE_NAME%
    echo   • Mode         : Auto-Start saat Windows Boot (SYSTEM)
    echo   • Background   : Ya (Tanpa Jendela Console Hitam)
    echo.
    echo Menjalankan service sekarang...
    schtasks /run /tn "%SERVICE_NAME%" >nul 2>&1
    echo Service telah AKTIF dan berjalan di port http://localhost:8000
    echo.
) else (
    :: Fallback registrasi via Registry Startup jika schtasks dibatasi
    echo Pendaftaran Task Scheduler gagal, menggunakan fallback Registry Startup...
    reg add "HKLM\SOFTWARE\Microsoft\Windows\CurrentVersion\Run" /v "%SERVICE_NAME%" /t REG_SZ /d "wscript.exe \"%VBS_SCRIPT%\"" /f >nul 2>&1
    echo.
    echo [SUKSES] Service terdaftar di Registry Startup Windows!
    wscript.exe "%VBS_SCRIPT%"
)

pause
