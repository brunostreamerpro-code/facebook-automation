/**
 * 🚀 FLUXO COMPLETO V2 - USANDO GENESISAI2001
 *
 * ✅ SEM CRIAR RENDER
 * ✅ USA API DO GENESISAI2001
 * ✅ INSTANTÂNEO E ESCALÁVEL
 */

const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const fs = require('fs');
const logger = require('./src/utils/logger');

puppeteer.use(StealthPlugin());

const GENESIZ_API = 'https://genesisai2001.vercel.app/api/generate-site';
const GENESIZ_URL = 'https://genesisai2001.vercel.app';

async function executarFluxoCompleto() {
  let browser, page;

  try {
    logger.info('\n' + '='.repeat(80));
    logger.info('🚀 FLUXO COMPLETO V2 - Usando Genesisai2001');
    logger.info('='.repeat(80) + '\n');

    // Inicializar browser
    browser = await puppeteer.launch({
      headless: false,
      args: ['--disable-blink-features=AutomationControlled']
    });

    page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 720 });

    // ===== CARREGAR COOKIES =====
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

    const businessId = '1549058433439653';
    const domainsUrl = `https://business.facebook.com/latest/settings/domains?business_id=${businessId}`;

    // ===== USAR GENESISAI2001.VERCEL.APP COMO DOMÍNIO =====
    const dominio = 'genesisai2001.vercel.app';
    logger.success(`✅ Usando Genesisai2001: ${dominio}\n`);
    logger.info('   (Sem criar Render, sem git deploy)\n');

    // ===== PASSO 1: Navegar para Facebook Domains =====
    logger.info(`🌐 [PASSO 1] Navegando para Facebook Domains...\n`);
    await page.goto(domainsUrl, { waitUntil: 'load', timeout: 60000 });
    await new Promise(r => setTimeout(r, 3000));

    // ===== PASSO 2: Clicar "Criar um domínio" =====
    logger.info('🔗 [PASSO 2] Clicando em "Criar um domínio"...\n');
    const elements = await page.$x("//div[text()='Criar um domínio']");

    if (elements.length > 0) {
      const clicouCriarDominio = await page.evaluate((elem) => {
        let current = elem;
        for (let i = 0; i < 15; i++) {
          if (current && current.getAttribute && current.getAttribute('role') === 'gridcell') {
            current.click();
            return true;
          }
          current = current?.parentElement;
        }
        return false;
      }, elements[0]);

      if (clicouCriarDominio) {
        logger.success('✅ Clique executado\n');
      }
    }

    await new Promise(r => setTimeout(r, 3000));

    // ===== PASSO 3: Preencher domínio =====
    logger.info(`📝 [PASSO 3] Preenchendo: ${dominio}\n`);

    await page.evaluate(() => {
      const input = document.querySelector('input[placeholder*="exemplo.com"]') ||
                    document.querySelector('input[placeholder*="domínio"]') ||
                    document.querySelector('input[type="text"]');
      if (input) input.focus();
    });

    for (const letra of dominio) {
      await page.keyboard.type(letra);
      await new Promise(r => setTimeout(r, Math.random() * 100 + 30));
    }

    await new Promise(r => setTimeout(r, 1500));
    logger.success('✅ Domínio preenchido\n');

    // ===== PASSO 4: Anti-bot =====
    logger.info('🤖 [PASSO 4] Anti-bot...\n');

    const ultimaLetra = await page.evaluate((dom) => {
      const input = document.querySelector('input[placeholder*="exemplo.com"]') ||
                    document.querySelector('input[type="text"]');
      if (!input) return null;
      input.value = dom.slice(0, -1);
      input.dispatchEvent(new Event('input', { bubbles: true }));
      input.dispatchEvent(new Event('keydown', { bubbles: true }));
      input.dispatchEvent(new Event('keyup', { bubbles: true }));
      return dom.slice(-1);
    }, dominio);

    await new Promise(r => setTimeout(r, 300));

    if (ultimaLetra) {
      await page.keyboard.type(ultimaLetra);
      await new Promise(r => setTimeout(r, 200));
      logger.success('✅ Anti-bot aplicado\n');
    }

    // ===== PASSO 5: Enviar domínio =====
    logger.info('✅ [PASSO 5] Clicando "Adicionar"...\n');
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button, [role="button"]')).reverse();
      for (const btn of buttons) {
        if (btn.textContent?.toLowerCase().includes('adicionar') && btn.offsetParent !== null) {
          btn.click();
          return true;
        }
      }
    });

    await new Promise(r => setTimeout(r, 3000));
    logger.success('✅ Domínio enviado\n');

    // ===== PASSO 6: Capturar meta tag =====
    logger.info('\n🔍 [PASSO 6] Capturando meta tag do Facebook...\n');

    const metaTagFacebook = await page.evaluate(() => {
      const inputs = document.querySelectorAll('input[type="text"], input[type="hidden"]');
      for (const input of inputs) {
        const value = input.value || '';
        if (value.length === 30 && /^[a-zA-Z0-9_-]+$/.test(value)) return value;
      }

      const codeTags = document.querySelectorAll('code');
      for (const code of codeTags) {
        const text = code.textContent || '';
        const match = text.match(/content=["']([a-zA-Z0-9_-]{28,32})["']/);
        if (match && match[1]) return match[1];
      }

      const textElements = document.querySelectorAll('span, div, p');
      for (const elem of textElements) {
        const text = (elem.textContent || '').trim();
        if (text.length === 30 && /^[a-zA-Z0-9_-]+$/.test(text)) return text;
      }

      return null;
    });

    if (metaTagFacebook) {
      logger.success(`✅ Meta tag capturado: ${metaTagFacebook}\n`);
    } else {
      logger.warn('⚠️ Meta tag não encontrado\n');
      await browser.close();
      return;
    }

    // ===== PASSO 7: Chamar API do Genesisai2001 =====
    logger.info('\n🎨 [PASSO 7] Chamando API Genesisai2001...\n');

    const companyData = {
      razaoSocial: 'Empresa Teste',
      cnpj: '00000000000000',
      emailDomain: 'empresa.com.br',
      telefone: '(11) 0000-0000',
      whatsapp: '',
      logradouro: 'Rua Exemplo',
      numero: '123',
      complemento: '',
      bairro: 'Centro',
      cidadeUf: 'São Paulo-SP',
      cep: '00000-000',
      atividadePrincipal: 'Serviços',
      segmento: 'servicos',
      descricao: 'Empresa de serviços brasileira',
      horario: 'Segunda a sexta, das 09h às 18h',
      fbVerificationTag: metaTagFacebook
    };

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

    // ===== PASSO 8: Verificar meta tag no Genesisai2001 =====
    logger.info('\n🌐 [PASSO 8] Verificando meta tag no Genesisai2001...\n');

    let temMetaTagCorreto = false;
    let tentativasVerificacao = 0;
    const maxTentativasVerificacao = 5;

    while (!temMetaTagCorreto && tentativasVerificacao < maxTentativasVerificacao) {
      tentativasVerificacao++;
      logger.info(`   Tentativa ${tentativasVerificacao}/${maxTentativasVerificacao}...\n`);

      try {
        const response = await page.goto(GENESIZ_API, {
          waitUntil: 'load',
          timeout: 8000
        }).catch(() => null);

        if (response) {
          const htmlContent = await page.content();

          if (htmlContent.includes(`content="${metaTagFacebook}"`) ||
              htmlContent.includes(`content='${metaTagFacebook}'`)) {
            logger.success(`✅ Meta tag encontrado no Genesisai2001!\n`);
            temMetaTagCorreto = true;
          } else {
            logger.warn('⚠️ Aguardando...\n');
            await new Promise(r => setTimeout(r, 8000));
          }
        }
      } catch (e) {
        logger.info(`   ⚠️ ${e.message.substring(0, 50)}\n`);
        await new Promise(r => setTimeout(r, 8000));
      }
    }

    if (!temMetaTagCorreto) {
      logger.error('❌ Meta tag não foi verificado\n');
      await browser.close();
      return;
    }

    // ===== PASSO 9: Voltar ao Facebook e clicar Verificar =====
    logger.info('\n✅ [PASSO 9] Voltando ao Facebook para verificar domínio...\n');

    await page.goto(domainsUrl, { waitUntil: 'load' });
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
    }

    logger.info('\n' + '='.repeat(80));
    logger.success('🎉 FLUXO COMPLETO V2 - CONCLUÍDO!');
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
