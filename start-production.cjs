// Скрипт для запуска и сервера и бота в продакшн
const { spawn } = require('child_process');

console.log('🚀 Запуск Production сервисов...');

// Запускаем Express сервер
const server = spawn('node', ['server.cjs'], {
  stdio: ['inherit', 'pipe', 'pipe']
});

server.stdout.on('data', (data) => {
  console.log(`[SERVER] ${data.toString().trim()}`);
});

server.stderr.on('data', (data) => {
  console.error(`[SERVER ERROR] ${data.toString().trim()}`);
});

// Ждем 2 секунды и запускаем бота
setTimeout(() => {
  console.log('🤖 Запуск Production бота...');
  
  const bot = spawn('node', ['bot-production.cjs'], {
    stdio: ['inherit', 'pipe', 'pipe']
  });

  bot.stdout.on('data', (data) => {
    console.log(`[BOT] ${data.toString().trim()}`);
  });

  bot.stderr.on('data', (data) => {
    console.error(`[BOT ERROR] ${data.toString().trim()}`);
  });

  bot.on('close', (code) => {
    console.log(`❌ Bot процесс завершен с кодом ${code}`);
    process.exit(1);
  });

}, 2000);

server.on('close', (code) => {
  console.log(`❌ Server процесс завершен с кодом ${code}`);
  process.exit(1);
});

// Обработка сигналов завершения
process.on('SIGTERM', () => {
  console.log('📴 Получен SIGTERM, завершение...');
  server.kill();
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('📴 Получен SIGINT, завершение...');
  server.kill();
  process.exit(0);
});
