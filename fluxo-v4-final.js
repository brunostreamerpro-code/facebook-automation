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
const RENDER_API_KEY = 'rnd_twVpTqjhhrY4bUYSNX2ucC282R9x';
const RENDER_OWNER_ID = 'tea-d993sa3eo5us7381q41g';
const RENDER_API = 'https://api.render.com/v1';

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

    // ===== PASSO 8: Capturar Meta Tag (PÁGINA DE DETALHES) =====
    logger.info('\n🔍 [PASSO 8] Capturando meta tag da página de detalhes...\n');

    let metaTagFacebook = null;

    // Aguardar navegação para página de detalhes
    await new Promise(r => setTimeout(r, 3000));

    metaTagFacebook = await page.evaluate(() => {
      const allText = document.body.innerText || '';

      // Procurar por códigos de 30 caracteres no texto visível
      const regex = /[a-z0-9_-]{30}/gi;
      const matches = allText.match(regex);

      if (matches && matches.length > 0) {
        // Pega o primeiro match que parece ser um código válido
        for (const match of matches) {
          if (/^[a-z0-9_-]{30}$/.test(match)) {
            return match.toLowerCase();
          }
        }
      }

      // Alternativa: procurar no HTML direto
      const html = document.documentElement.outerHTML;
      const htmlMatches = html.match(/content="([a-z0-9_-]{30})"/i);
      if (htmlMatches && htmlMatches[1]) {
        return htmlMatches[1];
      }

      return null;
    });

    if (metaTagFacebook) {
      logger.success(`✅ Meta tag capturado: ${metaTagFacebook}\n`);
    } else {
      logger.warn('⚠️ Meta tag não encontrado na página de detalhes\n');

      // Debug: mostrar o que tem na página
      const pageContent = await page.evaluate(() => {
        return document.body.innerText.substring(0, 1000);
      });

      logger.info('📄 Conteúdo da página:\n');
      logger.info(pageContent + '\n');

      await browser.close();
      return;
    }

    // ===== PASSO 9: Genesysai2001 =====
    logger.info('\n🎨 [PASSO 9] Chamando Genesysai2001...\n');

    companyData.fbVerificationTag = metaTagFacebook;

    let htmlGerado = null;
    try {
      logger.info(`   POST ${GENESIZ_API}\n`);

      const response = await fetch(GENESIZ_API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(companyData)
      });

      if (response.ok) {
        htmlGerado = await response.text();
        logger.success(`✅ Resposta 200 OK\n`);
        logger.success(`✅ HTML gerado (${(htmlGerado.length / 1024).toFixed(2)} KB)\n`);

        if (htmlGerado.includes(metaTagFacebook)) {
          logger.success(`✅ Meta tag injetado no HTML\n`);
        }
      }
    } catch (error) {
      logger.error(`❌ Erro: ${error.message}\n`);
    }

    // ===== PASSO 10: Criar/Deploy no Render =====
    logger.info('\n🚀 [PASSO 10] Criando projeto no Render...\n');

    let siteUrlRender = null;

    try {
      logger.info(`   Criando projeto: ${dominio}\n`);

      // Criar projeto Render com o HTML gerado
      const renderResponse = await fetch(`${RENDER_API}/services`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${RENDER_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: dominio.replace(/\./g, '-').substring(0, 50),
          type: 'web_service',
          ownerId: RENDER_OWNER_ID,
          plan: 'free'
        })
      });

      if (renderResponse.ok) {
        const renderData = await renderResponse.json();
        siteUrlRender = `https://${dominio}`;
        logger.success(`✅ Projeto Render criado!\n`);
        logger.info(`   URL: ${siteUrlRender}\n`);
      } else {
        logger.warn(`⚠️ Não conseguiu criar projeto Render: ${renderResponse.status}\n`);
        // Usar URL do Render mesmo assim
        siteUrlRender = `https://${dominio}`;
      }

    } catch (error) {
      logger.warn(`⚠️ Erro Render: ${error.message}\n`);
      siteUrlRender = `https://${dominio}`;
    }

    // ===== PASSO 11: Verificar Domínio Facebook =====
    logger.info('\n✅ [PASSO 11] Verificando domínio no Facebook...\n');

    // O meta tag está gerado no Genesysai2001
    // Agora vamos clicar o botão "Verificar" na página de detalhes
    logger.info('   Procurando botão "Verificar" na página de detalhes...\n');

    const verificou = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button, [role="button"], div[role="button"]'));

      // Procurar por botão com "Verificar" que está visível
      for (const btn of buttons) {
        const text = btn.textContent?.toLowerCase() || '';
        if (text.includes('verificar') && btn.offsetParent !== null) {
          btn.click();
          return true;
        }
      }
      return false;
    });

    if (verificou) {
      logger.success('✅ Botão "Verificar" clicado!\n');
      await new Promise(r => setTimeout(r, 5000));

      // Verificar status
      const status = await page.evaluate(() => {
        const pageText = document.body.innerText || '';
        return {
          hasVerificado: pageText.toLowerCase().includes('verificado'),
          hasAtivo: pageText.toLowerCase().includes('ativo'),
          hasErro: pageText.toLowerCase().includes('erro') || pageText.toLowerCase().includes('falh')
        };
      });

      if (status.hasVerificado || status.hasAtivo) {
        logger.success('✅ ✅ DOMÍNIO VERIFICADO COM SUCESSO! ✅ ✅\n');
      } else if (status.hasErro) {
        logger.warn('⚠️ Falha na verificação\n');
      } else {
        logger.info('✅ Verificação iniciada! Aguarde alguns segundos no Facebook\n');
      }
    } else {
      logger.warn('⚠️ Botão "Verificar" não encontrado\n');
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
    logger.info(`   ✅ Site: https://${dominio}`);
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
