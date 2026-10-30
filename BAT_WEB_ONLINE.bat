@echo off
chcp 65001 >nul
title BluePass IELTS - Ten Mien Mien Phi https://bluepass.loca.lt
echo ============================================================================
echo   BLUEPASS IELTS - KHOI DONG MAY CHU + TEN MIEN https://bluepass.loca.lt
echo ============================================================================

cd /d "%~dp0"

echo [1/2] Dang khoi dong May Chu Web BluePass (Port 3000)...
start "BluePass Production Server" /MIN cmd /c "npm.cmd run start"
timeout /t 2 /nobreak >nul

echo [2/2] Dang kich hoat ten mien mien phi co dinh: https://bluepass.loca.lt ...
echo.
echo   🌐 LINK TRANG CHU:  https://bluepass.loca.lt
echo   👑 LINK ADMIN:      https://bluepass.loca.lt/admin
echo   🔑 Ma IP Tunnel (neu trang hoi lan dau): 171.225.184.101
echo ============================================================================
echo.
npx.cmd --yes localtunnel --port 3000 --subdomain bluepass
pause
