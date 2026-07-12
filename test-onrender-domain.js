const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const fs = require('fs');
const logger = require('./src/utils/logger');

puppeteer.use(StealthPlugin());

async function testOnrenderDomain() {
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

    const businessId = '27731590079805773';
    const domainsUrl = `https://business.facebook.com/latest/settings/domains?business_id=${businessId}`;

    const dominio = 'teste-fb-verification.onrender.com';

    logger.info(`\n🚀 Testando domínio .onrender.com\n`);
    logger.info(`Domínio: ${dominio}\n`);
    
    await page.goto(domainsUrl, { waitUntil: 'load', timeout: 60000 });
    await new Promise(r => setTimeout(r, 3000));

    // Clicar Adicionar
    await page.evaluate(() => {
      const buttons = document.querySelectorAll('button, [role="button"]');
      for (const btn of buttons) {
        if (btn.textContent?.trim() === 'Adicionar') {
          btn.click();
          return;
        }
      }
    });

    await new Promise(r => setTimeout(r, 2000));

    // Clicar Criar domínio
    await page.evaluate(() => {
      const allElements = document.querySelectorAll('*');
      for (const elem of allElements) {
        if (elem.textContent === 'Criar um domínio') {
          elem.click();
          return;
        }
      }
    });

    await new Promise(r => setTimeout(r, 3000));

    logger.info('📝 Preenchendo domínio...\n');

    // Preencher domínio
    await page.evaluate((dom) => {
      const input = document.querySelector('input[type="text"]');
      if (input) {
        input.focus();
        input.value = dom;
        input.dispatchEvent(new Event('input', { bubbles: true }));
      }
    }, dominio);

    await new Promise(r => setTimeout(r, 1000));

    // Anti-bot
    await page.evaluate((dom) => {
      const input = document.querySelector('input[type="text"]');
      if (input) {
        input.value = dom.slice(0, -1);
        input.dispatchEvent(new Event('input', { bubbles: true }));
      }
    }, dominio);

    await new Promise(r => setTimeout(r, 300));

    await page.keyboard.type(dominio.slice(-1));

    logger.info('📤 Enviando...\n');

    // Clicar Adicionar
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button, [role="button"]')).reverse();
      for (const btn of buttons) {
        if (btn.textContent?.toLowerCase().includes('adicionar') && btn.offsetParent !== null) {
          btn.click();
          return;
        }
      }
    });

    await new Promise(r => setTimeout(r, 8000));

    logger.info('\n🔍 Verificando resultado...\n');

    const pageContent = await page.evaluate(() => {
      const allText = document.body.innerText || '';
      return {
        hasError: allText.toLowerCase().includes('erro') || allText.toLowerCase().includes('inválido'),
        hasMeta: allText.toLowerCase().includes('meta'),
        hasVerificar: allText.toLowerCase().includes('verificar'),
        hasCodigoMeta: allText.match(/[a-z0-9_-]{28,32}/gi)?.length > 0,
        text: allText.substring(0, 800)
      };
    });

    logger.info(`✅ Domínio foi aceito? ${!pageContent.hasError}`);
    logger.info(`✅ Contém "meta tag"? ${pageContent.hasMeta}`);
    logger.info(`✅ Contém "verificar"? ${pageContent.hasVerificar}`);
    logger.info(`✅ Contém código? ${pageContent.hasCodigoMeta}\n`);

    logger.info('📄 Primeiros 800 caracteres:\n');
    logger.info(pageContent.text + '\n');

    await page.screenshot({ path: './test-onrender-domain.png' });
    logger.info('📸 Screenshot em: test-onrender-domain.png\n');

    await browser.close();

  } catch (error) {
    logger.error(`Erro: ${error.message}`);
    if (browser) await browser.close();
  }
}

testOnrenderDomain();
