@echo off
chcp 65001 >nul
title BluePass IELTS - https://bluepass-ielts.serveousercontent.com
echo ============================================================================
echo   BLUEPASS IELTS - KHOI DONG MAY CHU + TEN MIEN CONG KHAI CO DINH
echo ============================================================================

cd /d "%~dp0"

echo [1/2] Dang khoi dong May Chu Web BluePass (Port 3000)...
start "BluePass Production Server" /MIN cmd /c "npm.cmd run start"
timeout /t 2 /nobreak >nul

echo.
echo   🌐 Link Cong Khai Co Dinh:  https://bluepass-ielts.serveousercontent.com
echo   👑 Link Admin Cong Khai:    https://bluepass-ielts.serveousercontent.com/admin
echo   💻 Link Tren May Tinh:      http://bluepass.lvh.me:3000
echo.
echo [2/2] Dang giu ket noi ten mien https://bluepass-ielts.serveousercontent.com (Tu dong ket noi lai 24/7)...
echo ============================================================================
echo.
:loop
ssh.exe -T -o StrictHostKeyChecking=no -o ServerAliveInterval=20 -o ServerAliveCountMax=3 -R bluepass-ielts:80:localhost:3000 serveo.net
timeout /t 2 /nobreak >nul
goto loop
