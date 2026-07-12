/**
 * 🚀 FLUXO COMPLETO V4 - SISTEMA COM DADOS REAIS
 *
 * ✅ Query Buscas (CNPJ real)
 * ✅ Genesisai2001 (Site com dados)
 * ✅ Facebook Business Manager (Verificação)
 * ✅ Render.com (Hospedagem)
 */

const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const fs = require('fs');
const logger = require('./src/utils/logger');

puppeteer.use(StealthPlugin());

const GENESIZ_API = 'https://genesisai2001.vercel.app/api/generate-site';
const QUERYBUSCAS_API = 'https://querybuscas.com/api/geradores/cnpj';
const QUERYBUSCAS_LOGIN = 'https://querybuscas.com/api/auth/login';
const QUERYBUSCAS_USERNAME = 'perwzinho';
const QUERYBUSCAS_PASSWORD = 'perwzinho';

let QUERYBUSCAS_TOKEN = null;

// Tentar carregar token do arquivo
if (fs.existsSync('./querybuscas-token.txt')) {
  QUERYBUSCAS_TOKEN = fs.readFileSync('./querybuscas-token.txt', 'utf-8').trim();
}

const CF_CLEARANCE = 'NgAFLJO1c_HONldkD1o6lRxLi3MSmwChNL9zTYu.HZc-1783814863-1.2.1.1-8mnzDmO9eA_r.YXMyBMCsaqsORU6flv7YSwE2q8ne4yih6uFZ88egAoIJ2fc2kxn7SiMscdajz33kbUeMrlIZze1R7NRKWjfrR_41BHC1.fd7RwYwgv.WJtQ4_HE8_QvkB7U3O5V9rvfZo7RjUINbhI81kxprQFi81GVbuDiBIlnKjMZ8UidbCloObx796wxM2RKwj0IEWuHKew0I8jajeAWd4kgy4W9WHZhKbgINz9eN6od9FpgDvkdCPeGJPRiznZZFxHP_mKlQ1G4B9x5fJvruwKlSR_aqg5BWwZfw9bGMll9zDiuKh3BJAc.jng6kP3d8L2wCjmrz6O8RsU6jw';

async function fazerLoginQueryBuscas() {
  logger.info('\n🔐 Autenticando no QueryBuscas...\n');

  try {
    const response = await fetch(QUERYBUSCAS_LOGIN, {
      method: 'POST',
      headers: {
        'accept': '*/*',
        'content-type': 'application/json',
        'accept-language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7'
      },
      body: JSON.stringify({
        username: QUERYBUSCAS_USERNAME,
        password: QUERYBUSCAS_PASSWORD
      })
    });

    if (!response.ok) {
      logger.error(`❌ Erro HTTP: ${response.status}`);
      return null;
    }

    const data = await response.json();

    // O token vem como cookie, extrair dos headers Set-Cookie
    const setCookieHeader = response.headers.get('set-cookie');
    if (setCookieHeader && setCookieHeader.includes('auth_token=')) {
      const match = setCookieHeader.match(/auth_token=([^;]+)/);
      if (match) {
        QUERYBUSCAS_TOKEN = match[1];
        logger.success('✅ Autenticação com sucesso!\n');
        return match[1];
      }
    }

    // Se não tiver no set-cookie, usar o token do JSON se existir
    if (data.token) {
      QUERYBUSCAS_TOKEN = data.token;
      logger.success('✅ Autenticação com sucesso!\n');
      return data.token;
    }

    logger.error('❌ Nenhum token recebido');
    return null;

  } catch (error) {
    logger.error(`❌ Erro ao fazer login: ${error.message}\n`);
    return null;
  }
}

