@echo off
setlocal
cd /d "%~dp0"
title Slide Editor Docker Compose

where docker >nul 2>nul
if errorlevel 1 (
    echo Docker CLI를 찾을 수 없습니다.
    echo Docker Desktop 또는 Docker Engine이 설치되어 있는지 확인하세요.
    exit /b 1
)

echo [Slide Editor] docker compose pull
docker compose pull

if errorlevel 1 (
    echo.
    echo Docker Compose pull에 실패했습니다.
    exit /b 1
)

echo [Slide Editor] docker compose up -d
docker compose up -d

if errorlevel 1 (
    echo.
    echo Docker Compose 실행에 실패했습니다.
    exit /b 1
)

echo.
echo Slide Editor 컨테이너가 실행되었습니다.
docker compose ps

endlocal
