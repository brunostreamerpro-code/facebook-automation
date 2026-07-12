const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const fs = require('fs');
const logger = require('./src/utils/logger');

puppeteer.use(StealthPlugin());

async function debugDetailed() {
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
    const url = `https://business.facebook.com/latest/settings/domains?business_id=${businessId}`;

    logger.info(`\n🔄 Acessando: ${url}\n`);
    await page.goto(url, { waitUntil: 'load', timeout: 60000 });
    await new Promise(r => setTimeout(r, 4000));

    logger.info('📊 Analisando página...\n');

    // Verificar página carregou bem
    const pageInfo = await page.evaluate(() => {
      const bodyText = document.body.innerText || '';
      
      // Procurar por "domínio" de várias formas
      const hasDominio = bodyText.toLowerCase().includes('domínio') || 
                        bodyText.toLowerCase().includes('dominio') ||
                        bodyText.toLowerCase().includes('domain');
      
      // Procurar por botões
      const buttons = Array.from(document.querySelectorAll('button, [role="button"]'))
        .map(b => b.textContent?.trim())
        .filter(t => t && t.length > 0 && t.length < 100)
        .slice(0, 20);

      // Procurar por "Criar"
      const hasCriar = bodyText.includes('Criar') || bodyText.includes('criar') || bodyText.includes('Create');

      // Procurar por "Adicionar"
      const hasAdicionar = bodyText.includes('Adicionar') || bodyText.includes('adicionar') || bodyText.includes('Add');

      return {
        bodyLength: bodyText.length,
        hasDominio,
        hasCriar,
        hasAdicionar,
        buttons,
        firstText: bodyText.substring(0, 500)
      };
    });

    logger.info(`Body length: ${pageInfo.bodyLength}`);
    logger.info(`Contém "domínio": ${pageInfo.hasDominio ? '✅' : '❌'}`);
    logger.info(`Contém "Criar": ${pageInfo.hasCriar ? '✅' : '❌'}`);
    logger.info(`Contém "Adicionar": ${pageInfo.hasAdicionar ? '✅' : '❌'}`);
    
    logger.info(`\nBotões encontrados (${pageInfo.buttons.length}):\n`);
    for (const btn of pageInfo.buttons) {
      logger.info(`  • ${btn}`);
    }

    logger.info(`\nPrimeiros 500 chars do texto:\n`);
    logger.info(pageInfo.firstText + '\n');

    // Tentar tirar screenshot
    logger.info('\n📸 Tirando screenshot...\n');
    await page.screenshot({ path: 'screenshot-domains.png' });
    logger.success('✅ Screenshot salvo em: screenshot-domains.png\n');

    await browser.close();

  } catch (error) {
    logger.error(`Erro: ${error.message}`);
    if (browser) await browser.close();
  }
}

debugDetailed();
