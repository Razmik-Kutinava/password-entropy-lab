// Скрипт для автоматического обновления URL в боте
const http = require('http');
const fs = require('fs');

async function getNgrokUrl() {
  return new Promise((resolve, reject) => {
    const req = http.get('http://localhost:4040/api/tunnels', (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          const httpsUrl = response.tunnels.find(t => t.proto === 'https')?.public_url;
          if (httpsUrl) {
            resolve(httpsUrl);
          } else {
            reject('HTTPS tunnel not found');
          }
        } catch (error) {
          reject('Failed to parse ngrok response');
        }
      });
    });
    
    req.on('error', () => reject('Failed to connect to ngrok'));
    req.setTimeout(3000, () => {
      req.destroy();
      reject('Timeout');
    });
  });
}

function updateBotFile(newUrl) {
  try {
    let content = fs.readFileSync('telegram-bot.cjs', 'utf8');
    const oldPattern = /const MINI_APP_URL = ['"`]([^'"`]+)['"`];/;
    const newContent = content.replace(oldPattern, `const MINI_APP_URL = '${newUrl}';`);
    
    if (newContent !== content) {
      fs.writeFileSync('telegram-bot.cjs', newContent);
      return true;
    }
    return false;
  } catch (error) {
    console.error('❌ Ошибка обновления файла:', error.message);
    return false;
  }
}

async function main() {
  console.log('🔄 Получаем ngrok URL...');
  
  for (let i = 0; i < 15; i++) {
    try {
      const url = await getNgrokUrl();
      console.log(`\n✅ NGROK URL получен: ${url}`);
      
      if (updateBotFile(url)) {
        console.log('✅ Файл бота обновлен!');
        console.log('\n📱 Теперь запустите бота:');
        console.log('   node telegram-bot.cjs');
        console.log('\n🎯 И протестируйте в Telegram!');
        return;
      } else {
        console.log('⚠️ URL уже актуальный');
        return;
      }
    } catch (error) {
      console.log(`Попытка ${i + 1}/15: ${error}`);
      if (i < 14) {
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
  }
  
  console.log('\n❌ Не удалось получить ngrok URL');
  console.log('🔧 Убедитесь что:');
  console.log('   1. Запущен: npm run dev');
  console.log('   2. Запущен: npx ngrok http 5173');
  console.log('   3. Доступен: http://localhost:4040');
}

main();
