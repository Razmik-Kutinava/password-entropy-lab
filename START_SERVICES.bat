@echo off
echo 🚀 Запуск сервисов для Password & Entropy Lab...

echo 📦 Запуск Vite dev сервера...
start "Vite Dev Server" cmd /k "npm run dev"

echo ⏳ Ждем запуска Vite...
timeout /t 5 /nobreak >nul

echo 🌐 Запуск ngrok туннеля...
start "Ngrok Tunnel" cmd /k "npx ngrok http 5173"

echo ⏳ Ждем запуска ngrok...
timeout /t 8 /nobreak >nul

echo 🔄 Получение ngrok URL и обновление бота...
node update-bot-url.cjs

echo.
echo 🎯 Если URL получен, запустите бота:
echo    node telegram-bot.cjs
echo.
echo 📱 Затем протестируйте в Telegram!
pause
