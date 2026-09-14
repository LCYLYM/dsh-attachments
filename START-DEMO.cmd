@echo off
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (echo Node.js is required. & pause & exit /b 1)
node demo\server.mjs
pause
