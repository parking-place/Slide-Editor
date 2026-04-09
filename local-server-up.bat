@echo off
setlocal
cd /d "%~dp0"
title Slide Editor Local Node Server

set "NODE_EXE="

where node >nul 2>nul
if not errorlevel 1 (
    set "NODE_EXE=node"
)

if not defined NODE_EXE (
    if exist ".tools\node\node.exe" (
        set "NODE_EXE=%CD%\.tools\node\node.exe"
    )
)

if not defined NODE_EXE (
    echo Node.js executable not found.
    echo Install Node.js or place the portable binary at .tools\node\node.exe
    exit /b 1
)

echo [Slide Editor] Starting local server on http://127.0.0.1:8000
echo [Slide Editor] Using %NODE_EXE%
echo.

"%NODE_EXE%" scripts\server.js

endlocal
