// Простой Telegram бот для Password & Entropy Lab
const TelegramBot = require('node-telegram-bot-api');

// Токен бота
const token = '8319585111:AAF8kp_kxMe1ZC_iFSB3s2ESTMbKRcZ6qJo';

// URL Mini App на Railway
const MINI_APP_URL = 'https://password-entropy-lab-production.up.railway.app';

// Создаем бота
const bot = new TelegramBot(token, { polling: true });

console.log('🤖 Бот Password & Entropy Lab запущен!');

// Команда /start
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  const firstName = msg.from.first_name || 'пользователь';
  
  const welcomeMessage = `🔐 Добро пожаловать в Password & Entropy Lab, ${firstName}!

🛡️ **Профессиональный анализатор паролей** с поддержкой 10 стандартов безопасности!

**🎯 Что проверяется:**
• Длина и сложность пароля
• Энтропия (случайность) в битах  
• Популярные пароли из словарей
• Клавиатурные последовательности
• Повторы и паттерны
• Соответствие выбранному стандарту

**🛡️ 10 Стандартов безопасности:**
🔰 **Для себя:** Basic Security, NIST Modern, OWASP Web
💼 **Для бизнеса:** PCI DSS, Microsoft AD, Google Workspace  
🎖️ **Экспертные:** Military Level, Banking Grade, ISO 27001
🌍 **Региональные:** GDPR Ready

**✨ Возможности:**
✅ Полностью приватно - все в браузере
✅ Детальные отчеты с конкретными ошибками
✅ Экспорт в PDF и JSON
✅ Адаптивный дизайн для мобильных
✅ Поддержка русской клавиатуры

🚀 Нажмите кнопку ниже для запуска!`;

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
            text: '📱 Установить приложение',
            url: 'https://password-entropy-lab-production.up.railway.app/?from=telegram&show_instructions=true'
          }
        ],
        [
          {
            text: '📱 Установить приложение',
            url: 'https://password-entropy-lab-production.up.railway.app/?from=telegram&show_instructions=true'
          }
        ],
        [
          {
            text: '🛡️ Стандарты',
            callback_data: 'standards'
          },
          {
            text: '❓ Справка',
            callback_data: 'help'
          }
        ],
        [
          {
            text: 'ℹ️ О приложении',
            callback_data: 'about'
          },
          {
            text: '🔒 Безопасность',
            callback_data: 'security'
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
2. Выберите стандарт безопасности из 10 доступных
3. Введите пароль в поле ввода
4. Получите детальный анализ с конкретными ошибками
5. Экспортируйте отчет в PDF или JSON

📊 **Детальные критерии проверки:**
• **Длина:** минимум 8-16 символов (зависит от стандарта)
• **Энтропия:** 30-55+ бит случайности
• **Классы символов:** строчные, заглавные, цифры, спецсимволы
• **Популярные пароли:** проверка по словарям
• **Паттерны:** qwerty, 123, abc, повторы
• **Последовательности:** клавиатурные и числовые
• **Персональная информация:** даты, имена

🛡️ **10 Стандартов безопасности:**
🔰 **Basic Security** - 8+ символов, 30+ бит
🇺🇸 **NIST Modern** - 12+ символов, 35+ бит  
🌐 **OWASP Web** - 10+ символов, 40+ бит
💳 **PCI DSS** - 12+ символов, 40+ бит
🏢 **Microsoft AD** - 14+ символов, 42+ бит
🔍 **Google Workspace** - 12+ символов, 38+ бит
🎖️ **Military Level** - 16+ символов, 55+ бит
🏦 **Banking Grade** - 15+ символов, 50+ бит
📋 **ISO 27001** - 13+ символов, 45+ бит
🇪🇺 **GDPR Ready** - 11+ символов, 36+ бит

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
        ],
        [
          {
            text: '📱 Установить приложение',
            url: 'https://password-entropy-lab-production.up.railway.app/?from=telegram&show_instructions=true'
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

🎯 **Цель:** Профессиональный анализ паролей по 10 международным стандартам безопасности

🛡️ **Поддерживаемые стандарты:**
• **NIST 800-63B** - современный американский стандарт
• **OWASP** - для веб-приложений
• **PCI DSS** - для платежных систем
• **Microsoft AD** - корпоративные сети
• **Google Workspace** - облачные сервисы
• **Military Level** - военные требования
• **Banking Grade** - банковская безопасность
• **ISO 27001** - международный стандарт
• **GDPR Ready** - европейская защита данных
• **Basic Security** - минимальные требования

📊 **Анализ включает:**
• Детальную проверку по каждому критерию
• Конкретные ошибки с объяснениями
• Рекомендации по улучшению
• Сравнительный анализ по всем стандартам
• Профессиональные отчеты

💻 **Технологии:**
• Solid.js - быстрый реактивный UI
• TypeScript - типизированный код
• PDF-lib - локальная генерация PDF
• Telegram WebApp SDK
• Адаптивный дизайн

🌟 **Особенности:**
✅ 10 стандартов безопасности
✅ Детальные отчеты с ошибками
✅ Экспорт в PDF и JSON
✅ Адаптивный дизайн
✅ Полная приватность
✅ Открытый исходный код`;

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
            text: '📱 Установить приложение',
            url: 'https://password-entropy-lab-production.up.railway.app/?from=telegram&show_instructions=true'
          }
        ]
      ]
    }
  };

  bot.sendMessage(chatId, aboutMessage, options);
});

// Команда /standards
bot.onText(/\/standards/, (msg) => {
  const chatId = msg.chat.id;
  
  const standardsMessage = `🛡️ 10 Стандартов безопасности

**🔰 ДЛЯ СЕБЯ:**
🔒 **Basic Security** - 8+ символов, 30+ бит
🇺🇸 **NIST Modern** - 12+ символов, 35+ бит
🌐 **OWASP Web** - 10+ символов, 40+ бит

**💼 ДЛЯ БИЗНЕСА:**
💳 **PCI DSS** - 12+ символов, 40+ бит
🏢 **Microsoft AD** - 14+ символов, 42+ бит
🔍 **Google Workspace** - 12+ символов, 38+ бит

**🎖️ ЭКСПЕРТНЫЕ:**
🎖️ **Military Level** - 16+ символов, 55+ бит
🏦 **Banking Grade** - 15+ символов, 50+ бит
📋 **ISO 27001** - 13+ символов, 45+ бит

**🌍 РЕГИОНАЛЬНЫЕ:**
🇪🇺 **GDPR Ready** - 11+ символов, 36+ бит

**📊 Что проверяется:**
• Длина пароля (8-16 символов)
• Энтропия (30-55+ бит)
• Классы символов (4 типа)
• Популярные пароли
• Клавиатурные паттерны
• Последовательности
• Персональная информация

**💡 Выберите подходящий стандарт в приложении!**`;

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
            text: '📱 Установить приложение',
            url: 'https://password-entropy-lab-production.up.railway.app/?from=telegram&show_instructions=true'
          }
        ],
        [
          {
            text: '❓ Справка',
            callback_data: 'help'
          }
        ]
      ]
    }
  };

  bot.sendMessage(chatId, standardsMessage, options);
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
        ],
        [
          {
            text: '📱 Установить приложение',
            url: 'https://password-entropy-lab-production.up.railway.app/?from=telegram&show_instructions=true'
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
2. Выберите стандарт безопасности из 10 доступных
3. Введите пароль в поле ввода
4. Получите детальный анализ с конкретными ошибками
5. Экспортируйте отчет в PDF или JSON

📊 **Детальные критерии проверки:**
• **Длина:** минимум 8-16 символов (зависит от стандарта)
• **Энтропия:** 30-55+ бит случайности
• **Классы символов:** строчные, заглавные, цифры, спецсимволы
• **Популярные пароли:** проверка по словарям
• **Паттерны:** qwerty, 123, abc, повторы
• **Последовательности:** клавиатурные и числовые
• **Персональная информация:** даты, имена

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
    case 'standards':
      bot.answerCallbackQuery(callbackQuery.id);
      bot.sendMessage(message.chat.id, `🛡️ 10 Стандартов безопасности

**🔰 ДЛЯ СЕБЯ:**
🔒 **Basic Security** - 8+ символов, 30+ бит
🇺🇸 **NIST Modern** - 12+ символов, 35+ бит
🌐 **OWASP Web** - 10+ символов, 40+ бит

**💼 ДЛЯ БИЗНЕСА:**
💳 **PCI DSS** - 12+ символов, 40+ бит
🏢 **Microsoft AD** - 14+ символов, 42+ бит
🔍 **Google Workspace** - 12+ символов, 38+ бит

**🎖️ ЭКСПЕРТНЫЕ:**
🎖️ **Military Level** - 16+ символов, 55+ бит
🏦 **Banking Grade** - 15+ символов, 50+ бит
📋 **ISO 27001** - 13+ символов, 45+ бит

**🌍 РЕГИОНАЛЬНЫЕ:**
🇪🇺 **GDPR Ready** - 11+ символов, 36+ бит

**📊 Что проверяется:**
• Длина пароля (8-16 символов)
• Энтропия (30-55+ бит)
• Классы символов (4 типа)
• Популярные пароли
• Клавиатурные паттерны
• Последовательности
• Персональная информация

**💡 Выберите подходящий стандарт в приложении!**`, {
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

🎯 **Цель:** Профессиональный анализ паролей по 10 международным стандартам безопасности

🛡️ **Поддерживаемые стандарты:**
• **NIST 800-63B** - современный американский стандарт
• **OWASP** - для веб-приложений
• **PCI DSS** - для платежных систем
• **Microsoft AD** - корпоративные сети
• **Google Workspace** - облачные сервисы
• **Military Level** - военные требования
• **Banking Grade** - банковская безопасность
• **ISO 27001** - международный стандарт
• **GDPR Ready** - европейская защита данных
• **Basic Security** - минимальные требования

📊 **Анализ включает:**
• Детальную проверку по каждому критерию
• Конкретные ошибки с объяснениями
• Рекомендации по улучшению
• Сравнительный анализ по всем стандартам
• Профессиональные отчеты

💻 **Технологии:**
• Solid.js - быстрый реактивный UI
• TypeScript - типизированный код
• PDF-lib - локальная генерация PDF
• Telegram WebApp SDK
• Адаптивный дизайн

🌟 **Особенности:**
✅ 10 стандартов безопасности
✅ Детальные отчеты с ошибками
✅ Экспорт в PDF и JSON
✅ Адаптивный дизайн
✅ Полная приватность
✅ Открытый исходный код
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
