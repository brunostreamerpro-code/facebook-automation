const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const fs = require('fs');
const logger = require('./src/utils/logger');

puppeteer.use(StealthPlugin());

async function debug() {
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

    // Procurar por qualquer link/botão que tenha números
    const allLinks = await page.evaluate(() => {
      const results = [];
      
      const links = document.querySelectorAll('a, button, [role="button"]');
      for (const link of links) {
        const href = link.href || '';
        const text = link.textContent?.trim() || '';
        
        if (href.includes('business_id=') || text.match(/\d{10,}/)) {
          const match = href.match(/business_id=(\d+)/);
          if (match) {
            results.push(`${text.substring(0, 30)} → ID: ${match[1]}`);
          }
        }
      }
      
      return results;
    });

    logger.info('📋 Links/Botões com Business IDs:\n');
    for (const item of allLinks) {
      logger.info(`  • ${item}`);
    }

    if (allLinks.length === 0) {
      logger.info('\n⚠️ Nenhum link com Business ID encontrado\n');
      logger.info('Verifique manualmente na URL qual é o ID do outro Business\n');
    }

    await browser.close();

  } catch (error) {
    logger.error(`Erro: ${error.message}`);
    if (browser) await browser.close();
  }
}

debug();
