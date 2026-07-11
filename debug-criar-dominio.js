/**
 * 🔍 DEBUG: Encontrar e analisar o botão "Criar um domínio"
 */

const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const fs = require('fs');
const logger = require('./src/utils/logger');

puppeteer.use(StealthPlugin());

async function debugarBotao() {
  let browser, page;

  try {
    logger.info('\n🔍 DEBUG: Analisando botão "Criar um domínio"\n');

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

    // Navegar para settings
    logger.info('🌐 Navegando para settings...\n');
    await page.goto('https://business.facebook.com/latest/settings/', { waitUntil: 'load', timeout: 60000 });
    await new Promise(r => setTimeout(r, 3000));

    // Capturar Business ID
    const settingsUrl = page.url();
    const urlMatch = settingsUrl.match(/business_id=(\d+)/);
    const businessId = urlMatch ? urlMatch[1] : '27731590079805773';

    logger.success(`✅ Business ID: ${businessId}\n`);

    // Navegar para domínios
    const domainsUrl = `https://business.facebook.com/latest/settings/domains?business_id=${businessId}`;
    logger.info(`🌐 Navegando para domínios...\n`);
    await page.goto(domainsUrl, { waitUntil: 'load', timeout: 60000 });
    await new Promise(r => setTimeout(r, 3000));

    // Clicar em "Adicionar"
    logger.info('➕ Clicando em "Adicionar"...\n');
    await page.evaluate(() => {
      const buttons = document.querySelectorAll('button, [role="button"]');
      for (const btn of buttons) {
        if (btn.textContent?.toLowerCase().includes('adicionar')) {
          btn.click();
          return true;
        }
      }
    });

    await new Promise(r => setTimeout(r, 2000));

    // DEBUGAR: Encontrar todos os botões/elementos clicáveis
    logger.info('\n🔍 ANALISANDO ESTRUTURA DO DOM\n');
    logger.info('='.repeat(60) + '\n');

    const analise = await page.evaluate(() => {
      const resultado = {
        todosOsBotoes: [],
        elementosComCriar: [],
        elementosComDominio: [],
        elementosComCriarEDominio: [],
        modais: [],
        html: ''
      };

      // 1. Todos os botões
      const buttons = document.querySelectorAll('button, [role="button"], div[role="button"]');
      for (let i = 0; i < buttons.length; i++) {
        const btn = buttons[i];
        if (btn.offsetParent !== null) { // Visível
          resultado.todosOsBotoes.push({
            index: i,
            tag: btn.tagName,
            role: btn.getAttribute('role'),
            class: btn.className,
            text: btn.textContent?.substring(0, 100),
            ariaLabel: btn.getAttribute('aria-label'),
            dataTestId: btn.getAttribute('data-testid'),
            innerHTML: btn.innerHTML?.substring(0, 100)
          });
        }
      }

      // 2. Elementos contendo "Criar"
      const allElements = document.querySelectorAll('*');
      for (const elem of allElements) {
        const text = elem.textContent || '';
        if (text.includes('Criar') && elem.offsetParent !== null && elem.children.length < 5) {
          resultado.elementosComCriar.push({
            tag: elem.tagName,
            class: elem.className,
            text: elem.textContent?.substring(0, 100),
            id: elem.id,
            role: elem.getAttribute('role')
          });
        }
      }

      // 3. Elementos contendo "domínio"
      for (const elem of allElements) {
        const text = elem.textContent || '';
        if (text.includes('domínio') && elem.offsetParent !== null && elem.children.length < 5) {
          resultado.elementosComDominio.push({
            tag: elem.tagName,
            class: elem.className,
            text: elem.textContent?.substring(0, 100),
            id: elem.id
          });
        }
      }

      // 4. Elementos com AMBOS "Criar" e "domínio"
      for (const elem of allElements) {
        const text = elem.textContent || '';
        if (text.includes('Criar') && text.includes('domínio') && elem.offsetParent !== null) {
          resultado.elementosComCriarEDominio.push({
            tag: elem.tagName,
            class: elem.className,
            text: elem.textContent?.substring(0, 150),
            id: elem.id,
            role: elem.getAttribute('role'),
            onclick: elem.onclick ? 'sim' : 'não',
            clickable: elem.tagName === 'BUTTON' || elem.getAttribute('role') === 'button'
          });
        }
      }

      // 5. Modais
      const modals = document.querySelectorAll('[role="dialog"], .modal, [class*="modal"]');
      for (const modal of modals) {
        resultado.modais.push({
          text: modal.textContent?.substring(0, 200),
          class: modal.className
        });
      }

      // 6. HTML da modal principal
      const mainModal = document.querySelector('[role="dialog"]');
      if (mainModal) {
        resultado.html = mainModal.outerHTML.substring(0, 500);
      }

      return resultado;
    });

    logger.info('📋 TODOS OS BOTÕES VISÍVEIS:\n');
    for (const btn of analise.todosOsBotoes) {
      logger.info(`   [${btn.index}] ${btn.tag} (role=${btn.role})`);
      logger.info(`       Texto: "${btn.text}"`);
      if (btn.ariaLabel) logger.info(`       Aria: "${btn.ariaLabel}"`);
      if (btn.dataTestId) logger.info(`       TestID: "${btn.dataTestId}"`);
      logger.info('');
    }

    logger.info('\n📋 ELEMENTOS COM "Criar":\n');
    for (const elem of analise.elementosComCriar) {
      logger.info(`   ${elem.tag} - "${elem.text}"`);
    }

    logger.info('\n📋 ELEMENTOS COM "domínio":\n');
    for (const elem of analise.elementosComDominio) {
      logger.info(`   ${elem.tag} - "${elem.text}"`);
    }

    logger.info('\n🎯 ELEMENTOS COM "Criar" E "domínio":\n');
    for (const elem of analise.elementosComCriarEDominio) {
      logger.success(`   ✅ ${elem.tag} (clickable=${elem.clickable})`);
      logger.success(`       Texto: "${elem.text}"`);
      logger.success(`       Classe: "${elem.class}"`);
      logger.success(`       ID: "${elem.id}"`);
      logger.success('');
    }

    logger.info('\n='.repeat(60));
    logger.info('\n💡 PRÓXIMO PASSO:\n');
    logger.info('Use as informações acima para identificar:');
    logger.info('1. A classe ou atributo exato do botão');
    logger.info('2. Como diferenciá-lo de outros botões');
    logger.info('3. O seletor CSS/XPath mais confiável\n');

  } catch (error) {
    logger.error(`\n❌ ERRO: ${error.message}\n`);
  }
}

debugarBotao();
