// Простой Telegram бот для Password & Entropy Lab
const TelegramBot = require('node-telegram-bot-api');

// Токен бота
const token = '8319585111:AAF8kp_kxMe1ZC_iFSB3s2ESTMbKRcZ6qJo';

// URL Mini App (пока локальный, потом заменим на GitHub Pages)
const MINI_APP_URL = 'https://scutiform-pushed-malorie.ngrok-free.dev';

// Создаем бота
const bot = new TelegramBot(token, { polling: true });

console.log('🤖 Бот Password & Entropy Lab запущен!');

// Команда /start
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  const firstName = msg.from.first_name || 'пользователь';
  
  const welcomeMessage = `🔐 Добро пожаловать в Password & Entropy Lab, ${firstName}!

Это приложение поможет вам проанализировать силу паролей по стандарту NIST 800-63B.

✅ Полностью приватно - все вычисления в вашем браузере
✅ Никаких серверов - пароли не передаются по сети
✅ Экспорт отчетов в PDF и JSON
✅ Поддержка русской клавиатуры

🚀 Нажмите кнопку ниже для запуска приложения!`;

  const options = {
    reply_markup: {
      inline_keyboard: [
        [
          {
            text: '🔐 Открыть приложение',
            web_app: { url: MINI_APP_URL }
          }
        ],
        [
          {
            text: '❓ Справка',
            callback_data: 'help'
          },
          {
            text: 'ℹ️ О приложении',
            callback_data: 'about'
          }
        ]
      ]
    }
  };

  bot.sendMessage(chatId, welcomeMessage, options);
});

// Команда /help
bot.onText(/\/help/, (msg) => {
  const chatId = msg.chat.id;
  
  const helpMessage = `❓ Справка по использованию

🔐 **Как анализировать пароль:**
1. Нажмите "🔐 Открыть приложение"
2. Введите пароль в поле ввода
3. Получите мгновенный анализ
4. Нажмите "📄 Экспорт PDF" для сохранения отчета

📊 **Что анализируется:**
• Длина и сложность пароля
• Энтропия (случайность) в битах
• Популярные пароли из словарей
• Клавиатурные последовательности (qwerty, йцукен)
• Повторы и простые паттерны
• Соответствие стандарту NIST 800-63B

🔒 **Безопасность:**
Все вычисления происходят в вашем браузере. Пароли никуда не передаются и не сохраняются.`;

  const options = {
    reply_markup: {
      inline_keyboard: [
        [
          {
            text: '🔐 Открыть приложение',
            web_app: { url: MINI_APP_URL }
          }
        ]
      ]
    }
  };

  bot.sendMessage(chatId, helpMessage, options);
});

// Команда /about
bot.onText(/\/about/, (msg) => {
  const chatId = msg.chat.id;
  
  const aboutMessage = `ℹ️ О приложении Password & Entropy Lab

🎯 **Цель:** Помочь создавать более безопасные пароли на основе научных стандартов

📋 **Стандарт:** NIST 800-63B Moderate
• Минимум 12 символов
• Запрет популярных паролей
• Учет энтропии и паттернов

💻 **Технологии:**
• Solid.js - быстрый реактивный UI
• TypeScript - типизированный код
• PDF-lib - локальная генерация PDF
• Telegram WebApp SDK

🌟 **Особенности:**
✅ Открытый исходный код
✅ Поддержка русской клавиатуры
✅ Экспорт в PDF и JSON
✅ Работает без интернета после загрузки`;

  const options = {
    reply_markup: {
      inline_keyboard: [
        [
          {
            text: '🔐 Открыть приложение',
            web_app: { url: MINI_APP_URL }
          }
        ]
      ]
    }
  };

  bot.sendMessage(chatId, aboutMessage, options);
});

// Команда /security
bot.onText(/\/security/, (msg) => {
  const chatId = msg.chat.id;
  
  const securityMessage = `🔒 Информация о безопасности

✅ **Полная приватность:**
• Все вычисления происходят в вашем браузере
• Пароли не передаются по сети
• Нет серверной обработки данных
• Открытый исходный код для аудита

🛡️ **Что НЕ сохраняется:**
• Ваши пароли
• История анализа
• Персональные данные
• Cookies с паролями

📊 **Что анализируется локально:**
• Длина и структура пароля
• Энтропия (математический расчет)
• Сравнение с встроенными словарями
• Обнаружение паттернов

🔍 **Проверить самостоятельно:**
1. Откройте DevTools (F12)
2. Вкладка Network
3. Введите пароль
4. Убедитесь - нет исходящих запросов!

⚠️ **Рекомендации:**
• Используйте уникальные пароли для каждого сервиса
• Включите двухфакторную аутентификацию
• Регулярно обновляйте пароли
• Используйте менеджер паролей`;

  const options = {
    reply_markup: {
      inline_keyboard: [
        [
          {
            text: '🔐 Открыть приложение',
            web_app: { url: MINI_APP_URL }
          }
        ]
      ]
    }
  };

  bot.sendMessage(chatId, securityMessage, options);
});

// Обработка callback кнопок
bot.on('callback_query', (callbackQuery) => {
  const message = callbackQuery.message;
  const data = callbackQuery.data;

  switch(data) {
    case 'help':
      bot.answerCallbackQuery(callbackQuery.id);
      bot.sendMessage(message.chat.id, `❓ Справка по использованию

🔐 **Как анализировать пароль:**
1. Нажмите "🔐 Открыть приложение"
2. Введите пароль в поле ввода
3. Получите мгновенный анализ
4. Нажмите "📄 Экспорт PDF" для сохранения отчета

🔒 **Безопасность:**
Все вычисления происходят в вашем браузере. Пароли никуда не передаются и не сохраняются.`, {
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: '🔐 Открыть приложение',
                web_app: { url: MINI_APP_URL }
              }
            ]
          ]
        }
      });
      break;
      
    case 'about':
      bot.answerCallbackQuery(callbackQuery.id);
      bot.sendMessage(message.chat.id, `ℹ️ О приложении Password & Entropy Lab

🎯 Анализ паролей по стандарту NIST 800-63B
💻 Технологии: Solid.js + TypeScript + PDF-lib
🔒 Полная приватность - все локально
📱 Telegram Mini App`, {
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: '🔐 Открыть приложение',
                web_app: { url: MINI_APP_URL }
              }
            ]
          ]
        }
      });
      break;
  }
});

// Обработка ошибок
bot.on('error', (error) => {
  console.error('❌ Ошибка бота:', error);
});

// Обработка polling ошибок
bot.on('polling_error', (error) => {
  console.error('❌ Ошибка polling:', error);
});
