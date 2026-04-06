@echo off
chcp 65001 >nul
setlocal
cd /d "%~dp0"
title HPE VME Editor Server

:: Fix UTF-8 BOM for PowerShell 5.1
powershell -NoProfile -Command "[System.IO.File]::WriteAllText('local_server.ps1', [System.IO.File]::ReadAllText('local_server.ps1', [System.Text.Encoding]::UTF8), [System.Text.Encoding]::UTF8)"

:: Set OutputEncoding and Execute
powershell -ExecutionPolicy Bypass -NoProfile -Command "[Console]::OutputEncoding = [System.Text.Encoding]::UTF8; & '.\local_server.ps1'"
