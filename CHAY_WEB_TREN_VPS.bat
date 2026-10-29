@echo off
chcp 65001 >nul
title BluePass IELTS - Trien Khai Tu Dong Tren Windows VPS (180.93.194.112)
echo ============================================================================
echo   BLUEPASS IELTS - KHOI CHAY TRANG WEB TREN WINDOWS VPS (180.93.194.112)
echo ============================================================================

set "SRC_DIR=%~dp0"
set "VPS_DIR=C:\BluePass_Server"

echo [1/4] Dang sao chep du an sang %VPS_DIR% tren VPS...
if not exist "%VPS_DIR%" mkdir "%VPS_DIR%"
xcopy "%SRC_DIR%*" "%VPS_DIR%\" /E /I /Y /Q >nul

echo [2/4] Dang mo cong ket noi Firewall (Port 80, 3000, 5050, 5432, 5985)...
netsh advfirewall firewall delete rule name="BluePass_Web_Ports" >nul 2>&1
netsh advfirewall firewall add rule name="BluePass_Web_Ports" dir=in action=allow protocol=TCP localport=80,3000,5050,5432,5985 >nul

powershell -NoProfile -ExecutionPolicy Bypass -Command "try { Set-NetConnectionProfile -NetworkCategory Private -ErrorAction SilentlyContinue; Enable-PSRemoting -SkipNetworkProfileCheck -Force -ErrorAction SilentlyContinue } catch {}"

echo [3/4] Dang dang ky dich vu tu khoi dong 24/7 (BluePass_AutoStart)...
schtasks /create /tn "BluePass_AutoStart_3000" /tr "\"%VPS_DIR%\node.exe\" \"%VPS_DIR%\app\server.js\"" /sc onstart /ru SYSTEM /f >nul 2>&1

echo [4/4] Dang khoi dong May Chu Web BluePass tren Port 3000 va Port 80...
taskkill /F /IM node.exe >nul 2>&1
cd /d "%VPS_DIR%\app"
set NODE_ENV=production
set HOSTNAME=0.0.0.0

set PORT=80
start "BluePass Web Server (Port 80)" /MIN "%VPS_DIR%\node.exe" server.js

set PORT=3000
start "BluePass Web Server (Port 3000)" "%VPS_DIR%\node.exe" server.js

echo.
echo ============================================================================
echo   HOAN TAT! TRANG WEB DA CHAY CONG KHAI TREN VPS:
echo   - Link 1: http://180.93.194.112:3000
echo   - Link 2: http://180.93.194.112
echo   - Trang Admin: http://180.93.194.112:3000/admin
echo ============================================================================
start http://localhost:3000
