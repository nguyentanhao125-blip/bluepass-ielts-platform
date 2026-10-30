@echo off
chcp 65001 >nul
title BluePass IELTS - May Chu Web + Ten Mien Mien Phi (Cloudflare / bluepass.lvh.me)
echo ============================================================================
echo   BLUEPASS IELTS - KHOI DONG MAY CHU SIEU TOC + TEN MIEN MIEN PHI
echo ============================================================================

cd /d "%~dp0"

echo [1/2] Dang khoi dong May Chu Web BluePass (Port 3000)...
start "BluePass Production Server" /MIN cmd /c "npm.cmd run start"
timeout /t 2 /nobreak >nul

echo.
echo   🌐 Link ten mien BluePass tren may:  http://bluepass.lvh.me:3000
echo   👑 Link Admin BluePass tren may:     http://bluepass.lvh.me:3000/admin
echo.
echo [2/2] Dang mo duong truyen Internet cong khai qua Cloudflare Tunnel...
echo ============================================================================
echo.
"%LOCALAPPDATA%\cloudflared\cloudflared.exe" tunnel --url http://localhost:3000 --no-autoupdate
pause
