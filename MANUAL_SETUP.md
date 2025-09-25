# 📋 РУЧНАЯ НАСТРОЙКА - Пошаговая инструкция

## 🎯 Цель: Запустить Mini App в Telegram боте

### ШАГ 1: Откройте 3 терминала

#### Терминал 1 - Vite Dev Server:
```bash
npm run dev
```
**Результат:** `Local: http://localhost:5173/`

#### Терминал 2 - Ngrok:
```bash
npx ngrok http 5173
```
**Результат:** URL типа `https://abc123.ngrok-free.app`

#### Терминал 3 - Обновление бота:
```bash
node update-bot-url.cjs
```
**Результат:** Автоматически обновит URL в боте

### ШАГ 2: Если автообновление не сработало

Откройте файл `telegram-bot.cjs` и найдите строку 6:
```javascript
const MINI_APP_URL = 'https://razmik-kutinava.github.io/password-entropy-lab/';
```

Замените на ваш ngrok URL:
```javascript
const MINI_APP_URL = 'https://your-ngrok-url.ngrok-free.app';
```

### ШАГ 3: Запустите бота
```bash
node telegram-bot.cjs
```
**Результат:** `🤖 Бот Password & Entropy Lab запущен!`

### ШАГ 4: Тестирование в Telegram

1. **Найдите вашего бота** в Telegram
2. **Напишите:** `/start`
3. **Нажмите:** "🔐 Открыть приложение"
4. **Должно открыться:** ваше Mini App

### ШАГ 5: Проверьте функции

- ✅ Ввод пароля работает
- ✅ Анализ отображается
- ✅ Экспорт JSON (кнопка в приложении)
- ✅ Экспорт PDF (MainButton в Telegram)

## 🔧 Если что-то не работает:

### Vite не запускается:
- Убедитесь, что находитесь в папке проекта
- Проверьте: `npm install`

### Ngrok не работает:
- Попробуйте: `npm install -g ngrok`
- Или используйте: `npx ngrok http 5173`

### Бот не отвечает:
- Проверьте токен в `telegram-bot.cjs`
- Убедитесь, что бот запущен

### Mini App не открывается:
- Проверьте, что ngrok URL правильный
- URL должен быть HTTPS
- Попробуйте обновить чат с ботом

## 🎉 Готово!

После выполнения всех шагов ваш Mini App должен работать в Telegram!
