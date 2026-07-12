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

    const businessId = '1549058433439653';
    const domainsUrl = `https://business.facebook.com/latest/settings/domains?business_id=${businessId}`;

    logger.info('\n🌐 Navegando...\n');
    await page.goto(domainsUrl, { waitUntil: 'load', timeout: 60000 });
    await new Promise(r => setTimeout(r, 3000));

    const info = await page.evaluate(() => {
      return {
        title: document.title,
        buttons: Array.from(document.querySelectorAll('button, [role="button"]')).map(b => b.textContent.trim()).slice(0, 10),
        links: Array.from(document.querySelectorAll('a')).map(a => a.textContent.trim()).filter(t => t.length > 0 && t.length < 50).slice(0, 10),
        headings: Array.from(document.querySelectorAll('h1, h2, h3')).map(h => h.textContent.trim()).slice(0, 5),
        mainText: document.body.innerText.substring(0, 500)
      };
    });

    logger.info('📄 ESTRUTURA DA PÁGINA:\n');
    logger.info(`Título: ${info.title}\n`);
    
    logger.info('Botões/Links encontrados:');
    for (const btn of info.buttons.filter(b => b.length > 0)) {
      logger.info(`  • ${btn}`);
    }

    logger.info('\nHeadings:');
    for (const h of info.headings) {
      logger.info(`  • ${h}`);
    }

    logger.info('\nPrimeiras 500 chars do texto:\n');
    logger.info(info.mainText + '\n');

    await browser.close();

  } catch (error) {
    logger.error(`Erro: ${error.message}`);
    if (browser) await browser.close();
  }
}

debug();
