@echo off
setlocal
cd /d "%~dp0"
title Slide Editor Multi-Arch Release

set "IMAGE_NAME=parkingplace/slide-editor"
set "VERSION_TAG=%~1"

if "%VERSION_TAG%"=="" (
    echo Usage: docker-multiarch-release.bat ^<version-tag^>
    echo Example: docker-multiarch-release.bat v0.12.0
    exit /b 1
)

where docker >nul 2>nul
if errorlevel 1 (
    echo Docker CLI를 찾을 수 없습니다.
    exit /b 1
)

echo [Slide Editor] Multi-arch build and push
echo   Image  : %IMAGE_NAME%
echo   Version: %VERSION_TAG%
echo.

docker buildx build ^
  --platform linux/amd64,linux/arm64 ^
  -t %IMAGE_NAME%:%VERSION_TAG% ^
  -t %IMAGE_NAME%:latest ^
  --push .

if errorlevel 1 (
    echo.
    echo Multi-arch build or push failed.
    exit /b 1
)

echo.
echo Done.
docker buildx imagetools inspect %IMAGE_NAME%:%VERSION_TAG%

endlocal
