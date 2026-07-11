/**
 * 🧪 TEST DOMAIN FLOW - Testa apenas a parte de criar/verificar domínio
 *
 * Pula toda a parte de criar Business Manager e vai direto testar:
 * - Preencher domínio
 * - Capturar meta tag
 * - Verificar domínio
 * - Debug da página
 */

const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const logger = require('./src/utils/logger');
const RenderServiceAPI = require('./src/services/RenderServiceAPI');
require('dotenv').config({ path: path.join(process.cwd(), '.env.vercel') });
require('dotenv').config({ path: path.join(process.cwd(), '.env') });

puppeteer.use(StealthPlugin());

// RENDER API KEY
const RENDER_API_KEY = 'rnd_twVpTqjhhrY4bUYSNX2ucC282R9x';
process.env.RENDER_API_KEY = RENDER_API_KEY;

/**
 * Anti-bot: apagar e redigitar última letra
 */
async function applicarAntiBot(page) {
  try {
    const ultimaLetra = await page.evaluate(() => {
      const inputs = Array.from(document.querySelectorAll('input[type="text"], input[type="email"], input[type="number"], textarea'));
      const inputsComValor = inputs.filter(inp => {
        return inp.offsetParent !== null && inp.value && inp.value.length > 0 && !inp.readOnly && !inp.disabled;
      });

      if (inputsComValor.length > 0) {
        const ultimoInput = inputsComValor[inputsComValor.length - 1];
        ultimoInput.focus();
        ultimoInput.setSelectionRange(ultimoInput.value.length, ultimoInput.value.length);
        const ultimaLetra = ultimoInput.value[ultimoInput.value.length - 1];
        ultimoInput.value = ultimoInput.value.slice(0, -1);
        ultimoInput.dispatchEvent(new Event('input', { bubbles: true }));
        ultimoInput.dispatchEvent(new Event('change', { bubbles: true }));
        return ultimaLetra;
      }
      return null;
    });

    if (ultimaLetra) {
      await new Promise(r => setTimeout(r, 400 + Math.random() * 300));
      await page.keyboard.type(ultimaLetra, { delay: 100 + Math.random() * 100 });
      await new Promise(r => setTimeout(r, 300 + Math.random() * 200));
    }
  } catch (e) {
    // Ignorar erros
  }
}

/**
 * Debug página - verificar meta tags, erros e sucesso
 */
