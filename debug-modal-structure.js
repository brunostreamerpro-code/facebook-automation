const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const fs = require('fs');
const logger = require('./src/utils/logger');

puppeteer.use(StealthPlugin());

async function debugModalStructure() {
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

    logger.info('\n🔍 ANALISANDO ESTRUTURA DO MODAL\n');

    const modalAnalysis = await page.evaluate(() => {
      // Procurar por elementos que contêm "Criar um domínio"
      const allElements = document.querySelectorAll('*');
      const modalElements = [];

      for (const elem of allElements) {
        const text = elem.textContent || '';
        if (text.includes('Criar um domínio') || text.includes('Solicitar acesso')) {
          modalElements.push({
            tag: elem.tagName,
            role: elem.getAttribute('role'),
            type: elem.getAttribute('type'),
            className: elem.className,
            text: text.substring(0, 200),
            html: elem.outerHTML.substring(0, 500),
            clickable: elem.onclick !== null || elem.getAttribute('onclick') !== null || elem.tagName === 'BUTTON'
          });
        }
      }

      // Procurar especificamente por botões ou elementos clicáveis dentro do modal
      const buttons = document.querySelectorAll('button, [role="button"], div[role="button"]');
      const clickableButtons = [];

      for (const btn of buttons) {
        const text = btn.textContent?.trim() || '';
        if (text.includes('Criar') || text.includes('Solicitar') || text.length > 10) {
          clickableButtons.push({
            text: text.substring(0, 100),
            tag: btn.tagName,
            role: btn.getAttribute('role'),
            visible: btn.offsetParent !== null,
            html: btn.outerHTML.substring(0, 300)
          });
        }
      }

      return {
        modalElements: modalElements.slice(0, 10),
        clickableButtons: clickableButtons.slice(0, 10),
        totalButtons: buttons.length
      };
    });

    logger.info('📦 ELEMENTOS DO MODAL ENCONTRADOS:\n');
    for (let i = 0; i < modalAnalysis.modalElements.length; i++) {
      const elem = modalAnalysis.modalElements[i];
      logger.info(`${i + 1}. Tag: ${elem.tag}`);
      logger.info(`   Texto: ${elem.text}`);
      logger.info(`   Role: ${elem.role}`);
      logger.info(`   Classe: ${elem.className}\n`);
    }

    logger.info('\n🔘 BOTÕES CLICÁVEIS ENCONTRADOS:\n');
    for (let i = 0; i < modalAnalysis.clickableButtons.length; i++) {
      const btn = modalAnalysis.clickableButtons[i];
      logger.info(`${i + 1}. Texto: ${btn.text}`);
      logger.info(`   Tag: ${btn.tag}`);
      logger.info(`   Role: ${btn.role}`);
      logger.info(`   Visível: ${btn.visible}\n`);
    }

    logger.info(`\nTotal de botões na página: ${modalAnalysis.totalButtons}\n`);

    // Agora tentar clicar especificamente com diferentes estratégias
    logger.info('\n🎯 TESTANDO DIFERENTES ESTRATÉGIAS DE CLIQUE\n');

    // Estratégia 1: XPath exato
    logger.info('Estratégia 1: Procurando elemento com "Criar um domínio"...\n');
    const result1 = await page.evaluate(() => {
      const elements = document.querySelectorAll('*');
      for (const elem of elements) {
        if (elem.textContent === 'Criar um domínio') {
          elem.click();
          return 'Clique executado (XPath exato)';
        }
      }
      return 'Elemento não encontrado';
    });
    logger.info(`   ${result1}\n`);

    await new Promise(r => setTimeout(r, 2000));

    // Estratégia 2: Procurar pai clicável
    logger.info('Estratégia 2: Procurando elemento pai clicável...\n');
    const result2 = await page.evaluate(() => {
      const elements = document.querySelectorAll('*');
      for (const elem of elements) {
        if (elem.textContent?.includes('Criar um domínio')) {
          let parent = elem;
          while (parent && parent.tagName !== 'BUTTON' && parent.tagName !== 'DIV') {
            parent = parent.parentElement;
          }
          if (parent) {
            parent.click();
            return 'Clique executado (elemento pai)';
          }
        }
      }
      return 'Elemento pai não encontrado';
    });
    logger.info(`   ${result2}\n`);

    await new Promise(r => setTimeout(r, 3000));

    // Verificar se o clique funcionou
    logger.info('✅ Verificando se o formulário abriu...\n');
    const formOpened = await page.evaluate(() => {
      const input = document.querySelector('input[placeholder*="exemplo.com"]') ||
                    document.querySelector('input[placeholder*="domínio"]') ||
                    document.querySelector('input[type="text"][placeholder*=""]');
      return input !== null;
    });

    if (formOpened) {
      logger.success('✅ FORMULÁRIO ABERTO COM SUCESSO!\n');
    } else {
      logger.error('❌ Formulário ainda não abriu\n');
      await page.screenshot({ path: './debug-modal-structure.png' });
      logger.info('📸 Screenshot salvo em: debug-modal-structure.png\n');
    }

    await browser.close();

  } catch (error) {
    logger.error(`Erro: ${error.message}`);
    if (browser) await browser.close();
  }
}

debugModalStructure();
