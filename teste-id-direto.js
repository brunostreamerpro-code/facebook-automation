const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const fs = require('fs');
const logger = require('./src/utils/logger');

puppeteer.use(StealthPlugin());

async function testeIdDireto() {
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

    const idsToTest = ['27731590079805773', '1549058433439653'];
    
    for (const businessId of idsToTest) {
      logger.info(`\n🔄 Testando ID: ${businessId}\n`);
      
      const testUrl = `https://business.facebook.com/latest/settings/domains?business_id=${businessId}`;
      logger.info(`   URL: ${testUrl}\n`);
      
      try {
        const response = await page.goto(testUrl, { waitUntil: 'load', timeout: 30000 });
        await new Promise(r => setTimeout(r, 2000));

        const temCriar = await page.evaluate(() => {
          const allText = document.body.innerText;
          return allText.includes('Criar um domínio') || allText.includes('criar dominio');
        });

        const finalUrl = page.url();

        logger.info(`   URL carregada: ${finalUrl.substring(0, 80)}`);
        logger.info(`   "Criar um domínio": ${temCriar ? '✅ SIM' : '❌ NÃO'}\n`);

        if (temCriar) {
          logger.success(`✅✅ ID ${businessId} TEM ACESSO A CRIAR DOMÍNIOS!\n`);
        }
      } catch (error) {
        logger.error(`   ❌ Erro: ${error.message}\n`);
      }
    }

    await browser.close();

  } catch (error) {
    logger.error(`Erro: ${error.message}`);
    if (browser) await browser.close();
  }
}

testeIdDireto();
