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

    // Preencher
    const dominio = 'cnpj-32960315-test123.onrender.com';
    await page.evaluate((dom) => {
      const input = document.querySelector('input[type="text"]');
      if (input) {
        input.focus();
        input.value = dom;
        input.dispatchEvent(new Event('input', { bubbles: true }));
      }
    }, dominio);

    // Anti-bot
    await page.evaluate((dom) => {
      const input = document.querySelector('input[type="text"]');
      if (input) {
        input.value = dom.slice(0, -1);
        input.dispatchEvent(new Event('input', { bubbles: true }));
      }
    }, dominio);

    await new Promise(r => setTimeout(r, 300));

    // Enviar
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button, [role="button"]')).reverse();
      for (const btn of buttons) {
        if (btn.textContent?.toLowerCase().includes('adicionar') && btn.offsetParent !== null) {
          btn.click();
          return;
        }
      }
    });

    logger.info('\n⏳ Aguardando 15 segundos após submit...\n');
    
    // Aguardar em estágios
    for (let i = 0; i < 15; i++) {
      await new Promise(r => setTimeout(r, 1000));
      
      const analysis = await page.evaluate(() => {
        const allText = document.body.innerText || '';
        const codes = allText.match(/[a-z0-9_-]{30}/gi) || [];
        return {
          segundo: Math.round((new Date().getTime() % 60000) / 1000),
          codesCount: codes.length,
          codes: codes.slice(0, 3),
          hasInput: !!document.querySelector('input[value*="_"]'),
          formInputs: document.querySelectorAll('input[type="text"]').length
        };
      });

      logger.info(`${i + 1}s: Códigos=${analysis.codesCount}, Inputs=${analysis.formInputs}`);
      if (analysis.codes.length > 0) {
        logger.info(`      Exemplos: ${analysis.codes.join(', ')}`);
      }
    }

    logger.info('\n📸 Capturando screenshot...\n');
    await page.screenshot({ path: './debug-metatag-15s.png' });

    // Análise final
    logger.info('\n📊 ANÁLISE FINAL:\n');

    const final = await page.evaluate(() => {
      const allText = document.body.innerText || '';
      const codes = [];
      
      // Procurar em inputs
      document.querySelectorAll('input').forEach(inp => {
        const val = inp.value || '';
        if (val.length === 30 && /^[a-z0-9_-]+$/.test(val)) {
          codes.push({ type: 'input', value: val });
        }
      });

      // Procurar em textContent
      const matches = allText.match(/[a-z0-9_-]{30}/gi) || [];
      matches.forEach(m => {
        if (!codes.find(c => c.value === m)) {
          codes.push({ type: 'text', value: m });
        }
      });

      return {
        totaisCodes: codes.length,
        codes: codes.slice(0, 5),
        htmlLength: document.documentElement.outerHTML.length,
        bodyText: allText.substring(0, 1500)
      };
    });

    logger.info(`Total de códigos encontrados: ${final.totaisCodes}`);
    if (final.codes.length > 0) {
      logger.info('\nCódigos encontrados:');
      final.codes.forEach((code, i) => {
        logger.info(`  ${i + 1}. [${code.type}] ${code.value}`);
      });
    }

    logger.info(`\nHTML length: ${final.htmlLength}`);
    logger.info('\nPrimeiros 1500 caracteres do texto:\n');
    logger.info(final.bodyText + '\n');

    await browser.close();

  } catch (error) {
    logger.error(`Erro: ${error.message}`);
    if (browser) await browser.close();
  }
}

debugMetaTag();
