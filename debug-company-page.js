const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const logger = require('./src/utils/logger');
const fs = require('fs');

puppeteer.use(StealthPlugin());

async function debugarPagina() {
  let browser, page;

  try {
    logger.info('\n🔍 DEBUG: Abrindo página de informações da empresa\n');

    browser = await puppeteer.launch({
      headless: false,
      args: ['--disable-blink-features=AutomationControlled']
    });

    page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 720 });

    // Ler cookies
    let cookies = [];
    if (fs.existsSync('./lista.txt')) {
      const content = fs.readFileSync('./lista.txt', 'utf-8');
      const lines = content.split('\n');
      for (const line of lines) {
        if (line.includes('cookie:')) {
          const cookieStr = line.replace('cookie:', '').trim();
          const [name, value] = cookieStr.split('=');
          if (name && value) {
            cookies.push({ name: name.trim(), value: value.trim() });
          }
        }
      }
    }

    if (cookies.length > 0) {
      await page.setCookie(...cookies);
      logger.info(`✅ ${cookies.length} cookies carregados\n`);
    }

    const businessId = '1549058433439653';
    const businessInfoUrl = `https://business.facebook.com/latest/settings/business_info?business_id=${businessId}`;

    logger.info(`🌐 Navegando para: ${businessInfoUrl}\n`);
    await page.goto(businessInfoUrl, { waitUntil: 'load', timeout: 60000 });

    await new Promise(r => setTimeout(r, 5000));

    logger.success('\n✅ PÁGINA CARREGADA\n');
    logger.info('=' .repeat(60));
    logger.info('NAVEGADOR PERMANECERÁ ABERTO');
    logger.info('Você pode agora:');
    logger.info('  1. Inspecionar a página no navegador');
    logger.info('  2. Usar F12 para abrir developer tools');
    logger.info('  3. Me dizer qual é a estrutura dos elementos');
    logger.info('=' .repeat(60));
    logger.info('\nPressione ENTER aqui após investigar a página...\n');

    // Esperar indefinidamente
    await new Promise(() => {});

  } catch (error) {
    logger.error(`\n❌ ERRO:\n${error.message}\n`);
  }
}

debugarPagina();
