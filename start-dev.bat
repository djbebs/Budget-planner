@echo off
echo Killing any existing Node.js processes...
taskkill /F /IM node.exe 2>nul
timeout /t 2 /nobreak >nul

echo Starting development server...
cd /d "C:\Users\djbeb\Documents\Cursor\Program 01"
start /min cmd /c "npm run dev"
timeout /t 10 /nobreak >nul

echo Opening browser...
start http://localhost:3000

echo Done! The development server is running.
echo Press any key to exit...
pause >nul 