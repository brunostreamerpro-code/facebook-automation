const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const fs = require('fs');
const logger = require('./src/utils/logger');

puppeteer.use(StealthPlugin());

async function debugMetaTag() {
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

    logger.info(`\n🔄 Acessando: ${domainsUrl}\n`);
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
        if (elem.textContent?.includes('Criar um domínio')) {
          elem.click();
          return;
        }
      }
    });

    await new Promise(r => setTimeout(r, 3000));

    // Preencher domínio
    await page.evaluate(() => {
      const input = document.querySelector('input[placeholder*="exemplo.com"]') ||
                    document.querySelector('input[placeholder*="domínio"]') ||
                    document.querySelector('input[type="text"]');
      if (input) {
        input.focus();
        input.value = 'genesisai2001.vercel.app';
        input.dispatchEvent(new Event('input', { bubbles: true }));
      }
    });

    // Anti-bot
    await page.evaluate(() => {
      const input = document.querySelector('input[placeholder*="exemplo.com"]') ||
                    document.querySelector('input[type="text"]');
      if (input) {
        input.value = 'genesisai2001.vercel.ap';
        input.dispatchEvent(new Event('input', { bubbles: true }));
      }
    });

    await new Promise(r => setTimeout(r, 200));

    // Clicar Adicionar (enviar)
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

    logger.info('\n📊 Analisando página para encontrar meta tag...\n');

    const analysis = await page.evaluate(() => {
      const allText = document.body.innerText || '';
      
      // Procurar por códigos de 30 caracteres
      const regex30 = /\b[a-z0-9_-]{30}\b/gi;
      const matches30 = allText.match(regex30) || [];

      // Procurar especificamente por códigos específicos
      const codes = [];
      const allElements = document.querySelectorAll('*');
      for (const elem of allElements) {
        const text = (elem.textContent || '').trim();
        if (text.length === 30 && /^[a-zA-Z0-9_-]+$/.test(text)) {
          codes.push({
            tag: elem.tagName,
            text: text,
            parentTag: elem.parentElement?.tagName,
            visible: elem.offsetParent !== null
          });
        }
      }

      return {
        bodySample: allText.substring(0, 1000),
        codesFound: codes.length,
        codes: codes.slice(0, 10),
        regex30Matches: matches30.length,
        firstMatches: matches30.slice(0, 10)
      };
    });

    logger.info('📋 ANÁLISE:\n');
    logger.info(`Códigos encontrados (30 chars): ${analysis.codesFound}\n`);
    
    if (analysis.codes.length > 0) {
      logger.info('Detalhes dos códigos:\n');
      for (const code of analysis.codes) {
        logger.info(`  • ${code.text} (${code.tag}) - Visível: ${code.visible}`);
      }
    }

    logger.info(`\nMatches regex 30 chars: ${analysis.regex30Matches}\n`);
    for (const match of analysis.firstMatches) {
      logger.info(`  • ${match}`);
    }

    logger.info(`\nPrimeiros 1000 chars:\n${analysis.bodySample}\n`);

    await browser.close();

  } catch (error) {
    logger.error(`Erro: ${error.message}`);
    if (browser) await browser.close();
  }
}

debugMetaTag();
