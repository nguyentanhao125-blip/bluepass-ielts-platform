@echo off
chcp 65001 >nul
title BluePass IELTS - May Chu Web + Cloudflare Tunnel (Online Mien Phi)
echo ============================================================================
echo   BLUEPASS IELTS - KHOI DONG MAY CHU SIEU TOC + CLOUDFLARE TUNNEL
echo ============================================================================

cd /d "%~dp0"

echo [1/2] Dang khoi dong May Chu Web BluePass (Port 3000)...
start "BluePass Production Server" /MIN cmd /c "npm.cmd run start"
timeout /t 2 /nobreak >nul

echo [2/2] Dang mo duong truyen Internet cong khai qua Cloudflare Tunnel...
echo.
echo   Hay nhin dong khung chua link "https://....trycloudflare.com" ben duoi
echo   de copy gui cho hoc sinh truy cap tu bat ky dau (Dien thoai / Laptop)!
echo ============================================================================
echo.
"%LOCALAPPDATA%\cloudflared\cloudflared.exe" tunnel --url http://localhost:3000
pause
