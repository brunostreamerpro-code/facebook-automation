/**
 * 🔄 COMPLETE DOMAIN VERIFICATION - Fluxo completo de verificação
 *
 * 1. Preencher domínio no Facebook
 * 2. Capturar meta tag gerado
 * 3. Ir ao Render e adicionar meta tag
 * 4. Voltar ao Facebook e verificar
 */

const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const fs = require('fs');
const logger = require('./src/utils/logger');
const axios = require('axios');

puppeteer.use(StealthPlugin());

/**
 * Debug aprofundado da página
 */
async function debugarPaginaCompleta(page, titulo = 'Debug') {
  logger.info(`\n🔍 ${titulo.toUpperCase()}\n`);
  logger.info('='.repeat(80));

  const htmlCompleto = await page.evaluate(() => {
    return document.body.outerHTML;
  });

  // Procurar por padrões de meta tag
  const padroes = [
    /content=["']([a-zA-Z0-9\-_]{15,})["']/g,
    /[a-zA-Z0-9]{15,}/g,
    /facebook-domain-verification["\s:=]+([a-zA-Z0-9\-_]+)/gi,
  ];

  logger.info('\n📋 Procurando por códigos/tokens:\n');

  for (let i = 0; i < padroes.length; i++) {
    const matches = htmlCompleto.matchAll(padroes[i]);
    for (const match of matches) {
      if (match[1] && match[1].length > 15) {
        logger.success(`   [${i}] ${match[1]}`);
      }
    }
  }

  // Procurar por elementos contendo "código", "token", "verification"
  const elementsInfo = await page.evaluate(() => {
    const result = [];
    const elements = document.querySelectorAll('*');

    for (const elem of elements) {
      const text = (elem.textContent || '').toLowerCase();
      const html = elem.innerHTML || '';

      if (text.includes('código') || text.includes('token') || text.includes('verification')) {
        if (elem.children.length < 3) {
          result.push({
            tag: elem.tagName,
            text: elem.textContent?.substring(0, 200),
            html: html.substring(0, 300),
            classes: elem.className
          });
        }
      }
    }

    return result;
  });

  logger.info('\n📄 Elementos com "código/token/verification":\n');
  for (const elem of elementsInfo) {
    logger.info(`   ${elem.tag}: "${elem.text?.substring(0, 100)}"`);
    if (elem.html && elem.html.length > 0) {
      logger.info(`   HTML: ${elem.html.substring(0, 100)}\n`);
    }
  }

  logger.info('='.repeat(80) + '\n');
}

/**
 * Extrair meta tag de formas diferentes
 */
async function extrairMetaTag(page) {
  logger.info('🔍 Extração de meta tag - Tentativa 1: <code> tags\n');

  let metaTag = await page.evaluate(() => {
    const codeTags = document.querySelectorAll('code');
    for (const tag of codeTags) {
      const text = tag.innerText || tag.textContent || '';
      logger.info(`   Code tag encontrada: "${text.substring(0, 100)}"`);

      const match = text.match(/content=["']([a-zA-Z0-9\-_]{15,})["']/);
      if (match && match[1]) {
        return match[1];
      }

      const match2 = text.match(/[a-zA-Z0-9\-_]{25,}/);
      if (match2) {
        return match2[0];
      }
    }
    return null;
  });

  if (metaTag) {
    logger.success(`✅ Meta tag encontrada: ${metaTag}\n`);
    return metaTag;
  }

  logger.info('⚠️ Não encontrado em <code> tags, tentando outra forma\n');

  // Tentativa 2: Procurar em qualquer elemento de texto
  logger.info('🔍 Extração - Tentativa 2: Qualquer elemento de texto\n');

  metaTag = await page.evaluate(() => {
    const elementos = document.querySelectorAll('*');
    for (const elem of elementos) {
      const text = elem.innerText || elem.textContent || '';

      // Procurar por padrão de token
      const match = text.match(/([a-zA-Z0-9\-_]{20,})/);
      if (match && match[1] && !text.includes('facebook.com') && text.length < 200) {
        return match[1];
      }
    }
    return null;
  });

  if (metaTag) {
    logger.success(`✅ Meta tag encontrada (método 2): ${metaTag}\n`);
    return metaTag;
  }

  logger.info('⚠️ Meta tag não encontrado ainda\n');
  return null;
}

/**
 * Main
 */
async function executarFluxoCompleto() {
  let browser, page;

  try {
    logger.info('\n' + '='.repeat(80));
    logger.info('🔄 FLUXO COMPLETO DE VERIFICAÇÃO DE DOMÍNIO');
    logger.info('='.repeat(80) + '\n');

    // Inicializar browser
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

    // ===== PASSO 1: Ir para página de domínios =====
    const businessId = '1549058433439653';
    const domainsUrl = `https://business.facebook.com/latest/settings/domains?business_id=${businessId}`;

    logger.info(`🌐 [PASSO 1] Navegando para domínios...\n`);
    await page.goto(domainsUrl, { waitUntil: 'load', timeout: 60000 });
    await new Promise(r => setTimeout(r, 3000));
    logger.success('✅ Página carregada\n');

    // ===== PASSO 2: Verificar erro =====
    logger.info('🔍 [PASSO 2] Verificando se há erro...\n');
    const temErro = await page.evaluate(() => {
      const texto = document.body.innerText.toLowerCase();
      return texto.includes('você não pode usar este portfólio') ? 'ERRO' : null;
    });

    if (temErro) {
      logger.error('❌ Business Manager com restrição\n');
      process.exit(1);
    }
    logger.success('✅ Nenhum erro\n');

    // ===== PASSO 3: Clicar em "Adicionar" =====
    logger.info('➕ [PASSO 3] Clicando em "Adicionar"...\n');
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
    logger.success('✅ Modal aberto\n');

    // ===== PASSO 4: Clicar em "Criar um domínio" =====
    logger.info('🔗 [PASSO 4] Clicando em "Criar um domínio"...\n');
    await page.evaluate(() => {
      const btn = document.getElementById('js_k8');
      if (btn) btn.click();
    });
    await new Promise(r => setTimeout(r, 3000));
    logger.success('✅ Modal de domínio aberto\n');

    // ===== PASSO 5: Preencher domínio =====
    const dominio = 'facebook-automation-test.onrender.com';
    logger.info(`📝 [PASSO 5] Preenchendo domínio: ${dominio}...\n`);

    await page.evaluate((dom) => {
      const input = document.querySelector('input[placeholder*="exemplo.com"]') ||
                    document.querySelector('input[type="text"]');
      if (input) {
        input.value = dom;
        input.dispatchEvent(new Event('input', { bubbles: true }));
        input.dispatchEvent(new Event('change', { bubbles: true }));
      }
    }, dominio);

    await new Promise(r => setTimeout(r, 2000));
    logger.success('✅ Domínio preenchido\n');

    // ===== DEBUG 1 =====
    await debugarPaginaCompleta(page, 'após preencher domínio');

    // ===== PASSO 6: Anti-bot =====
    logger.info('🤖 [PASSO 6] Aplicando anti-bot...\n');
    await page.evaluate(() => {
      const inputs = Array.from(document.querySelectorAll('input[type="text"]'))
        .filter(inp => inp.offsetParent !== null && inp.value);
      if (inputs.length > 0) {
        const input = inputs[inputs.length - 1];
        const ultima = input.value[input.value.length - 1];
        input.value = input.value.slice(0, -1);
        input.dispatchEvent(new Event('input', { bubbles: true }));
        return ultima;
      }
      return null;
    });

    await new Promise(r => setTimeout(r, 300));
    await page.keyboard.type('m');
    await new Promise(r => setTimeout(r, 300));
    logger.success('✅ Anti-bot aplicado\n');

    // ===== PASSO 7: Clicar "Adicionar" =====
    logger.info('✅ [PASSO 7] Clicando em "Adicionar"...\n');
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
    logger.success('✅ Domínio enviado\n');

    // ===== DEBUG 2 =====
    await debugarPaginaCompleta(page, 'após enviar domínio');

    // ===== PASSO 8: Capturar meta tag =====
    logger.info('📋 [PASSO 8] Capturando meta tag...\n');
    const metaTag = await extrairMetaTag(page);

    if (metaTag) {
      logger.success(`\n✅✅ META TAG ENCONTRADO: ${metaTag}\n`);
    } else {
      logger.warn('\n⚠️ Meta tag não encontrado - continuando mesmo assim\n');
    }

    // ===== PASSO 9: Verificar domínio =====
    logger.info('🔍 [PASSO 9] Clicando em "Verificar"...\n');
    await page.evaluate(() => {
      const buttons = document.querySelectorAll('button, [role="button"]');
      for (const btn of buttons) {
        if (btn.textContent?.toLowerCase().includes('verificar')) {
          btn.click();
          return true;
        }
      }
    });

    await new Promise(r => setTimeout(r, 3000));
    logger.success('✅ Verificação iniciada\n');

    // ===== DEBUG 3 =====
    await debugarPaginaCompleta(page, 'após tentar verificar');

    logger.success('\n✅✅ TESTE COMPLETO CONCLUÍDO!\n');

  } catch (error) {
    logger.error(`\n❌ ERRO: ${error.message}\n`);
  }
}

executarFluxoCompleto();
