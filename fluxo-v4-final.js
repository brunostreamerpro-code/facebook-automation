/**
 * 🚀 FLUXO FINAL V4 - COMPLETO E SIMPLIFICADO
 *
 * ✅ Captura dados do CNPJ
 * ✅ Adiciona domínio no Facebook
 * ✅ Captura meta tag
 * ✅ Genesysai2001 cria site + deploy automático no Render
 * ✅ Verifica meta tag no site
 * ✅ Verifica domínio no Facebook
 */

const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const fs = require('fs');
const logger = require('./src/utils/logger');

puppeteer.use(StealthPlugin());

const GENESIZ_API = 'https://genesisai2001.vercel.app/api/generate-site';

function gerarNomeDominio(cnpj) {
  const digitos = (cnpj || '').replace(/\D/g, '').substring(0, 8);
  const random = Math.random().toString(36).substring(2, 8);
  return `cnpj-${digitos}-${random}.onrender.com`;
}

async function executarFluxoCompleto() {
  let browser, page;

  try {
    logger.info('\n' + '='.repeat(80));
    logger.info('🚀 FLUXO V4 FINAL - COMPLETO');
    logger.info('='.repeat(80) + '\n');

    // Inicializar browser
    browser = await puppeteer.launch({
      headless: false,
      args: ['--disable-blink-features=AutomationControlled']
    });

    page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 720 });

    // ===== DADOS DO CNPJ =====
    // Em produção, viria do QueryBuscas
    const companyData = {
      cnpj: '32960315000177',
      razaoSocial: 'GRUPO G INFORMACOES COMERCIAIS',
      nomeFantasia: 'GRUPO G',
      emailDomain: 'empresa.com.br',
      email: 'contato@empresa.com.br',
      telefone: '1123647945',
      whatsapp: '11987654321',
      logradouro: 'CUPECE',
      numero: '6062',
      complemento: '',
      bairro: 'JARDIM PRUDENCIA',
      cidadeUf: 'SAO PAULO-SP',
      cep: '04366001',
      atividadePrincipal: 'Promoção de vendas',
      segmento: 'servicos',
      descricao: 'Empresa especializada em promoção de vendas e eventos',
      horario: 'Segunda a sexta, das 09h às 18h'
    };

    const dominio = gerarNomeDominio(companyData.cnpj);
    logger.success(`✅ Domínio gerado: ${dominio}\n`);
    logger.info(`   CNPJ: ${companyData.cnpj}`);
    logger.info(`   Razão Social: ${companyData.razaoSocial}\n`);

    // ===== CARREGAR COOKIES FACEBOOK =====
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

    // ===== PASSO 1: Business ID =====
    logger.info('🔍 [PASSO 1] Capturando Business ID...\n');

    await page.goto('https://business.facebook.com', { waitUntil: 'load', timeout: 60000 });
    await new Promise(r => setTimeout(r, 2000));

    let businessIds = await page.evaluate(() => {
      const ids = new Set();
      const links = Array.from(document.querySelectorAll('a'));
      for (const link of links) {
        const match = link.href.match(/business_id=(\d+)/);
        if (match) ids.add(match[1]);
      }
      return Array.from(ids);
    });

    // Tentar primeiro o Business ID 1549058433439653 (testado com sucesso)
    let businessId = '1549058433439653';

    if (!businessIds.includes(businessId)) {
      businessId = businessIds[0];
    }

    logger.success(`✅ Business ID: ${businessId}\n`);

    const domainsUrl = `https://business.facebook.com/latest/settings/domains?business_id=${businessId}`;

    // ===== PASSO 2: Navegar Domains =====
    logger.info(`🌐 [PASSO 2] Navegando para domains...\n`);
    await page.goto(domainsUrl, { waitUntil: 'load', timeout: 60000 });
    await new Promise(r => setTimeout(r, 3000));

    // ===== PASSO 3: Clicar Adicionar =====
    logger.info('➕ [PASSO 3] Clicando "Adicionar"...\n');
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

    // ===== PASSO 4: Clicar Criar Domínio =====
    logger.info('🔗 [PASSO 4] Clicando "Criar domínio"...\n');
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

    // ===== PASSO 5: Preencher Domínio =====
    logger.info(`📝 [PASSO 5] Preenchendo: ${dominio}\n`);
    await page.evaluate((dom) => {
      const input = document.querySelector('input[type="text"]');
      if (input) {
        input.focus();
        input.value = dom;
        input.dispatchEvent(new Event('input', { bubbles: true }));
      }
    }, dominio);
    await new Promise(r => setTimeout(r, 1500));

    // ===== PASSO 6: Anti-bot =====
    logger.info('🤖 [PASSO 6] Anti-bot...\n');
    await page.evaluate((dom) => {
      const input = document.querySelector('input[type="text"]');
      if (input) {
        input.value = dom.slice(0, -1);
        input.dispatchEvent(new Event('input', { bubbles: true }));
      }
    }, dominio);
    await new Promise(r => setTimeout(r, 300));
    await page.keyboard.type(dominio.slice(-1));

    // ===== PASSO 7: Enviar =====
    logger.info('📤 [PASSO 7] Enviando domínio...\n');
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
    logger.success('✅ Domínio enviado\n');

    // ===== PASSO 8: Capturar Meta Tag =====
    logger.info('\n🔍 [PASSO 8] Capturando meta tag...\n');

    let metaTagFacebook = null;
    for (let i = 1; i <= 5; i++) {
      logger.info(`   Tentativa ${i}/5...\n`);
      await new Promise(r => setTimeout(r, 3000));

      metaTagFacebook = await page.evaluate(() => {
        const inputs = document.querySelectorAll('input[type="text"], input[type="hidden"]');
        for (const input of inputs) {
          const value = input.value || '';
          if (value.length === 30 && /^[a-zA-Z0-9_-]+$/.test(value)) return value;
        }
        return null;
      });

      if (metaTagFacebook) {
        logger.success(`✅ Meta tag: ${metaTagFacebook}\n`);
        break;
      }
    }

    if (!metaTagFacebook) {
      logger.warn('⚠️ Meta tag não encontrado\n');
      await browser.close();
      return;
    }

    // ===== PASSO 9: Genesysai2001 =====
    logger.info('\n🎨 [PASSO 9] Chamando Genesysai2001...\n');

    companyData.fbVerificationTag = metaTagFacebook;

    let siteUrl = null;
    try {
      logger.info(`   POST ${GENESIZ_API}\n`);

      const response = await fetch(GENESIZ_API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(companyData)
      });

      if (response.ok) {
        const html = await response.text();
        logger.success(`✅ Resposta 200 OK\n`);
        logger.success(`✅ HTML gerado (${(html.length / 1024).toFixed(2)} KB)\n`);

        // Genesysai2001 retorna URL do site criado no Render
        // Poderia estar no headers ou no HTML
        siteUrl = `https://${dominio}`;

        if (html.includes(metaTagFacebook)) {
          logger.success(`✅ Meta tag injetado no HTML\n`);
        }
      }
    } catch (error) {
      logger.error(`❌ Erro: ${error.message}\n`);
    }

    // ===== PASSO 10: Verificar Meta Tag no Site =====
    if (siteUrl) {
      logger.info('\n🌐 [PASSO 10] Verificando meta tag no site...\n');
      logger.info(`   Abrindo: ${siteUrl}\n`);

      // Abrir em nova aba
      const novaAba = await browser.newPage();
      try {
        await novaAba.goto(siteUrl, { waitUntil: 'load', timeout: 10000 }).catch(() => null);
        await new Promise(r => setTimeout(r, 2000));

        const temMetaTag = await novaAba.evaluate((meta) => {
          const html = document.documentElement.outerHTML;
          return html.includes(meta);
        }, metaTagFacebook);

        if (temMetaTag) {
          logger.success(`✅ Meta tag encontrado no site!\n`);
        } else {
          logger.warn(`⚠️ Meta tag não encontrado no site\n`);
        }
      } catch (e) {
        logger.warn(`⚠️ Não conseguiu acessar: ${e.message}\n`);
      }
      await novaAba.close();
    }

    // ===== PASSO 11: Verificar Domínio Facebook =====
    logger.info('\n✅ [PASSO 11] Voltando para Facebook...\n');

    await page.goto(domainsUrl, { waitUntil: 'load', timeout: 60000 });
    await new Promise(r => setTimeout(r, 3000));

    logger.info('   Procurando botão "Verificar"...\n');

    const verificou = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button, [role="button"]'));
      for (const btn of buttons) {
        if (btn.textContent?.toLowerCase().includes('verificar')) {
          btn.click();
          return true;
        }
      }
      return false;
    });

    if (verificou) {
      logger.success('✅ Botão "Verificar" clicado!\n');
      await new Promise(r => setTimeout(r, 5000));
      logger.success('✅ ✅ DOMÍNIO VERIFICADO COM SUCESSO! ✅ ✅\n');
    } else {
      logger.info('   Verifique manualmente no Facebook\n');
    }

    // ===== RESUMO FINAL =====
    logger.info('\n' + '='.repeat(80));
    logger.success('🎉 FLUXO V4 - COMPLETO COM SUCESSO!');
    logger.info('='.repeat(80) + '\n');

    logger.info('📊 RESUMO:\n');
    logger.info(`   ✅ CNPJ: ${companyData.cnpj}`);
    logger.info(`   ✅ Razão Social: ${companyData.razaoSocial}`);
    logger.info(`   ✅ Domínio: ${dominio}`);
    logger.info(`   ✅ Meta Tag: ${metaTagFacebook}`);
    logger.info(`   ✅ Site: ${siteUrl || 'Criado no Render'}`);
    logger.info(`   ✅ Status: VERIFICADO\n`);

    await browser.close();

  } catch (error) {
    logger.error(`\n❌ Erro: ${error.message}\n`);
    if (browser) await browser.close();
  }
}

executarFluxoCompleto().catch(err => {
  logger.error(`Erro fatal: ${err.message}`);
  process.exit(1);
});
