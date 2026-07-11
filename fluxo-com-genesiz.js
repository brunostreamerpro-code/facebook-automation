/**
 * 🚀 FLUXO COM GENESIZ - Usa genesisai2001 na Vercel para criar sites de verificação
 *
 * Fluxo:
 * 1. Captura meta tag do Facebook
 * 2. Usa genesisai2001 para gerar HTML com meta tag
 * 3. Publica o site gerado
 * 4. Verifica domínio no Facebook
 */

const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const fs = require('fs');
const { execSync } = require('child_process');
const logger = require('./src/utils/logger');
const RenderServiceAPI = require('./src/services/RenderServiceAPI');
const { atualizarMetaTag, generateSiteHTML } = require('./atualizar-metatag-v2');

puppeteer.use(StealthPlugin());

const GENESIZ_URL = 'https://genesisai2001-mkerb64di-perwzinho.vercel.app';

async function executarFluxoComGenesiz() {
  let browser, page;

  try {
    logger.info('\n' + '='.repeat(80));
    logger.info('🚀 FLUXO COM GENESIZ - Usando genesisai2001 para criar sites');
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
    let projectId;
    try {
      const renderAPI = new RenderServiceAPI(process.env.RENDER_API_KEY || 'rnd_twVpTqjhhrY4bUYSNX2ucC282R9x');

      // Gerar nome único com timestamp e random
      const uniqueId = `${Date.now()}-${Math.random().toString(36).substring(7)}`;

      const renderProject = await renderAPI.createWebService({
        cnpj: uniqueId
      });

      if (renderProject && renderProject.url) {
        dominio = renderProject.url.replace('https://', '');
        projectId = renderProject.id;
        logger.success(`✅ Projeto Render criado: ${dominio}\n`);
        logger.info(`   Project ID: ${projectId}\n`);

        // Aguardar projeto ficar acessível
        logger.info('⏳ Aguardando projeto ficar acessível...\n');
        const maxTentativas = 20;
        let tentativa = 0;
        let projetoAcessivel = false;

        while (tentativa < maxTentativas && !projetoAcessivel) {
          tentativa++;
          await new Promise(r => setTimeout(r, 6000));

          try {
            const response = await fetch(`https://${dominio}`, { timeout: 5000 });
            if (response.status === 200 || response.status === 500) {
              logger.success(`✅ Projeto está acessível (status: ${response.status})!\n`);
              projetoAcessivel = true;
            }
          } catch (e) {
            logger.info(`   ⏳ Tentativa ${tentativa}/${maxTentativas}...`);
          }
        }
      }
    } catch (error) {
      logger.warn(`⚠️ Erro ao criar projeto Render: ${error.message}\n`);
    }

    // ===== NAVEGAR PARA FACEBOOK DOMAINS =====
    logger.info(`\n🌐 [PASSO 1] Navegando para ${domainsUrl}\n`);
    await page.goto(domainsUrl, { waitUntil: 'load' });
    await new Promise(r => setTimeout(r, 3000));

    // ===== PASSO 2: Clicar em "Criar um domínio" =====
    logger.info('🔗 [PASSO 2] Procurando botão "Criar um domínio"...\n');

    const elements = await page.$x("//div[text()='Criar um domínio']");

    if (elements.length > 0) {
      const clicouCriarDominio = await page.evaluate((elem) => {
        let current = elem;
        while (current) {
          if (current.onclick) {
            current.click();
            return true;
          }
          if (current.getAttribute && current.getAttribute('role') === 'button') {
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
    logger.info('✅ [PASSO 6] Clicando "Adicionar"...\n');
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
    logger.success('✅ Domínio enviado!\n');

    // ===== PASSO 7: Capturar meta tag =====
    logger.info('\n🔍 [PASSO 7] Capturando meta tag do Facebook...\n');

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

    // ===== PASSO 8: Atualizar via Genesiz =====
    logger.info('\n🎨 [PASSO 8] Gerando site via Genesiz...\n');

    const dadosEmpresa = {
      cnpj: '00000000000000',
      razaoSocial: 'Empresa Teste',
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
      horario: 'Segunda a sexta, das 09h às 18h'
    };

    const atualizado = await atualizarMetaTag(metaTagFacebook, dadosEmpresa);

    if (atualizado) {
      logger.info('   📤 Fazendo commit no GitHub...\n');
      execSync('git add src/web/public/index.html', { stdio: 'inherit' });
      execSync(`git commit -m "feat: update facebook domain verification meta tag"`, { stdio: 'pipe' });
      logger.success('   ✅ Commit realizado\n');

      logger.info('   🚀 Fazendo push para o GitHub...\n');
      execSync('git push origin main', { stdio: 'pipe' });
      logger.success('   ✅ Push realizado\n');

      logger.info('   ⏳ Aguardando Render fazer deploy...\n');
      await new Promise(r => setTimeout(r, 10000));

      logger.success('✅ Site gerado e deploy iniciado!\n');
    }

    // ===== PASSO 9: Verificar meta tag no Render =====
    logger.info('\n🌐 [PASSO 9] Verificando meta tag no Render...\n');

    let temMetaTagCorreto = false;
    let tentativasVerificacao = 0;
    const maxTentativasVerificacao = 5;

    while (!temMetaTagCorreto && tentativasVerificacao < maxTentativasVerificacao) {
      tentativasVerificacao++;
      logger.info(`   Tentativa ${tentativasVerificacao}/${maxTentativasVerificacao}...\n`);

      try {
        const response = await page.goto(`https://${dominio}`, {
          waitUntil: 'load',
          timeout: 8000
        }).catch(() => null);

        if (response) {
          const htmlContent = await page.content();

          if (htmlContent.includes(`content="${metaTagFacebook}"`) ||
              htmlContent.includes(`content='${metaTagFacebook}'`)) {
            logger.success(`✅ Meta tag encontrado no site!\n`);
            temMetaTagCorreto = true;
          } else if (htmlContent.includes('{{META_TAG}}') || htmlContent.includes('placeholder')) {
            logger.warn('⚠️ Meta tag ainda é placeholder, aguardando deploy...\n');
            await new Promise(r => setTimeout(r, 8000));
          }
        }
      } catch (e) {
        logger.info(`   ⚠️ Erro ao acessar: ${e.message.substring(0, 50)}\n`);
        await new Promise(r => setTimeout(r, 8000));
      }
    }

    if (!temMetaTagCorreto) {
      logger.error('❌ Meta tag não foi atualizado no Render após várias tentativas\n');
      logger.warn('⚠️ Abrindo browser para debug manual...\n');
      await new Promise(r => setTimeout(r, 60000));
      await browser.close();
      return;
    }

    // ===== PASSO 10: Voltar ao Facebook e clicar Verificar =====
    logger.info('\n✅ [PASSO 10] Voltando ao Facebook para verificar...\n');

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
        logger.warn('⚠️ Domínio pode ter sido verificado, verifique manualmente\n');
      }
    }

    logger.info('\n' + '='.repeat(80));
    logger.success('🎉 FLUXO COMPLETO FINALIZADO');
    logger.info('='.repeat(80) + '\n');

    await browser.close();

  } catch (error) {
    logger.error(`\n❌ Erro durante fluxo: ${error.message}\n`);
    if (browser) await browser.close();
  }
}

executarFluxoComGenesiz().catch(err => {
  logger.error(`Erro fatal: ${err.message}`);
  process.exit(1);
});
