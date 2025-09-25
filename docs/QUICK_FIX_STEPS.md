# ⚡ БЫСТРОЕ ИСПРАВЛЕНИЕ - 3 простых шага

## 🎯 Цель: Заставить Mini App работать в Telegram боте

### ШАГ 1: Запустите ngrok
```bash
# В новом терминале:
npx ngrok http 5173
```
**Результат:** Получите URL типа `https://abc123.ngrok.io`

### ШАГ 2: Обновите бота
В файле `telegram-bot.cjs` строку 6:
```javascript
// БЫЛО:
const MINI_APP_URL = 'https://razmik-kutinava.github.io/password-entropy-lab/';

// СТАЛО (замените на ваш ngrok URL):
const MINI_APP_URL = 'https://abc123.ngrok.io';
```

### ШАГ 3: Перезапустите бота
```bash
# Остановите бота: Ctrl+C
# Запустите снова:
node telegram-bot.cjs
```

## 🎉 ГОТОВО!

Теперь в Telegram:
1. Найдите вашего бота
2. `/start`
3. Нажмите "🔐 Открыть приложение"
4. **ДОЛЖНО РАБОТАТЬ!**

---

## 📋 Параллельно исправьте GitHub Pages:

1. https://github.com/Razmik-Kutinava/password-entropy-lab
2. **Settings** → **Pages**
3. **Source**: **GitHub Actions**
4. **Save**

Через 5-10 минут приложение заработает по постоянному адресу.
