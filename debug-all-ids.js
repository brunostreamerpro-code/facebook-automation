const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const fs = require('fs');
const logger = require('./src/utils/logger');

puppeteer.use(StealthPlugin());

async function debugAllIds() {
  let browser, page;

  try {
    browser = await puppeteer.launch({ headless: false, args: ['--disable-blink-features=AutomationControlled'] });
    page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 720 });

    let cookies = [];
    if (fs.existsSync('./lista.txt')) {
      const content = fs.readFileSync('./lista.txt', 'utf-8');
      const lines = content.split('\n');
      for (const line of lines) {
        if (line.toUpperCase().includes('COOKIES:')) {
          const cookieStr = line.split('COOKIES:')[1] || line.split('cookies:')[1];
          if (cookieStr) {
            const pairs = cookieStr.split(';');
            for (const pair of pairs) {
              const [name, value] = pair.split('=');
              if (name && value) {
                cookies.push({ name: name.trim(), value: value.trim(), domain: '.facebook.com' });
              }
            }
          }
        }
      }
    }
    
    if (cookies.length > 0) await page.setCookie(...cookies);

    logger.info('\n🌐 Acessando Business Manager...\n');
    await page.goto('https://business.facebook.com', { waitUntil: 'load', timeout: 60000 });
    await new Promise(r => setTimeout(r, 3000));

    // Procurar por botão de alternar/trocar business
    logger.info('🔍 Procurando por menu de seleção de Business...\n');

    // Tentar clicar em botões "Alternar grupo" ou similares
    const foundElements = await page.evaluate(() => {
      const elements = [];
      
      // Procurar por elementos com "Alternar"
      const all = document.querySelectorAll('*');
      for (const elem of all) {
        const text = elem.textContent || '';
        if ((text.includes('Alternar') || text.includes('grupo') || text.includes('Business')) && text.length < 100) {
          if (elem.tagName === 'BUTTON' || elem.getAttribute('role') === 'button') {
            elements.push({
              text: text.trim().substring(0, 50),
              tag: elem.tagName
            });
          }
        }
      }

      return elements;
    });

    logger.info(`Encontrados ${foundElements.length} elementos de alternar/menu\n`);
    for (const elem of foundElements) {
      logger.info(`  • ${elem.tag}: ${elem.text}`);
    }

    // Extrair TODOS os números de IDs possíveis
    logger.info('\n🔎 Procurando por IDs de Business...\n');

    const allNumbers = await page.evaluate(() => {
      const numbers = new Set();
      
      // Procurar em toda a página
      const text = document.body.innerText;
      const matches = text.match(/\b\d{16,}\b/g);
      if (matches) {
        matches.forEach(m => numbers.add(m));
      }

      return Array.from(numbers);
    });

    logger.info(`Encontrados ${allNumbers.length} números longos (possíveis IDs):\n`);
    for (const num of allNumbers.slice(0, 10)) {
      logger.info(`  • ${num}`);
    }

    await browser.close();

  } catch (error) {
    logger.error(`Erro: ${error.message}`);
    if (browser) await browser.close();
  }
}

debugAllIds();
