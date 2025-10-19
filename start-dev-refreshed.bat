@echo off
setlocal
pushd "%~dp0"

echo.
echo ==============================================
echo   Starting Dev Server (Refreshed UI mode)
echo   REACT_APP_UI=refreshed
echo ==============================================
echo.

set "REACT_APP_UI=refreshed"
call npm run clean 2>nul

if not exist "node_modules" (
  call npm install || goto :eof
)

call npm run dev || call npm start

popd
endlocal
