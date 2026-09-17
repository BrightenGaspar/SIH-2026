@echo off
title AgriFlow.ai - Production System Launcher
echo ========================================================
echo   AgriFlow.ai - Starting Production System (Serverless)
echo ========================================================
echo.
echo Starting Next.js Production Web Portal (Port 3000)...
start "AgriFlow - Web Portal (3000)" cmd /k "npm run dev"
timeout /t 3 /nobreak > nul

echo.
echo Opening AgriFlow.ai Portals in browser...
start http://localhost:3000

echo.
echo ========================================================
echo   AgriFlow.ai is running!
echo   - Home Gateway:       http://localhost:3000
echo   - Farmer Portal:      http://localhost:3000/farmer
echo   - Consumer Market:    http://localhost:3000/consumer/marketplace
echo   - Logistics Fleets:   http://localhost:3000/logistics
echo   - Admin Command:      http://localhost:3000/admin
echo ========================================================
pause
