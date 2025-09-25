# 🚨 СРОЧНОЕ ИСПРАВЛЕНИЕ Mini App

## Проблема: 404 ошибка в Mini App

### ⚡ БЫСТРОЕ РЕШЕНИЕ (2 минуты):

#### 1. Запустите ngrok ВРУЧНУЮ:
Откройте **новый терминал** и выполните:
```bash
npx ngrok http 5173
```

#### 2. Получите HTTPS URL:
Ngrok покажет что-то вроде:
```
Forwarding    https://abc123-def456.ngrok-free.app -> http://localhost:5173
```
**Скопируйте** этот HTTPS URL!

#### 3. Обновите бота:
Откройте файл `telegram-bot.cjs` и найдите строку 8:
```javascript
const MINI_APP_URL = 'https://razmik-kutinava.github.io/password-entropy-lab/';
```

**Замените на ваш ngrok URL:**
```javascript
const MINI_APP_URL = 'https://abc123-def456.ngrok-free.app';
```

#### 4. Перезапустите бота:
```bash
# Остановите бота (Ctrl+C если запущен)
node telegram-bot.cjs
```

#### 5. Протестируйте:
- Найдите бота в Telegram
- `/start`
- "🔐 Открыть приложение"
- **ДОЛЖНО РАБОТАТЬ!**

---

## 🔍 Альтернативный способ получить ngrok URL:

1. Откройте браузер
2. Перейдите на: http://localhost:4040
3. Скопируйте HTTPS URL из веб-интерфейса ngrok

---

## ✅ Проверка работы:

После исправления в Mini App должно работать:
- ✅ Ввод пароля
- ✅ Анализ и рекомендации  
- ✅ Экспорт JSON
- ✅ Экспорт PDF (MainButton)

---

## 🎯 Что должно быть запущено:

1. **Vite dev server** → `npm run dev` (уже запущен)
2. **Ngrok tunnel** → `npx ngrok http 5173` 
3. **Telegram bot** → `node telegram-bot.cjs`

**После этих шагов Mini App заработает!** 🚀
