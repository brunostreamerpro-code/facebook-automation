/**
 * 🔍 DEBUG: Encontrar exatamente o botão "Criar um domínio"
 */

const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const fs = require('fs');
const logger = require('./src/utils/logger');

puppeteer.use(StealthPlugin());

async function debugarBotaoCriar() {
  let browser, page;

  try {
    logger.info('\n🔍 DEBUG: ENCONTRANDO BOTÃO "CRIAR UM DOMÍNIO"\n');
    logger.info('='.repeat(80) + '\n');

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

    // Ir para página de domínios
    const businessId = '1549058433439653';
    const domainsUrl = `https://business.facebook.com/latest/settings/domains?business_id=${businessId}`;

    logger.info(`🌐 Navegando para: ${domainsUrl}\n`);
    await page.goto(domainsUrl, { waitUntil: 'load', timeout: 60000 });
    await new Promise(r => setTimeout(r, 3000));

    logger.success('✅ Página carregada\n');

    // Clicar em "Adicionar"
    logger.info('\n➕ Clicando em "Adicionar"...\n');
    await page.evaluate(() => {
      const buttons = document.querySelectorAll('button, [role="button"]');
      for (const btn of buttons) {
        if (btn.textContent?.toLowerCase().includes('adicionar') && btn.offsetParent !== null) {
          btn.click();
          return true;
        }
      }
    });

    await new Promise(r => setTimeout(r, 2500));
    logger.success('✅ Modal de opções aberto\n');

    // AGORA DEBUGAR: Procurar por TODOS os elementos que contêm "Criar"
    logger.info('\n🔍 DEBUGAR: Procurando elementos com "Criar um domínio"\n');
    logger.info('='.repeat(80) + '\n');

    const elementos = await page.evaluate(() => {
      const resultado = [];
      const allElements = document.querySelectorAll('*');

      for (const elem of allElements) {
        const text = elem.textContent?.toLowerCase() || '';
        if (text.includes('criar') && text.includes('domínio')) {
          if (elem.children.length < 5) {
            resultado.push({
              tag: elem.tagName,
              id: elem.id,
              classes: elem.className,
              text: elem.textContent?.substring(0, 100),
              role: elem.getAttribute('role'),
              onclick: elem.onclick ? 'SIM' : 'NÃO',
              clickable: elem.tagName === 'BUTTON' || elem.getAttribute('role') === 'button',
              visible: elem.offsetParent !== null,
              dataTestid: elem.getAttribute('data-testid')
            });
          }
        }
      }

      return resultado;
    });

    logger.info('📋 ELEMENTOS ENCONTRADOS:\n');
    for (let i = 0; i < elementos.length; i++) {
      const elem = elementos[i];
      logger.info(`\n[${i + 1}] TAG: ${elem.tag}`);
      logger.info(`    ID: ${elem.id || 'nenhum'}`);
      logger.info(`    Classes: ${elem.classes || 'nenhuma'}`);
      logger.info(`    Text: "${elem.text}"`);
      logger.info(`    Role: ${elem.role || 'nenhum'}`);
      logger.info(`    Onclick: ${elem.onclick}`);
      logger.info(`    Clickable: ${elem.clickable}`);
      logger.info(`    Visible: ${elem.visible}`);
      logger.info(`    Data-testid: ${elem.dataTestid || 'nenhum'}`);
    }

    logger.info('\n' + '='.repeat(80));
    logger.info('\n💡 ENCONTRADO - Vou tentar CLICAR no primeiro elemento encontrado:\n');

    // ESTRATÉGIA XPATH (como o script-auto faz)
    logger.info('\n   📍 Usando estratégia XPath (script-auto)...\n');
    const elements = await page.$x("//div[text()='Criar um domínio']");

    let clicou = false;
    if (elements.length > 0) {
      logger.success(`   ✅ Encontrado ${elements.length} elemento(s) com XPath\n`);

      // Subir até encontrar o gridcell ou elemento clicável
      clicou = await page.evaluate((elem) => {
        let current = elem;
        for (let i = 0; i < 15; i++) {
          if (current.getAttribute && current.getAttribute('role') === 'gridcell') {
            current.click();
            return true;
          }
          current = current.parentElement;
          if (!current) break;
        }
        return false;
      }, elements[0]);
    } else {
      logger.warn('   ⚠️ Nenhum elemento encontrado com XPath\n');
    }

    if (clicou) {
      logger.success('✅ CLIQUE EXECUTADO!\n');
    } else {
      logger.error('❌ CLIQUE FALHOU - elemento pode estar desabilitado\n');
    }

    await new Promise(r => setTimeout(r, 3000));

    // Verificar se modal de domínio abriu
    logger.info('\n🔍 VERIFICANDO SE MODAL DE DOMÍNIO ABRIU...\n');
    const temInput = await page.evaluate(() => {
      const input = document.querySelector('input[placeholder*="exemplo.com"]') ||
                    document.querySelector('input[type="text"]');
      return input ? true : false;
    });

    if (temInput) {
      logger.success('✅ SIM! Modal de domínio está aberto - INPUT ENCONTRADO!\n');

      // ===== PREENCHER DOMÍNIO =====
      const dominio = 'facebook-automation-688047.onrender.com';
      logger.info(`📝 Preenchendo domínio: ${dominio}\n`);

      await page.evaluate((dom) => {
        const input = document.querySelector('input[placeholder*="exemplo.com"]') ||
                      document.querySelector('input[placeholder*="domínio"]') ||
                      document.querySelector('input[type="text"]');
        if (input) {
          input.value = dom;
          input.dispatchEvent(new Event('input', { bubbles: true }));
          input.dispatchEvent(new Event('change', { bubbles: true }));
          input.dispatchEvent(new Event('blur', { bubbles: true }));
        }
      }, dominio);

      await new Promise(r => setTimeout(r, 1500));
      logger.success('✅ Domínio preenchido\n');

      // ===== ANTI-BOT =====
      logger.info('🤖 Aplicando anti-bot...\n');

      const ultimaLetra = await page.evaluate((dom) => {
        const input = document.querySelector('input[placeholder*="exemplo.com"]') ||
                      document.querySelector('input[type="text"]');
        if (!input) return null;

        // Apagar última letra
        input.value = dom.slice(0, -1);
        input.dispatchEvent(new Event('input', { bubbles: true }));
        input.dispatchEvent(new Event('keydown', { bubbles: true }));
        input.dispatchEvent(new Event('keyup', { bubbles: true }));

        return dom.slice(-1);
      }, dominio);

      await new Promise(r => setTimeout(r, 300));

      // Redigitar última letra
      if (ultimaLetra) {
        await page.keyboard.type(ultimaLetra);
        await new Promise(r => setTimeout(r, 200));
        logger.success('✅ Anti-bot aplicado\n');
      }

      // ===== CLICAR "ADICIONAR" =====
      logger.info('✅ Clicando em "Adicionar" para enviar...\n');
      await page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('button, [role="button"]'))
          .reverse();
        for (const btn of buttons) {
          if (btn.textContent?.toLowerCase().includes('adicionar') && btn.offsetParent !== null) {
            btn.click();
            return true;
          }
        }
      });

      await new Promise(r => setTimeout(r, 3000));
      logger.success('✅ Domínio enviado!\n');

    } else {
      logger.warn('❌ NÃO - Modal não abriu ou input não encontrado\n');
    }

    logger.info('=' .repeat(80) + '\n');
    logger.success('✅ DEBUG CONCLUÍDO - Navegador aberto para inspeção\n');
    logger.info('Pressione CTRL+C para sair\n');

    // Deixar aberto
    await new Promise(() => {});

  } catch (error) {
    logger.error(`\n❌ ERRO: ${error.message}\n`);
  }
}

debugarBotaoCriar();
