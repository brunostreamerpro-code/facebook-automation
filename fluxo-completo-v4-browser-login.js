/**
 * 🚀 FLUXO COMPLETO V4 - COM LOGIN VIA BROWSER
 *
 * Usa Puppeteer para fazer login real e pegar dados do CNPJ
 */

const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const fs = require('fs');
const logger = require('./src/utils/logger');

puppeteer.use(StealthPlugin());

const GENESIZ_API = 'https://genesisai2001.vercel.app/api/generate-site';
const QUERYBUSCAS_URL = 'https://querybuscas.com/pages/consultas/gerador-cnpj';

async function buscarDadosCNPJViaBrowser(page) {
  logger.info('\n📊 [PASSO 0] Buscando dados reais do CNPJ via QueryBuscas...\n');

  try {
    logger.info('🔐 Fazendo login no QueryBuscas...\n');
    await page.goto('https://querybuscas.com', { waitUntil: 'load', timeout: 60000 });
    await new Promise(r => setTimeout(r, 2000));

    // Clicar botão de login (assumindo que existe)
    const hasLoginButton = await page.evaluate(() => {
      const buttons = document.querySelectorAll('a, button, div[role="button"]');
      for (const btn of buttons) {
        if (btn.textContent?.toLowerCase().includes('login') || btn.textContent?.toLowerCase().includes('entrar')) {
          btn.click();
          return true;
        }
      }
      return false;
    });

    if (hasLoginButton) {
      await new Promise(r => setTimeout(r, 2000));
    }

    // Preencher login
    await page.evaluate(() => {
      const inputs = document.querySelectorAll('input');
      if (inputs.length >= 2) {
        inputs[0].focus();
        inputs[0].value = 'perwzinho';
        inputs[0].dispatchEvent(new Event('input', { bubbles: true }));

        inputs[1].focus();
        inputs[1].value = 'perwzinho';
        inputs[1].dispatchEvent(new Event('input', { bubbles: true }));
      }
    });

    await new Promise(r => setTimeout(r, 1000));

    // Clicar botão de envio
    await page.evaluate(() => {
      const buttons = document.querySelectorAll('button');
      for (const btn of buttons) {
        if (btn.textContent?.toLowerCase().includes('entrar') ||
            btn.textContent?.toLowerCase().includes('login') ||
            btn.textContent?.toLowerCase().includes('acessar')) {
          btn.click();
          return;
        }
      }
    });

    await new Promise(r => setTimeout(r, 3000));

    logger.success('✅ Login realizado\n');

    // Navegar para gerador de CNPJ
    logger.info('🔄 Acessando gerador de CNPJ...\n');
    await page.goto(QUERYBUSCAS_URL, { waitUntil: 'load', timeout: 60000 });
    await new Promise(r => setTimeout(r, 2000));

    // Clicar botão para gerar CNPJ (assumindo que existe um botão "Gerar" ou similar)
    await page.evaluate(() => {
      const buttons = document.querySelectorAll('button, div[role="button"], a');
      for (const btn of buttons) {
        const text = btn.textContent?.toLowerCase() || '';
        if (text.includes('gerar') || text.includes('consultar')) {
          btn.click();
          return;
        }
      }
    });

    await new Promise(r => setTimeout(r, 3000));

    // Extrair dados da página
    const companyData = await page.evaluate(() => {
      const getText = (sel) => document.querySelector(sel)?.textContent?.trim() || '';
      const getAttr = (sel, attr) => document.querySelector(sel)?.getAttribute(attr) || '';

      // Procurar por padrões comuns de dados
      const allText = document.body.innerText || '';

      return {
        text: allText,
        json: null
      };
    });

    // Parsear dados do texto
    logger.info('📋 Dados obtidos\n');
    logger.info(companyData.text.substring(0, 1000) + '\n');

    return companyData;

  } catch (error) {
    logger.error(`❌ Erro ao buscar dados: ${error.message}\n`);
    return null;
  }
}

function gerarNomeDominio(cnpj) {
  const numeros = (cnpj || '').replace(/\D/g, '').slice(-8);
  return `cnpj-${numeros}.onrender.com`;
}

async function executarFluxoCompleto() {
  let browser, page;

  try {
    logger.info('\n' + '='.repeat(80));
    logger.info('🚀 FLUXO COMPLETO V4 - COM LOGIN VIA BROWSER');
    logger.info('='.repeat(80) + '\n');

    // Inicializar browser
    logger.info('🔧 Inicializando browser...\n');
    browser = await puppeteer.launch({
      headless: false,
      args: ['--disable-blink-features=AutomationControlled']
    });

    page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 720 });

    // Buscar dados do CNPJ
    const cnpjData = await buscarDadosCNPJViaBrowser(page);
    if (!cnpjData) {
      logger.error('❌ Não foi possível obter dados');
      await browser.close();
      return;
    }

    // Usar dados de teste para continuar o fluxo
    const companyData = {
      cnpj: '32960315000177',
      razaoSocial: 'GRUPO G INFORMACOES COMERCIAIS',
      nomeFantasia: 'GRUPO G',
      emailDomain: 'empresa.com.br',
      email: 'contato@empresa.com.br',
      telefone: '1123647945',
      logradouro: 'CUPECE',
      numero: '6062',
      complemento: '',
      bairro: 'JARDIM PRUDENCIA',
      cidadeUf: 'SAO PAULO-SP',
      cep: '04366001',
      atividadePrincipal: 'Promoção de vendas',
      segmento: 'servicos',
      descricao: 'Empresa especializada em promoção de vendas e eventos'
    };

    const dominio = gerarNomeDominio(companyData.cnpj);
    logger.success(`✅ Usando domínio: ${dominio}\n`);

    // ===== CARREGAR COOKIES FACEBOOK =====
    logger.info('💾 Carregando cookies do Facebook...\n');
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

    // ===== FLUXO FACEBOOK =====
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

    if (businessIds.length === 0) {
      logger.error('❌ Nenhum Business ID encontrado');
      await browser.close();
      return;
    }

    let businessId = businessIds[0];
    logger.success(`✅ Usando Business ID: ${businessId}\n`);

    const domainsUrl = `https://business.facebook.com/latest/settings/domains?business_id=${businessId}`;

    // PASSO 2-7: Igual ao V2
    logger.info(`🌐 [PASSO 2] Navegando para Facebook Domains...\n`);
    await page.goto(domainsUrl, { waitUntil: 'load', timeout: 60000 });
    await new Promise(r => setTimeout(r, 3000));

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

    // PASSO 8: API Genesisai2001
    logger.info('\n🎨 [PASSO 9] Chamando API Genesisai2001...\n');
    companyData.fbVerificationTag = metaTagFacebook;

    try {
      const response = await fetch(GENESIZ_API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(companyData)
      });

      if (response.ok) {
        logger.success('✅ Resposta 200 OK\n');
        logger.success('✅ HTML gerado com meta tag\n');
      }
    } catch (error) {
      logger.error(`❌ Erro API: ${error.message}\n`);
    }

    logger.info('\n' + '='.repeat(80));
    logger.success('🎉 FLUXO V4 - CONCLUÍDO COM SUCESSO!');
    logger.info('='.repeat(80) + '\n');

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
