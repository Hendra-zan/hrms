@echo off
:: ============================================================
:: HRMS Pro - U.are.U 4500 Local Bridge Service Uninstaller
:: Jalankan file ini dengan Klik Kanan -> "Run as administrator"
:: ============================================================
TITLE Uninstalling HRMS Fingerprint Bridge Windows Service...
COLOR 0C

echo ============================================================
echo   HRMS Pro - Uninstalling U.are.U 4500 Bridge Service
echo ============================================================
echo.

:: Check Admin Privilege
net session >nul 2>&1
if %errorLevel% neq 0 (
    echo [ERROR] Script ini HARUS dijalankan sebagai Administrator!
    echo Klik kanan uninstaller ini lalu pilih "Run as administrator".
    echo.
    pause
    exit /b 1
)

set SERVICE_NAME=HRMSFingerprintBridge

echo [1/3] Menghentikan proses Python U.are.U Bridge...
taskkill /F /FI "WINDOWTITLE eq HRMS*" >nul 2>&1
wmic process where "commandline like '%%uareu_bridge.py%%'" call terminate >nul 2>&1

echo [2/3] Menghapus Task Scheduler...
schtasks /delete /tn "%SERVICE_NAME%" /f >nul 2>&1

echo [3/3] Menghapus Registry Startup...
reg delete "HKLM\SOFTWARE\Microsoft\Windows\CurrentVersion\Run" /v "%SERVICE_NAME%" /f >nul 2>&1

echo.
echo ============================================================
echo   [SUKSES] Windows Service HRMS Fingerprint Bridge Dihapus!
echo ============================================================
echo.
pause
