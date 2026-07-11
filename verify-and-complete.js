/**
 * ✅ VERIFY AND COMPLETE - Verificar meta tag no Render e confirmar no Facebook
 *
 * 1. Ir ao site do Render
 * 2. Verificar se meta tag está presente
 * 3. Se não tiver, instruir para adicionar
 * 4. Voltar ao Facebook e clicar "Verify domain"
 */

const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const fs = require('fs');
const logger = require('./src/utils/logger');

puppeteer.use(StealthPlugin());

async function executarVerificacao() {
  let browser, page;

  try {
    logger.info('\n' + '='.repeat(80));
    logger.info('✅ VERIFICAÇÃO FINAL E CONCLUSÃO');
    logger.info('='.repeat(80) + '\n');

    browser = await puppeteer.launch({
      headless: false,
      args: ['--disable-blink-features=AutomationControlled']
    });

    page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 720 });

    // Dados necessários
    const dominio = 'facebook-automation-688047.onrender.com';
    const metaTagCode = 'qk94qu19ovn1tkg3h6t23lfkkcfitm';
    const metaTagCompleto = `<meta name="facebook-domain-verification" content="${metaTagCode}" />`;
    const businessId = '1549058433439653';

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

    // ===== PASSO 1: Verificar meta tag no Render =====
    logger.info('🌐 [PASSO 1] Verificando meta tag no site do Render...\n');
    logger.info(`   Acessando: http://${dominio}/\n`);

    await page.goto(`http://${dominio}/`, { waitUntil: 'load', timeout: 30000 }).catch(() => {
      logger.warn('   ⚠️ Site pode estar em processo de inicialização, continuando...\n');
    });

    await new Promise(r => setTimeout(r, 2000));

    const temMetaTag = await page.evaluate((codigo) => {
      const html = document.documentElement.outerHTML;
      return html.includes('facebook-domain-verification') && html.includes(codigo);
    }, metaTagCode);

    if (temMetaTag) {
      logger.success(`✅ Meta tag JÁ está presente no site!\n`);
      logger.success(`✅ Site: ${dominio}\n`);
      logger.success(`✅ Código: ${metaTagCode}\n`);
    } else {
      logger.warn(`⚠️ Meta tag NÃO encontrado no site\n`);
      logger.info(`\n📋 INSTRUÇÕES PARA ADICIONAR:\n`);
      logger.info(`   1. Acesse o servidor/arquivo HTML do site: ${dominio}`);
      logger.info(`   2. Abra o arquivo index.html ou página principal\n`);
      logger.info(`   3. Cole ANTES de </head>:\n`);
      logger.info(`   ${metaTagCompleto}\n`);
      logger.info(`   4. Salve o arquivo\n`);
      logger.info(`   5. Publique/deploy o site\n`);
      logger.info(`⏱️  Aguarde 1-2 minutos para o site recarregar\n`);

      logger.info(`💡 Você pode prosseguir manualmente e retornar para clicar "Verify domain"\n`);
    }

    // ===== PASSO 2: Voltar ao Facebook =====
    logger.info('\n🔙 [PASSO 2] Voltando ao Facebook...\n');
    const facebookUrl = `https://business.facebook.com/latest/settings/domains/?business_id=${businessId}&selected_asset_id=1341619324773678&selected_asset_type=owned-domain`;

    logger.info(`   Navegando para: ${facebookUrl}\n`);
    await page.goto(facebookUrl, { waitUntil: 'load', timeout: 60000 });
    await new Promise(r => setTimeout(r, 3000));
    logger.success('✅ Página carregada\n');

    // ===== PASSO 3: Clicar "Verify domain" =====
    logger.info('✅ [PASSO 3] Procurando botão "Verify domain"...\n');

    const clicouVerify = await page.evaluate(() => {
      const buttons = document.querySelectorAll('button, [role="button"], div[role="button"]');
      for (const btn of buttons) {
        const text = btn.textContent?.toLowerCase() || '';
        if (text.includes('verify') && text.includes('domain')) {
          logger.info('   ✅ Botão encontrado! Clicando...');
          btn.click();
          return true;
        }
      }

      // Procurar alternativas
      const elementos = document.querySelectorAll('*');
      for (const elem of elementos) {
        const text = (elem.textContent || '').toLowerCase();
        if (text === 'verify domain' || (text.includes('verify') && text.includes('domain') && text.length < 30)) {
          elem.click?.();
          return true;
        }
      }

      return false;
    });

    if (clicouVerify) {
      logger.success('✅ Botão clicado!\n');
      await new Promise(r => setTimeout(r, 3000));

      // Verificar resultado
      logger.info('⏳ Aguardando resultado da verificação...\n');
      await new Promise(r => setTimeout(r, 3000));

      const resultado = await page.evaluate(() => {
        const texto = document.body.innerText.toLowerCase();
        if (texto.includes('verified')) {
          return 'VERIFIED';
        }
        if (texto.includes('verificado')) {
          return 'VERIFICADO';
        }
        if (texto.includes('verificação') || texto.includes('verification')) {
          return 'EM_PROCESSO';
        }
        return 'DESCONHECIDO';
      });

      if (resultado === 'VERIFIED' || resultado === 'VERIFICADO') {
        logger.success('\n🎉🎉🎉 DOMÍNIO VERIFICADO COM SUCESSO!\n');
      } else if (resultado === 'EM_PROCESSO') {
        logger.info('\n⏳ Verificação em processo (pode levar até 72 horas)\n');
      } else {
        logger.warn('\n⚠️ Status desconhecido - verifique a página\n');
      }

    } else {
      logger.warn('⚠️ Botão "Verify domain" não encontrado\n');
      logger.info('💡 Tente clicar manualmente no botão na página aberta\n');
    }

    logger.success('\n✅✅ PROCESSO CONCLUÍDO!\n');
    logger.info('='.repeat(80) + '\n');

  } catch (error) {
    logger.error(`\n❌ ERRO: ${error.message}\n`);
  }
}

executarVerificacao();
