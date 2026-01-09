@echo off
cd /d "%~dp0"
echo Installing dependencies if needed...
call npm install
echo.
echo Starting server on port 3000...
set PORT=3000
call npm start

