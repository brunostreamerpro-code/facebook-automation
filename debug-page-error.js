const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const fs = require('fs');
const logger = require('./src/utils/logger');

puppeteer.use(StealthPlugin());

async function debugPageError() {
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
    logger.info('🔘 Clicando Adicionar...\n');
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
    logger.info('🔘 Clicando Criar domínio...\n');
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
    logger.info('📝 Preenchendo domínio...\n');
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
    logger.info('📤 Enviando domínio...\n');
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button, [role="button"]')).reverse();
      for (const btn of buttons) {
        if (btn.textContent?.toLowerCase().includes('adicionar') && btn.offsetParent !== null) {
          btn.click();
          return;
        }
      }
    });

    await new Promise(r => setTimeout(r, 10000));

    logger.info('\n📊 ANÁLISE DE ERRO DA PÁGINA\n');

    const pageAnalysis = await page.evaluate(() => {
      const allText = document.body.innerText || '';
      
      // Procurar por mensagens de erro comuns
      const errorMessages = [
        'não pode usar',
        'não está verificado',
        'domínio inválido',
        'erro',
        'falha',
        'problema',
        'não foi possível',
        'já existe',
        'bloqueado'
      ];

      const foundErrors = [];
      for (const errorMsg of errorMessages) {
        if (allText.toLowerCase().includes(errorMsg)) {
          // Encontrar contexto
          const index = allText.toLowerCase().indexOf(errorMsg);
          const start = Math.max(0, index - 50);
          const end = Math.min(allText.length, index + 150);
          const context = allText.substring(start, end);
          foundErrors.push({
            message: errorMsg,
            context: context.replace(/\n/g, ' ').trim()
          });
        }
      }

      return {
        fullText: allText,
        errors: foundErrors
      };
    });

    logger.info('🔴 ERROS ENCONTRADOS:\n');
    if (pageAnalysis.errors.length > 0) {
      for (const error of pageAnalysis.errors) {
        logger.error(`❌ "${error.message}"`);
        logger.info(`   Contexto: ${error.context}\n`);
      }
    } else {
      logger.info('Nenhum erro explícito encontrado\n');
    }

    logger.info('📄 TEXTO COMPLETO DA PÁGINA:\n');
    logger.info(pageAnalysis.fullText.substring(0, 2000));

    if (pageAnalysis.fullText.length > 2000) {
      logger.info(`\n... (${pageAnalysis.fullText.length - 2000} caracteres omitidos)\n`);
    }

    // Salvar screenshot
    await page.screenshot({ path: './debug-page-error.png' });
    logger.info('\n📸 Screenshot salvo em: debug-page-error.png\n');

    await browser.close();

  } catch (error) {
    logger.error(`Erro: ${error.message}`);
    if (browser) await browser.close();
  }
}

debugPageError();
