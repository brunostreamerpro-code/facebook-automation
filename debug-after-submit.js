const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const fs = require('fs');
const logger = require('./src/utils/logger');

puppeteer.use(StealthPlugin());

async function debugAfterSubmit() {
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

    const dominio = 'genesisai2001.vercel.app';

    logger.info(`\n🚀 Iniciando fluxo até submissão...\n`);
    
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

    // Preencher domínio
    await page.evaluate(() => {
      const input = document.querySelector('input[placeholder*="exemplo.com"]') ||
                    document.querySelector('input[type="text"]');
      if (input) {
        input.focus();
        input.value = 'genesisai2001.vercel.app';
        input.dispatchEvent(new Event('input', { bubbles: true }));
      }
    });

    await page.evaluate(() => {
      const input = document.querySelector('input[type="text"]');
      if (input) {
        input.value = 'genesisai2001.vercel.ap';
        input.dispatchEvent(new Event('input', { bubbles: true }));
      }
    });

    await new Promise(r => setTimeout(r, 200));

    // Clicar Adicionar
    logger.info('📤 Enviando domínio...\n');
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button, [role="button"]')).reverse();
      for (const btn of buttons) {
        if (btn.textContent?.toLowerCase().includes('adicionar') && btn.offsetParent !== null) {
          btn.click();
          return true;
        }
      }
    });

    await new Promise(r => setTimeout(r, 8000));

    logger.info('\n📊 ANALISANDO PÁGINA APÓS SUBMISSÃO\n');

    const pageState = await page.evaluate(() => {
      const allButtons = document.querySelectorAll('button, [role="button"]');
      const buttons = [];
      const allText = document.body.innerText || '';

      for (const btn of allButtons) {
        const text = btn.textContent?.trim() || '';
        if (text.length > 0 && text.length < 50) {
          buttons.push({
            text: text,
            visible: btn.offsetParent !== null
          });
        }
      }

      return {
        buttons: buttons,
        hasVerificar: allText.toLowerCase().includes('verificar'),
        hasMetaTag: allText.includes('meta'),
        hasColoque: allText.toLowerCase().includes('coloque'),
        hasCopie: allText.toLowerCase().includes('copie'),
        firstWords: allText.substring(0, 500)
      };
    });

    logger.info('🔘 BOTÕES VISÍVEIS:\n');
    for (const btn of pageState.buttons) {
      if (btn.visible && btn.text.length > 0) {
        logger.info(`   • ${btn.text}`);
      }
    }

    logger.info(`\n📝 CONTEÚDO DA PÁGINA:\n`);
    logger.info(`   Has "Verificar": ${pageState.hasVerificar}`);
    logger.info(`   Has "Meta": ${pageState.hasMetaTag}`);
    logger.info(`   Has "Coloque": ${pageState.hasColoque}`);
    logger.info(`   Has "Copie": ${pageState.hasCopie}\n`);

    logger.info('Primeiros 500 caracteres:\n');
    logger.info(pageState.firstWords + '\n');

    await page.screenshot({ path: './debug-after-submit.png' });
    logger.info('📸 Screenshot salvo em: debug-after-submit.png\n');

    await browser.close();

  } catch (error) {
    logger.error(`Erro: ${error.message}`);
    if (browser) await browser.close();
  }
}

debugAfterSubmit();
