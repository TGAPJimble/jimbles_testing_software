@echo off

if exist "dist\index.html" (
    echo Production build found! Bypassing node_modules installation...
    goto start
)

echo Installing dependencies...
call npm install
if %errorlevel% neq 0 (
    echo npm install failed.
    pause
    exit /b 1
)

echo Building app...
call npm run build
if %errorlevel% neq 0 (
    echo Build failed.
    pause
    exit /b 1
)

:start
echo Starting server...
set NODE_ENV=production
node server.js
pause