async function debugarPagina(page, titulo = 'Debug') {
  logger.info(`\n🔍 ${titulo.toUpperCase()}\n`);
  logger.info('='.repeat(60));

  try {
    const debugInfo = await page.evaluate(() => {
      const result = {
        url: window.location.href,
        title: document.title,
        metaTags: [],
        errors: [],
        successMessages: [],
        htmlSnippet: ''
      };

      // 1. Procurar por meta tags
      const metaTags = document.querySelectorAll('meta');
      for (const meta of metaTags) {
        const name = meta.getAttribute('name') || meta.getAttribute('property') || '';
        const content = meta.getAttribute('content') || '';

        if (name.toLowerCase().includes('facebook') || name.toLowerCase().includes('domain')) {
          result.metaTags.push({
            type: name,
            content: content.substring(0, 50) + (content.length > 50 ? '...' : '')
          });
        }
      }

      // 2. Código/token da Facebook
      const codeTags = document.querySelectorAll('code');
      for (const code of codeTags) {
        const text = code.textContent || code.innerText || '';
        if (text.match(/[a-zA-Z0-9\-_]{15,}/)) {
          result.metaTags.push({
            type: 'code-snippet',
            content: text.substring(0, 50) + (text.length > 50 ? '...' : '')
          });
        }
      }

      // 3. Procurar por erros
      const errorElements = document.querySelectorAll('[role="alert"], .x1gslohp, [class*="error"], [class*="Error"]');
      for (const elem of errorElements) {
        const text = elem.textContent || elem.innerText || '';
        if (text && text.length > 0) {
          result.errors.push(text.substring(0, 80) + (text.length > 80 ? '...' : ''));
        }
      }

      // 4. Procurar por sucesso
      const successElements = document.querySelectorAll('[role="status"], [class*="success"], [class*="Success"], .x12yjp61');
      for (const elem of successElements) {
        const text = elem.textContent || elem.innerText || '';
        if (text && text.length > 0) {
          result.successMessages.push(text.substring(0, 80) + (text.length > 80 ? '...' : ''));
        }
      }

      // 5. Capturar HTML
      const modal = document.querySelector('[role="dialog"], .x1iyjqo2, [class*="modal"]');
      if (modal) {
        result.htmlSnippet = modal.textContent?.substring(0, 200) || '';
      }

      return result;
    });

    logger.info(`📍 URL: ${debugInfo.url}\n`);
    logger.info(`📄 Título: ${debugInfo.title}\n`);

    if (debugInfo.metaTags.length > 0) {
      logger.success('📋 Meta Tags / Código detectado:');
      for (const tag of debugInfo.metaTags) {
        logger.success(`   • ${tag.type}: ${tag.content}`);
      }
      logger.success('');
    } else {
      logger.info('   ℹ️ Nenhuma meta tag Facebook detectada\n');
    }

    if (debugInfo.errors.length > 0) {
      logger.warn('❌ ERROS DETECTADOS:');
      for (const error of debugInfo.errors) {
        logger.warn(`   • ${error}`);
      }
      logger.warn('');
    }

    if (debugInfo.successMessages.length > 0) {
      logger.success('✅ MENSAGENS DE SUCESSO:');
      for (const msg of debugInfo.successMessages) {
        logger.success(`   • ${msg}`);
      }
      logger.success('');
    }

    if (debugInfo.htmlSnippet) {
      logger.info(`📝 Conteúdo da modal:\n   ${debugInfo.htmlSnippet}\n`);
    }

    logger.info('='.repeat(60) + '\n');

  } catch (err) {
    logger.warn(`⚠️ Erro ao debugar página: ${err.message}\n`);
  }
}

/**
 * Main - Testar fluxo de domínio
 */