async function buscarDadosCNPJ() {
  logger.info('\n📊 [PASSO 0] Buscando dados reais do CNPJ via QueryBuscas...\n');

  // Fazer login se necessário
  if (!QUERYBUSCAS_TOKEN) {
    const token = await fazerLoginQueryBuscas();
    if (!token) {
      logger.error('❌ Não foi possível autenticar');
      return null;
    }
  }

  try {
    const response = await fetch(QUERYBUSCAS_API, {
      method: 'GET',
      headers: {
        'accept': '*/*',
        'accept-language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7',
        'sec-fetch-dest': 'empty',
        'sec-fetch-mode': 'cors',
        'cookie': `auth_token=${QUERYBUSCAS_TOKEN}; cf_clearance=${CF_CLEARANCE}`
      }
    });

    if (!response.ok) {
      logger.error(`❌ Erro HTTP: ${response.status}`);
      return null;
    }

    const data = await response.json();

    if (!data.DADOS_EMPRESA) {
      logger.error('❌ Nenhum CNPJ gerado');
      return null;
    }

    const empresa = data.DADOS_EMPRESA;
    const endereco = data.HISTORICO_ENDERECOS?.DADOS?.[0] || {};

    const companyData = {
      cnpj: empresa.CNPJ,
      razaoSocial: empresa.RAZAO_SOCIAL || empresa.NOME_FANTASIA,
      nomeFantasia: empresa.NOME_FANTASIA,
      emailDomain: empresa.EMAIL?.split('@')?.[1] || 'empresa.com.br',
      email: empresa.EMAIL,
      telefone: empresa.TELEFONE?.replace(/[^\d]/g, ''),
      logradouro: endereco.LOGRADOURO || 'N/A',
      numero: endereco.NUMERO || '0',
      complemento: endereco.COMPLEMENTO || '',
      bairro: endereco.BAIRRO || 'Centro',
      cidadeUf: `${endereco.CIDADE || 'São Paulo'}-${endereco.UF || 'SP'}`,
      cep: endereco.CEP || '00000-000',
      atividadePrincipal: data.CNAE?.DADOS?.[0]?.DESCRICAO || 'Serviços',
      segmento: 'servicos',
      descricao: `Empresa especializada em ${data.CNAE?.DADOS?.[0]?.DESCRICAO || 'serviços'}`
    };

    logger.success('✅ Dados obtidos com sucesso!\n');
    logger.info(`   Razão Social: ${companyData.razaoSocial}`);
    logger.info(`   CNPJ: ${companyData.cnpj}`);
    logger.info(`   Telefone: ${companyData.telefone}`);
    logger.info(`   Endereço: ${companyData.logradouro}, ${companyData.numero}\n`);

    return companyData;

  } catch (error) {
    logger.error(`❌ Erro ao buscar dados: ${error.message}\n`);
    return null;
  }
}

function gerarNomeDominio(cnpj) {
  // Pega 8 últimos dígitos do CNPJ
  const numeros = cnpj.replace(/\D/g, '').slice(-8);
  return `cnpj-${numeros}.onrender.com`;
}

