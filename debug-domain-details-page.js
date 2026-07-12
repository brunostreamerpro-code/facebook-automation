const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const fs = require('fs');
const logger = require('./src/utils/logger');

puppeteer.use(StealthPlugin());

async function debugDomainDetailsPage() {
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

    // URL DA PÁGINA DE DETALHES
    const detailsUrl = 'https://business.facebook.com/latest/settings/domains/?business_id=1549058433439653&selected_asset_id=1342826767972999&selected_asset_type=owned-domain';

    logger.info(`\n🔍 Acessando página de detalhes do domínio...\n`);
    logger.info(`URL: ${detailsUrl}\n`);

    await page.goto(detailsUrl, { waitUntil: 'load', timeout: 60000 });
    await new Promise(r => setTimeout(r, 3000));

    logger.info('\n📊 ANÁLISE DA PÁGINA DE DETALHES:\n');

    const analysis = await page.evaluate(() => {
      const allText = document.body.innerText || '';
      const codes = [];

      // Procurar em inputs
      document.querySelectorAll('input').forEach(inp => {
        const val = inp.value || '';
        if (val.length === 30 && /^[a-z0-9_-]+$/.test(val)) {
          codes.push({
            type: 'input',
            value: val,
            placeholder: inp.placeholder,
            name: inp.name,
            id: inp.id
          });
        }
      });

      // Procurar em textContent
      const matches = allText.match(/[a-z0-9_-]{30}/gi) || [];
      matches.forEach(m => {
        if (!codes.find(c => c.value === m)) {
          codes.push({ type: 'text', value: m });
        }
      });

      // Procurar por "meta" na página
      const hasMetaText = allText.toLowerCase().includes('meta');
      const hasCodeText = allText.toLowerCase().includes('code') || allText.toLowerCase().includes('código');
      const hasVerifyText = allText.toLowerCase().includes('verify') || allText.toLowerCase().includes('verif');

      // Procurar em elementos específicos
      const allElements = document.querySelectorAll('*');
      const elementsWith30 = [];

      for (const elem of allElements) {
        const text = (elem.textContent || '').trim();
        if (text.length === 30 && /^[a-z0-9_-]+$/.test(text)) {
          elementsWith30.push({
            tag: elem.tagName,
            text: text,
            class: elem.className
          });
        }
      }

      return {
        codesFound: codes.length,
        codes: codes,
        elementsWith30: elementsWith30,
        hasMetaText: hasMetaText,
        hasCodeText: hasCodeText,
        hasVerifyText: hasVerifyText,
        textSample: allText.substring(0, 2000)
      };
    });

    logger.info(`✅ Códigos encontrados: ${analysis.codesFound}\n`);

    if (analysis.codes.length > 0) {
      logger.success('🎉 ENCONTRADO!\n');
      for (const code of analysis.codes) {
        logger.info(`Type: ${code.type}`);
        logger.info(`Value: ${code.value}`);
        if (code.placeholder) logger.info(`Placeholder: ${code.placeholder}`);
        if (code.name) logger.info(`Name: ${code.name}`);
        logger.info('');
      }
    } else {
      logger.warn('❌ Nenhum código de 30 char encontrado\n');
    }

    logger.info(`Elementos com 30 chars: ${analysis.elementsWith30.length}`);
    if (analysis.elementsWith30.length > 0) {
      for (const elem of analysis.elementsWith30) {
        logger.info(`  ${elem.tag}: ${elem.text}`);
      }
    }

    logger.info(`\n📝 Page contém:`);
    logger.info(`  "meta" text: ${analysis.hasMetaText}`);
    logger.info(`  "code"/"código" text: ${analysis.hasCodeText}`);
    logger.info(`  "verify"/"verif" text: ${analysis.hasVerifyText}\n`);

    logger.info('📄 Amostra do texto da página:\n');
    logger.info(analysis.textSample + '\n');

    // Capturar screenshot
    await page.screenshot({ path: './debug-domain-details.png' });
    logger.info('📸 Screenshot salvo: debug-domain-details.png\n');

    // Procurar por botão copiar ou similar
    const buttons = await page.evaluate(() => {
      const btns = document.querySelectorAll('button, [role="button"]');
      const result = [];
      for (const btn of btns) {
        if (btn.offsetParent !== null) {
          result.push(btn.textContent?.trim().substring(0, 50) || '');
        }
      }
      return result;
    });

    logger.info('🔘 Botões visíveis:\n');
    for (const btn of buttons) {
      if (btn.length > 0) {
        logger.info(`  • ${btn}`);
      }
    }

    await browser.close();

  } catch (error) {
    logger.error(`Erro: ${error.message}`);
    if (browser) await browser.close();
  }
}

debugDomainDetailsPage();
