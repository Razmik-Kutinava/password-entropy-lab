// Скрипт для получения ngrok URL
const http = require('http');

function getNgrokUrl() {
  return new Promise((resolve, reject) => {
    const req = http.get('http://localhost:4040/api/tunnels', (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const tunnels = JSON.parse(data);
          const httpsUrl = tunnels.tunnels.find(t => t.proto === 'https')?.public_url;
          if (httpsUrl) {
            console.log('\n🎉 NGROK URL ГОТОВ!');
            console.log('📋 Скопируйте этот URL для настройки Telegram бота:');
            console.log(`\n${httpsUrl}\n`);
            console.log('📱 Теперь откройте @BotFather и выполните команды из telegram-bot-setup.txt');
            resolve(httpsUrl);
          } else {
            reject('HTTPS tunnel not found');
          }
        } catch (error) {
          reject(`Parse error: ${error.message}`);
        }
      });
    });
    
    req.on('error', (error) => {
      reject(`Request error: ${error.message}`);
    });
    
    req.setTimeout(5000, () => {
      req.destroy();
      reject('Timeout');
    });
  });
}

// Пытаемся получить URL каждые 2 секунды
let attempts = 0;
const maxAttempts = 15;

function tryGetUrl() {
  attempts++;
  console.log(`Попытка ${attempts}/${maxAttempts}: Проверяем ngrok...`);
  
  getNgrokUrl()
    .then(url => {
      console.log('✅ Успешно получен URL!');
      process.exit(0);
    })
    .catch(error => {
      if (attempts >= maxAttempts) {
        console.log('\n❌ Не удалось получить ngrok URL.');
        console.log('🔧 Попробуйте запустить ngrok вручную:');
        console.log('   npx ngrok http 5173');
        console.log('   Затем откройте http://localhost:4040 в браузере');
        process.exit(1);
      } else {
        setTimeout(tryGetUrl, 2000);
      }
    });
}

console.log('🔄 Ожидаем запуска ngrok...');
tryGetUrl();
