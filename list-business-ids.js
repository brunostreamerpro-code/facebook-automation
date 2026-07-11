/**
 * 📋 LIST BUSINESS IDs - Listar todos os Business Managers disponíveis
 */

const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const fs = require('fs');
const logger = require('./src/utils/logger');

puppeteer.use(StealthPlugin());

async function listarBusinessIds() {
  let browser, page;

  try {
    logger.info('\n📋 LISTANDO TODOS OS BUSINESS IDs DISPONÍVEIS\n');
    logger.info('='.repeat(60) + '\n');

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

    // Acessar página de Business Manager
    logger.info('🌐 Acessando Meta Business Suite...\n');
    await page.goto('https://business.facebook.com', { waitUntil: 'load', timeout: 60000 });
    await new Promise(r => setTimeout(r, 5000));

    // Procurar por links de Business Manager
    logger.info('🔍 Procurando Business Manager Links...\n');

    const businessIds = await page.evaluate(() => {
      const ids = [];

      // Estratégia 1: Procurar em URLs
      const links = document.querySelectorAll('a[href*="business_id="], button[href*="business_id="]');
      for (const link of links) {
        const href = link.getAttribute('href') || '';
        const match = href.match(/business_id=(\d+)/);
        if (match && match[1]) {
          ids.push(match[1]);
        }
      }

      // Estratégia 2: Procurar em data-attributes
      const elements = document.querySelectorAll('[data-business-id], [data-business_id]');
      for (const elem of elements) {
        const id = elem.getAttribute('data-business-id') || elem.getAttribute('data-business_id');
        if (id) {
          ids.push(id);
        }
      }

      // Estratégia 3: Procurar no innerHTML por números grandes (IDs de Business Manager)
      const text = document.body.innerHTML;
      const matches = text.match(/business_id=(\d{15,})/g);
      if (matches) {
        for (const match of matches) {
          const id = match.replace('business_id=', '');
          ids.push(id);
        }
      }

      // Remover duplicatas
      return Array.from(new Set(ids));
    });

    if (businessIds.length > 0) {
      logger.success(`\n✅ ${businessIds.length} Business ID(s) encontrado(s):\n`);

      for (let i = 0; i < businessIds.length; i++) {
        logger.info(`   [${i + 1}] ${businessIds[i]}`);
      }

      logger.info('\n' + '='.repeat(60));
      logger.info('\n💡 Use um desses IDs no script test-domain-flow.js');
      logger.info('   Atualize a linha: const businessId = "..._ID_AQUI_...";\n');
    } else {
      logger.warn('\n⚠️  Nenhum Business ID encontrado\n');
      logger.info('💡 Tente clicar em "Business Manager" no menu\n');
    }

    // Navegar para settings geral
    logger.info('🌐 Navegando para settings geral...\n');
    await page.goto('https://business.facebook.com/latest/settings/', { waitUntil: 'load', timeout: 60000 });
    await new Promise(r => setTimeout(r, 3000));

    const urlAtual = page.url();
    logger.info(`📍 URL Atual: ${urlAtual}\n`);

    const matchUrl = urlAtual.match(/business_id=(\d+)/);
    if (matchUrl && matchUrl[1]) {
      logger.success(`✅ Business ID da URL: ${matchUrl[1]}\n`);
    }

  } catch (error) {
    logger.error(`\n❌ ERRO: ${error.message}\n`);
  }
}

listarBusinessIds();