async function testarFluxoDominio() {
  let browser, page;

  try {
    logger.info('\n' + '='.repeat(60));
    logger.info('🧪 TEST DOMAIN FLOW - Testando criação e verificação de domínio');
    logger.info('='.repeat(60) + '\n');

    // Ler Business ID do lista.txt ou usar padrão do último processado
    let businessId = null;

    // Tentar ler do arquivo
    if (fs.existsSync('./lista.txt')) {
      const content = fs.readFileSync('./lista.txt', 'utf-8');
      const match = content.match(/business_id:(\d+)/);
      if (match) {
        businessId = match[1];
      }
    }

    // Se não encontrou, usar Business ID alternativo (que funciona)
    if (!businessId) {
      businessId = '1549058433439653'; // ID alternativo que funciona
      logger.info('ℹ️ Usando Business ID alternativo: ' + businessId + '\n');
    }

    // Iniciar browser
    logger.info('🚀 Iniciando browser...');
    browser = await puppeteer.launch({
      headless: false,
      args: ['--disable-blink-features=AutomationControlled']
    });

    page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 720 });

    // Carregar cookies
    logger.info('💾 Carregando cookies...');
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
    } else {
      logger.warn('⚠️ Nenhum cookie encontrado\n');
    }

    // Usar Business ID pré-configurado
    logger.success(`✅ Usando Business ID: ${businessId}\n`);

    // Agora navegar para página de domínios
    const domainsUrl = `https://business.facebook.com/latest/settings/domains?business_id=${businessId}`;
    logger.info(`🌐 Navegando para: ${domainsUrl}\n`);
    await page.goto(domainsUrl, { waitUntil: 'load', timeout: 60000 });
    await new Promise(r => setTimeout(r, 3000));
    logger.success('✅ Página de domínios carregada\n');

    // ===== VERIFICAR ERRO NA PÁGINA =====
    logger.info('⚠️  Verificando se há erro na página...\n');
    const temErro = await page.evaluate(() => {
      const texto = document.body.innerText.toLowerCase();

      if (texto.includes('você não pode usar este portfólio')) {
        return 'PORTFOLIO_NAO_PERMITIDO';
      }
      if (texto.includes('restrição')) {
        return 'RESTRICAO';
      }
      if (texto.includes('bloqueado')) {
        return 'BLOQUEADO';
      }

      return null;
    });

    if (temErro) {
      logger.error(`\n❌ ERRO DETECTADO: ${temErro}\n`);
      logger.warn('⚠️ Este Business Manager não pode ser usado para anunciar\n');
      logger.info('💡 Tente com outro Business ID (outra conta de Business Manager)\n');
      process.exit(1);
    }

    logger.success('✅ Nenhum erro detectado, prosseguindo...\n');

    // Clicar em "Adicionar"
    logger.info('➕ Clicando em "Adicionar"...');
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

    // Clicar em "Criar um domínio" - usando ID específico encontrado no debug
    logger.info('🔗 Clicando em "Criar um domínio"...\n');

    const clicouCriar = await page.evaluate(() => {
      // Estratégia 1: Usar ID específico js_k8 (encontrado no debug)
      const btnPorId = document.getElementById('js_k8');
      if (btnPorId) {
        btnPorId.click();
        return true;
      }

      // Estratégia 2: Usar js_k6 como fallback
      const btnPorIdK6 = document.getElementById('js_k6');
      if (btnPorIdK6) {
        btnPorIdK6.click();
        return true;
      }

      // Estratégia 3: XPath para elemento contendo EXATAMENTE "Criar um domínio"
      const xpath = "//div[text()='Criar um domínio']";
      const result = document.evaluate(xpath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null);
      if (result.singleNodeValue) {
        result.singleNodeValue.click();
        return true;
      }

      // Estratégia 4: Procurar recursivamente
      const allDivs = document.querySelectorAll('div');
      for (const div of allDivs) {
        // Procurar por um div que contenha APENAS "Criar um domínio" (sem descrição)
        if (div.children.length > 0) continue;
        const text = (div.textContent || '').trim();
        if (text === 'Criar um domínio') {
          div.click();
          return true;
        }
      }

      return false;
    });

    await new Promise(r => setTimeout(r, 3000));

    if (clicouCriar) {
      logger.success('✅ Botão clicado com sucesso!\n');
      logger.success('✅ Modal de criar domínio aberto\n');
    } else {
      logger.error('❌ Não conseguiu clicar no botão\n');
    }

    // Criar novo domínio no Render
    logger.info('🚀 Criando projeto no Render...');
    const renderAPI = new RenderServiceAPI(RENDER_API_KEY);

    const cnpjTest = '12345678000190';
    const sufixo = Date.now().toString().slice(-6);
    const renderProject = await renderAPI.createWebService({
      cnpj: cnpjTest,
      suffix: sufixo
    });

    let dominioPreview = `facebook-automation-${sufixo}.onrender.com`;
    if (renderProject && renderProject.service && renderProject.service.name) {
      dominioPreview = renderProject.service.name + '.onrender.com';
      logger.success(`✅ Domínio Render criado: ${dominioPreview}\n`);
    } else {
      logger.warn(`⚠️ Usando domínio fallback: ${dominioPreview}\n`);
    }

    // Preencher domínio
    logger.info(`📝 Preenchendo domínio: ${dominioPreview}...\n`);
    const dominioSimples = dominioPreview.replace('https://', '').replace('http://', '').replace(/\/$/, '');

    await page.evaluate((dominio) => {
      const input = document.querySelector('input[placeholder*="exemplo.com"]') ||
                    document.querySelector('input[type="text"]');

      if (input) {
        input.focus();
        input.value = '';
        input.dispatchEvent(new Event('input', { bubbles: true }));

        for (let i = 0; i < dominio.length; i++) {
          input.value = dominio.substring(0, i + 1);
          const keyDownEvent = new KeyboardEvent('keydown', {
            key: dominio[i],
            bubbles: true
          });
          const keyUpEvent = new KeyboardEvent('keyup', {
            key: dominio[i],
            bubbles: true
          });
          input.dispatchEvent(keyDownEvent);
          input.dispatchEvent(new Event('input', { bubbles: true }));
          input.dispatchEvent(keyUpEvent);
        }

        input.dispatchEvent(new Event('change', { bubbles: true }));
        input.dispatchEvent(new Event('blur', { bubbles: true }));
      }
    }, dominioSimples);

    await new Promise(r => setTimeout(r, 1500));
    logger.success('✅ Domínio preenchido\n');

    // DEBUG 1: Após preencher domínio
    logger.info('🔍 DEBUG 1: Após preencher domínio\n');
    await debugarPagina(page, 'após preencher domínio');

    // Anti-bot antes de clicar "Adicionar"
    logger.info('🤖 Aplicando anti-bot...');
    await applicarAntiBot(page);
    logger.success('✅ Anti-bot aplicado\n');

    // Clicar em "Adicionar"
    logger.info('🔗 Clicando em "Adicionar"...');
    const clicouAdicionar = await page.evaluate(() => {
      const buttons = document.querySelectorAll('button, [role="button"]');
      for (let i = buttons.length - 1; i >= 0; i--) {
        const btn = buttons[i];
        if (btn.textContent?.toLowerCase().includes('adicionar') && btn.offsetParent !== null) {
          btn.click();
          return true;
        }
      }
      return false;
    });

    if (clicouAdicionar) {
      logger.success('✅ Botão "Adicionar" clicado!\n');
    } else {
      logger.warn('⚠️ Botão não encontrado\n');
    }

    // Aguardar meta tag
    logger.info('📋 Aguardando geração de meta tag...\n');
    await new Promise(r => setTimeout(r, 3000));

    // Capturar meta tag
    logger.info('🔍 Procurando meta tag gerada...\n');
    const metaTag = await page.evaluate(() => {
      const codeTags = document.querySelectorAll('code');
      for (const tag of codeTags) {
        const text = tag.innerText || tag.textContent || '';
        const match = text.match(/content=["']([a-zA-Z0-9\-_]{15,})["']/);
        if (match && match[1]) {
          return match[1];
        }
      }

      const metas = document.querySelectorAll('meta[name="facebook-domain-verification"], meta[property*="facebook"]');
      for (const meta of metas) {
        const content = meta.getAttribute('content');
        if (content && content.length > 10) {
          return content;
        }
      }

      return null;
    });

    if (metaTag) {
      logger.success(`✅ Meta tag encontrada: ${metaTag}\n`);
    } else {
      logger.warn('⚠️ Meta tag não encontrada\n');
    }

    // DEBUG 2: Após capturar meta tag
    logger.info('🔍 DEBUG 2: Após adicionar domínio\n');
    await debugarPagina(page, 'após adicionar domínio');

    // Procurar botão "Verificar domínio"
    logger.info('🔍 Procurando botão "Verificar domínio"...\n');
    const temBotaoVerificar = await page.evaluate(() => {
      const buttons = document.querySelectorAll('button, [role="button"]');
      for (const btn of buttons) {
        if (btn.textContent?.toLowerCase().includes('verificar')) {
          btn.click();
          return true;
        }
      }
      return false;
    });

    if (temBotaoVerificar) {
      logger.success('✅ Botão encontrado e clicado!\n');
    } else {
      logger.warn('⚠️ Botão "Verificar domínio" não encontrado\n');
    }

    if (!temBotaoVerificar) {
      logger.warn('⚠️ Botão "Verificar domínio" não encontrado\n');
    }

    // Aguardar resultado
    await new Promise(r => setTimeout(r, 3000));

    // DEBUG 3: Após tentar verificar
    logger.info('🔍 DEBUG 3: Resultado da verificação\n');
    await debugarPagina(page, 'após tentar verificar domínio');

    logger.success('\n✅ Teste concluído! Verifique os debugs acima.\n');

  } catch (error) {
    logger.error(`\n❌ ERRO: ${error.message}\n`);
  }
}

testarFluxoDominio();
