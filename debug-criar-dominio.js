/**
 * 🔍 DEBUG - Encontrar elemento "Criar um domínio"
 */

const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const fs = require('fs');
const logger = require('./src/utils/logger');

puppeteer.use(StealthPlugin());

async function debugCriarDominio() {
  let browser, page;

  try {
    logger.info('\n' + '='.repeat(80));
    logger.info('🔍 DEBUG - Encontrando "Criar um domínio"');
    logger.info('='.repeat(80) + '\n');

    browser = await puppeteer.launch({
      headless: false,
      args: ['--disable-blink-features=AutomationControlled']
    });

    page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 720 });

    // Carregar cookies
    logger.info('💾 Carregando cookies...\n');
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

    if (cookies.length > 0) {
      await page.setCookie(...cookies);
      logger.success(`✅ ${cookies.length} cookies carregados\n`);
    }

    const businessId = '1549058433439653';
    const domainsUrl = `https://business.facebook.com/latest/settings/domains?business_id=${businessId}`;

    logger.info('🌐 Navegando para Facebook Domains...\n');
    await page.goto(domainsUrl, { waitUntil: 'load', timeout: 60000 });
    await new Promise(r => setTimeout(r, 3000));

    logger.info('📊 Analisando página...\n');

    const debug = await page.evaluate(() => {
      const results = { found: [] };
      
      const allElements = document.querySelectorAll('*');
      for (const elem of allElements) {
        const text = elem.textContent || '';
        if (text.includes('Criar um domínio') && text.length < 100) {
          results.found.push({
            tag: elem.tagName,
            text: text.trim().substring(0, 60),
            role: elem.getAttribute('role')
          });
        }
      }
      
      return results;
    });

    logger.info(`Encontrados: ${debug.found.length} elementos\n`);
    for (const elem of debug.found.slice(0, 5)) {
      logger.info(`  • ${elem.tag} (role="${elem.role}") - ${elem.text}`);
    }

    if (debug.found.length === 0) {
      logger.error('\n❌ "Criar um domínio" NÃO ENCONTRADO NA PÁGINA\n');
      logger.info('Verifique se a conta tem permissão para criar domínios.\n');
    } else {
      logger.success('\n✅ Elemento encontrado!\n');
    }

    await browser.close();

  } catch (error) {
    logger.error(`\n❌ Erro: ${error.message}\n`);
    if (browser) await browser.close();
  }
}

debugCriarDominio().catch(err => {
  logger.error(`Erro fatal: ${err.message}`);
  process.exit(1);
});