async function executarFluxoCompleto() {
  let browser, page;

  try {
    logger.info('\n' + '='.repeat(80));
    logger.info('🚀 FLUXO COMPLETO V4 - SISTEMA REAL COM DADOS');
    logger.info('='.repeat(80) + '\n');

    // ===== PASSO 0: Buscar dados reais =====
    const companyData = await buscarDadosCNPJ();
    if (!companyData) {
      logger.error('❌ Não foi possível obter dados do CNPJ');
      return;
    }

    const dominio = gerarNomeDominio(companyData.cnpj);
    logger.success(`✅ Domínio gerado: ${dominio}\n`);

    // ===== Inicializar browser =====
    logger.info('🔧 Inicializando browser...\n');
    browser = await puppeteer.launch({
      headless: false,
      args: ['--disable-blink-features=AutomationControlled']
    });

    page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 720 });

    // ===== CARREGAR COOKIES =====
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

    // ===== CAPTURAR BUSINESS ID =====
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

    logger.success(`✅ ${businessIds.length} Business ID(s) encontrado(s)\n`);

    let businessId = null;
    for (const id of businessIds) {
      const domainsUrl = `https://business.facebook.com/latest/settings/domains?business_id=${id}`;
      await page.goto(domainsUrl, { waitUntil: 'load', timeout: 60000 });
      await new Promise(r => setTimeout(r, 2000));

      const temAdicionar = await page.evaluate(() => {
        const buttons = document.querySelectorAll('button, [role="button"]');
        for (const btn of buttons) {
          if (btn.textContent?.trim() === 'Adicionar') return true;
        }
        return false;
      });

      if (temAdicionar) {
        businessId = id;
        logger.success(`✅ Usando Business ID: ${businessId}\n`);
        break;
      }
    }

    if (!businessId) {
      logger.error('❌ Nenhum Business ID com permissão');
      await browser.close();
      return;
    }

    const domainsUrl = `https://business.facebook.com/latest/settings/domains?business_id=${businessId}`;

    // ===== PASSO 2: Navegar para Facebook Domains =====
    logger.info(`🌐 [PASSO 2] Navegando para Facebook Domains...\n`);
    await page.goto(domainsUrl, { waitUntil: 'load', timeout: 60000 });
    await new Promise(r => setTimeout(r, 3000));

    // ===== PASSO 3: Clicar "Adicionar" =====
    logger.info('➕ [PASSO 3] Clicando em "Adicionar"...\n');

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

    // ===== PASSO 4: Clicar "Criar domínio" =====
    logger.info('🔗 [PASSO 4] Clicando em "Criar domínio"...\n');

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

    // ===== PASSO 5: Preencher domínio =====
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
    logger.success('✅ Domínio preenchido\n');

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
    logger.success('✅ Anti-bot aplicado\n');

    // ===== PASSO 7: Enviar domínio =====
    logger.info('📤 [PASSO 7] Clicando "Adicionar"...\n');

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

    // ===== PASSO 8: Capturar meta tag =====
    logger.info('\n🔍 [PASSO 8] Capturando meta tag do Facebook...\n');

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

        const allText = document.body.innerText || '';
        const matches = allText.match(/[a-z0-9_-]{30}/gi);
        if (matches) {
          for (const match of matches) {
            if (/^[a-zA-Z0-9_-]{30}$/.test(match)) return match;
          }
        }

        return null;
      });

      if (metaTagFacebook) {
        logger.success(`✅ Meta tag capturado: ${metaTagFacebook}\n`);
        break;
      }
    }

    if (!metaTagFacebook) {
      logger.warn('⚠️ Meta tag não encontrado\n');
      await browser.close();
      return;
    }

    // ===== PASSO 9: Chamar API Genesisai2001 =====
    logger.info('\n🎨 [PASSO 9] Chamando API Genesisai2001...\n');

    companyData.fbVerificationTag = metaTagFacebook;

    try {
      logger.info(`   POST ${GENESIZ_API}\n`);

      const startTime = Date.now();

      const response = await fetch(GENESIZ_API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(companyData)
      });

      const endTime = Date.now();

      if (!response.ok) {
        logger.error(`❌ Erro HTTP: ${response.status}\n`);
        await browser.close();
        return;
      }

      const html = await response.text();
      logger.success(`✅ Resposta 200 OK em ${endTime - startTime}ms\n`);
      logger.success(`✅ HTML gerado (${(html.length / 1024).toFixed(2)} KB)\n`);

      if (html.includes(metaTagFacebook)) {
        logger.success(`✅ Meta tag injetado corretamente no HTML\n`);
      } else {
        logger.warn('⚠️ Meta tag não encontrado na resposta\n');
      }

    } catch (error) {
      logger.error(`❌ Erro ao chamar API: ${error.message}\n`);
      await browser.close();
      return;
    }

    // ===== PASSO 10: Verificar domínio no Facebook =====
    logger.info('\n✅ [PASSO 10] Voltando ao Facebook para verificar...\n');

    await page.goto(domainsUrl, { waitUntil: 'load', timeout: 60000 });
    await new Promise(r => setTimeout(r, 3000));

    logger.info('   Procurando botão "Verificar"...\n');

    const verificouDominio = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button, [role="button"]'));
      for (const btn of buttons) {
        if (btn.textContent?.toLowerCase().includes('verificar')) {
          btn.click();
          return true;
        }
      }
      return false;
    });

    if (verificouDominio) {
      logger.success('✅ Botão "Verificar" clicado!\n');
      await new Promise(r => setTimeout(r, 5000));

      const htmlFinal = await page.content();
      if (htmlFinal.includes('Verificado') || htmlFinal.includes('ativa')) {
        logger.success('✅ ✅ DOMÍNIO VERIFICADO COM SUCESSO! ✅ ✅\n');
      } else {
        logger.warn('⚠️ Verifique manualmente no Facebook\n');
      }
    } else {
      logger.warn('⚠️ Botão "Verificar" não encontrado\n');
    }

    logger.info('\n' + '='.repeat(80));
    logger.success('🎉 FLUXO COMPLETO V4 - CONCLUÍDO!');
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
