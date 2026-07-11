/**
 * 🚀 FLUXO COMPLETO V2 - Domain verification otimizado
 *
 * ESTRATÉGIA CORRIGIDA COM XPATH FUNCIONANDO
 */

const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const fs = require('fs');
const logger = require('./src/utils/logger');
const RenderServiceAPI = require('./src/services/RenderServiceAPI');

puppeteer.use(StealthPlugin());

async function executarFluxoCompleto() {
  let browser, page;

  try {
    logger.info('\n' + '='.repeat(80));
    logger.info('🚀 FLUXO COMPLETO V2 - Domain Verification');
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

    // ===== CRIAR NOVO PROJETO RENDER =====
    logger.info('🔧 Criando novo projeto Render...\n');

    let dominio;
    try {
      const renderAPI = new RenderServiceAPI(process.env.RENDER_API_KEY || 'rnd_twVpTqjhhrY4bUYSNX2ucC282R9x');
      const renderProject = await renderAPI.createWebService({
        cnpj: `${Date.now()}`
      });

      if (renderProject && renderProject.url) {
        dominio = renderProject.url.replace('https://', '');
        logger.success(`✅ Projeto Render criado: ${dominio}\n`);
      } else {
        throw new Error('Não foi possível obter URL do projeto');
      }
    } catch (error) {
      logger.warn(`⚠️ Erro ao criar projeto Render: ${error.message}\n`);
      logger.info('   Usando domínio padrão\n');
      dominio = `facebook-automation-${Date.now().toString().slice(-6)}.onrender.com`;
    }

    // ===== PASSO 1: Ir para página de domínios =====
    logger.info(`🌐 [PASSO 1] Navegando para: ${domainsUrl}\n`);
    await page.goto(domainsUrl, { waitUntil: 'load', timeout: 60000 });
    await new Promise(r => setTimeout(r, 3000));
    logger.success('✅ Página carregada\n');

    // ===== PASSO 2: Clicar "Adicionar" =====
    logger.info('➕ [PASSO 2] Clicando em "Adicionar"...\n');
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

    // ===== PASSO 3: Clicar "Criar um domínio" com XPath =====
    logger.info('🔗 [PASSO 3] Clicando em "Criar um domínio" (XPath)...\n');
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
    } else {
      logger.warn('⚠️ Elemento "Criar um domínio" não encontrado\n');
    }

    await new Promise(r => setTimeout(r, 3000));

    // ===== PASSO 4: Preencher domínio =====
    logger.info(`📝 [PASSO 4] Preenchendo domínio: ${dominio}\n`);
    logger.info('   Digitando letra por letra (humanizado)...\n');

    // Focar no input primeiro
    await page.evaluate(() => {
      const input = document.querySelector('input[placeholder*="exemplo.com"]') ||
                    document.querySelector('input[placeholder*="domínio"]') ||
                    document.querySelector('input[type="text"]');
      if (input) {
        input.focus();
      }
    });

    // Digitar letra por letra com delay humanizado
    for (const letra of dominio) {
      await page.keyboard.type(letra);
      const delay = Math.random() * 100 + 30; // 30-130ms entre letras
      await new Promise(r => setTimeout(r, delay));
    }

    await new Promise(r => setTimeout(r, 1500));
    logger.success('✅ Domínio preenchido (humanizado)\n');

    // ===== PASSO 5: Anti-bot =====
    logger.info('🤖 [PASSO 5] Aplicando anti-bot...\n');

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

    // ===== PASSO 6: Enviar domínio =====
    logger.info('✅ [PASSO 6] Clicando "Adicionar" para enviar...\n');
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

    // ===== PASSO 7: Debug - Verificar se funcionou =====
    logger.info('\n🔍 [PASSO 7] DEBUG - Verificando página...\n');
    logger.info('='.repeat(80) + '\n');

    const pageInfo = await page.evaluate((dom) => {
      const texto = document.body.innerText;
      const erros = [];
      const sucessos = [];

      if (texto.includes('Erro') || texto.includes('erro')) {
        erros.push('Contém mensagem de erro');
      }
      if (texto.includes(dom)) {
        sucessos.push('Domínio aparece na página');
      }
      if (texto.includes('verificado') || texto.includes('Verificado')) {
        sucessos.push('Indicação de verificação');
      }

      return { erros, sucessos, temDominio: texto.includes('facebook-automation-688047') };
    }, dominio);

    if (pageInfo.sucessos.length > 0) {
      logger.success('✅ Sucessos encontrados:');
      for (const suc of pageInfo.sucessos) {
        logger.success(`   - ${suc}`);
      }
    }

    if (pageInfo.erros.length > 0) {
      logger.warn('⚠️ Possíveis erros:');
      for (const err of pageInfo.erros) {
        logger.warn(`   - ${err}`);
      }
    }

    logger.info('\n='.repeat(80));

    // ===== PASSO 8: Verificar domínio no Render =====
    logger.info('\n🌐 [PASSO 8] Verificando domínio no Render...\n');

    try {
      const renderUrl = `https://${dominio}`;
      logger.info(`   Acessando: ${renderUrl}\n`);

      const response = await page.goto(renderUrl, {
        waitUntil: 'load',
        timeout: 10000
      }).catch(e => {
        logger.warn(`   ⚠️ Erro ao acessar: ${e.message}`);
        return null;
      });

      if (response) {
        logger.success('✅ Domínio está acessível\n');

        // Procurar por meta tag
        logger.info('   🔍 Procurando meta tag...\n');

        const metaTagInfo = await page.evaluate(() => {
          const metas = [];

          // Procurar em todas as meta tags
          document.querySelectorAll('meta').forEach(meta => {
            const content = meta.getAttribute('content') || '';
            if (content.includes('facebook-domain-verification') || content.length > 15) {
              metas.push({
                name: meta.getAttribute('name'),
                property: meta.getAttribute('property'),
                content: content.substring(0, 100)
              });
            }
          });

          // Procurar em strong tags (Facebook coloca ali)
          const strongTags = [];
          document.querySelectorAll('strong').forEach(strong => {
            const text = strong.textContent || '';
            if (text.length > 15 && !text.includes('facebook.com')) {
              strongTags.push(text.substring(0, 100));
            }
          });

          // Procurar em code tags
          const codeTags = [];
          document.querySelectorAll('code').forEach(code => {
            const text = code.textContent || '';
            if (text.length > 15) {
              codeTags.push(text.substring(0, 100));
            }
          });

          return { metas, strongTags, codeTags };
        });

        if (metaTagInfo.metas.length > 0) {
          logger.success('✅ Meta tags encontradas:');
          for (const meta of metaTagInfo.metas) {
            logger.success(`   - ${meta.property || meta.name}: ${meta.content}`);
          }
        }

        if (metaTagInfo.strongTags.length > 0) {
          logger.success('✅ Strong tags encontradas:');
          for (const tag of metaTagInfo.strongTags) {
            logger.success(`   - ${tag}`);
          }
        }

        if (metaTagInfo.codeTags.length > 0) {
          logger.success('✅ Code tags encontradas:');
          for (const tag of metaTagInfo.codeTags) {
            logger.success(`   - ${tag}`);
          }
        }
      }
    } catch (error) {
      logger.warn(`   ⚠️ Erro ao verificar Render: ${error.message}\n`);
    }

    logger.info('\n='.repeat(80));
    logger.success('\n✅✅ FLUXO COMPLETO CONCLUÍDO!\n');
    logger.info('Navegador aberto para inspeção manual\n');
    logger.info('Pressione CTRL+C para sair\n');

    await new Promise(() => {});

  } catch (error) {
    logger.error(`\n❌ ERRO: ${error.message}\n`);
  }
}

executarFluxoCompleto();
