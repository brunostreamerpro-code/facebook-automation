const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const fs = require('fs');
const logger = require('./src/utils/logger');

puppeteer.use(StealthPlugin());

async function debugVerificarLocation() {
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

    // Preencher e enviar
    await page.evaluate(() => {
      const input = document.querySelector('input[type="text"]');
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

    logger.info('\n🔎 PROCURANDO PALAVRA "VERIFICAR" NO DOM\n');

    const verificarInfo = await page.evaluate(() => {
      const allElements = document.querySelectorAll('*');
      const results = [];

      for (const elem of allElements) {
        const text = elem.textContent || '';
        if (text.toLowerCase().includes('verificar')) {
          results.push({
            tag: elem.tagName,
            role: elem.getAttribute('role'),
            text: text.substring(0, 100),
            visible: elem.offsetParent !== null,
            parent: elem.parentElement?.tagName,
            hasClick: elem.onclick !== null
          });
        }
      }

      return results;
    });

    logger.info(`Encontrados ${verificarInfo.length} elemento(s) com "verificar":\n`);
    
    for (let i = 0; i < verificarInfo.length; i++) {
      const info = verificarInfo[i];
      logger.info(`${i + 1}. Tag: ${info.tag}, Visível: ${info.visible}`);
      logger.info(`   Texto: ${info.text}`);
      logger.info(`   Parent: ${info.parent}\n`);
    }

    // Se não encontrou, procurar por "Verificar o domínio"
    logger.info('\n🔎 PROCURANDO "VERIFICAR O DOMÍNIO":\n');
    const verificarDominio = await page.evaluate(() => {
      const allText = document.body.innerText;
      return allText.toLowerCase().includes('verificar o domínio');
    });

    logger.info(`Contém "verificar o domínio": ${verificarDominio}\n`);

    await page.screenshot({ path: './debug-verificar-location.png' });
    logger.info('📸 Screenshot salvo em: debug-verificar-location.png\n');

    await browser.close();

  } catch (error) {
    logger.error(`Erro: ${error.message}`);
    if (browser) await browser.close();
  }
}

debugVerificarLocation();
