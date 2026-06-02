@echo off
title La Bella Italia — Сервер
cd /d "%~dp0server"
echo ========================================
echo    🍕 La Bella Italia — Запуск сервера
echo ========================================
echo.
echo Установка зависимостей...
call npm install --loglevel=warn
echo.
echo Запуск сервера...
echo.
rem Ждём 3 секунды, чтобы сервер успел подняться
timeout /t 3 /nobreak >nul
start http://localhost:3000/
node server.js
