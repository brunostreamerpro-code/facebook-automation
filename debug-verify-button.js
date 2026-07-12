const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const fs = require('fs');
const logger = require('./src/utils/logger');

puppeteer.use(StealthPlugin());

async function debugVerifyButton() {
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

    logger.info(`\n🔍 Acessando página de domínios...\n`);
    await page.goto(domainsUrl, { waitUntil: 'load', timeout: 60000 });
    await new Promise(r => setTimeout(r, 5000));

    logger.info('\n📊 ANÁLISE DE BOTÕES NA PÁGINA\n');

    const buttonAnalysis = await page.evaluate(() => {
      const allButtons = document.querySelectorAll('button, [role="button"]');
      const buttons = [];

      for (const btn of allButtons) {
        buttons.push({
          text: btn.textContent?.trim().substring(0, 50) || '',
          tag: btn.tagName,
          role: btn.getAttribute('role'),
          visible: btn.offsetParent !== null,
          class: btn.className.substring(0, 100)
        });
      }

      return buttons;
    });

    logger.info(`Total de botões encontrados: ${buttonAnalysis.length}\n`);
    
    for (let i = 0; i < Math.min(20, buttonAnalysis.length); i++) {
      const btn = buttonAnalysis[i];
      logger.info(`${i + 1}. "${btn.text}"`);
      logger.info(`   Tag: ${btn.tag}, Visível: ${btn.visible}\n`);
    }

    if (buttonAnalysis.length > 20) {
      logger.info(`... e mais ${buttonAnalysis.length - 20} botões\n`);
    }

    // Procurar especificamente por "Verificar"
    logger.info('\n🎯 PROCURANDO POR "VERIFICAR":\n');
    const verificarButtons = buttonAnalysis.filter(btn => btn.text.toLowerCase().includes('verificar'));
    
    if (verificarButtons.length > 0) {
      logger.success(`Encontrado ${verificarButtons.length} botão(es) com "Verificar":`);
      for (const btn of verificarButtons) {
        logger.info(`   • "${btn.text}" - Visível: ${btn.visible}`);
      }
    } else {
      logger.warn('Nenhum botão com "Verificar" encontrado');
    }

    // Procurar por palavras-chave relacionadas a domínios
    logger.info('\n🏷️ PALAVRAS-CHAVE ENCONTRADAS:\n');
    const keywords = ['adicionar', 'criar', 'verificar', 'remover', 'editar', 'salvar', 'enviar', 'excluir'];
    for (const keyword of keywords) {
      const count = buttonAnalysis.filter(btn => btn.text.toLowerCase().includes(keyword)).length;
      if (count > 0) {
        logger.info(`   ${keyword}: ${count} botão(s)`);
      }
    }

    await page.screenshot({ path: './debug-verify-button.png' });
    logger.info('\n📸 Screenshot salvo em: debug-verify-button.png\n');

    await browser.close();

  } catch (error) {
    logger.error(`Erro: ${error.message}`);
    if (browser) await browser.close();
  }
}

debugVerifyButton();
