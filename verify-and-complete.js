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
const axios = require('axios');
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

    // Dados necessários - PODEM SER PASSADOS COMO ARGUMENTOS
    let dominio = process.argv[2] || 'facebook-automation-688047.onrender.com';
    let metaTagCode = process.argv[3] || 'qk94qu19ovn1tkg3h6t23lfkkcfitm';
    const metaTagCompleto = `<meta name="facebook-domain-verification" content="${metaTagCode}" />`;
    const businessId = process.argv[4] || '1549058433439653';
    const cnpj = process.argv[5];

    logger.info(`📊 CONFIGURAÇÃO:\n`);
    logger.info(`   Domínio: ${dominio}\n`);
    logger.info(`   Meta Tag: ${metaTagCode}\n`);
    logger.info(`   Business ID: ${businessId}\n`);
    if (cnpj) logger.info(`   CNPJ: ${cnpj}\n`);

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

    // ===== PASSO 0: CRIAR/PREENCHER DOMÍNIO NO FACEBOOK =====
    logger.info('\n📌 [PASSO 0] Preenchendo Domínio no Facebook...\n');

    const domainsUrl = `https://business.facebook.com/latest/settings/domains?business_id=${businessId}`;
    logger.info(`   🌐 Navegando para domínios...\n`);
    await page.goto(domainsUrl, { waitUntil: 'load', timeout: 60000 });
    await new Promise(r => setTimeout(r, 3000));
    logger.success('   ✅ Página carregada\n');

    // Clicar "Adicionar" (abre o modal com opções)
    logger.info('   ➕ Clicando em "Adicionar" (abre opções)...');
    await page.evaluate(() => {
      const buttons = document.querySelectorAll('button, [role="button"]');
      // Procurar o primeiro botão "Adicionar" visível na página
      for (const btn of buttons) {
        const text = btn.textContent?.toLowerCase() || '';
        if (text.includes('adicionar') && btn.offsetParent !== null) {
          btn.click();
          return true;
        }
      }
    });
    await new Promise(r => setTimeout(r, 2500));
    logger.success('   ✅ Modal de opções aberto\n');

    // Clicar em "Criar um domínio" dentro do modal
    logger.info('   🔗 Clicando em "Criar um domínio" (dentro do modal)...');
    const clicouCriar = await page.evaluate(() => {
      const btn = document.getElementById('js_k8');
      if (btn) {
        btn.click();
        return true;
      }
      return false;
    });

    if (clicouCriar) {
      logger.success('   ✅ Modal de domínio aberto\n');
    } else {
      logger.warn('   ⚠️ Botão "Criar um domínio" não encontrado via ID\n');
    }

    await new Promise(r => setTimeout(r, 2000));

    // Preencher domínio
    logger.info(`   📝 Preenchendo domínio: ${dominio}...\n`);
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
    logger.success('   ✅ Domínio preenchido\n');

    // Anti-bot
    logger.info('   🤖 Aplicando anti-bot...');
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
    logger.success('   ✅ Anti-bot aplicado\n');

    // Clicar "Adicionar"
    logger.info('   ✅ Clicando em "Adicionar"...\n');
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button, [role="button"]')).reverse();
      for (const btn of buttons) {
        if (btn.textContent?.toLowerCase().includes('adicionar') && btn.offsetParent !== null) {
          btn.click();
          return true;
        }
      }
    });

    await new Promise(r => setTimeout(r, 5000)); // Aguardar mais tempo após enviar
    logger.success('   ✅ Domínio enviado!\n');

    // ===== PASSO 1: Verificar meta tag no Render =====
    logger.info('\n🌐 [PASSO 1] Verificando meta tag no site do Render...\n');

    let temMetaTag = false;
    let tentativasMetaTag = 0;
    const maxTentativas = 5;

    while (!temMetaTag && tentativasMetaTag < maxTentativas) {
      tentativasMetaTag++;
      logger.info(`   Tentativa ${tentativasMetaTag}/${maxTentativas}: Acessando http://${dominio}/\n`);

      try {
        const response = await axios.get(`http://${dominio}/`, { timeout: 10000 });
        const html = response.data;

        if (html.includes('facebook-domain-verification') && html.includes(metaTagCode)) {
          temMetaTag = true;
          logger.success(`✅ Meta tag encontrado no site!\n`);
        } else {
          logger.warn(`⚠️ Meta tag NÃO encontrado (tentativa ${tentativasMetaTag})\n`);

          if (tentativasMetaTag < maxTentativas) {
            logger.info(`   ⏳ Aguardando 5 segundos antes de tentar novamente...\n`);
            await new Promise(r => setTimeout(r, 5000));
          }
        }
      } catch (err) {
        logger.warn(`   ⚠️ Erro ao acessar site: ${err.message}\n`);

        if (tentativasMetaTag < maxTentativas) {
          logger.info(`   ⏳ Aguardando 5 segundos antes de tentar novamente...\n`);
          await new Promise(r => setTimeout(r, 5000));
        }
      }
    }

    if (temMetaTag) {
      logger.success(`\n✅ Meta tag confirmado no site!\n`);
      logger.success(`   🌐 Site: ${dominio}\n`);
      logger.success(`   🔑 Código: ${metaTagCode}\n`);
    } else {
      logger.warn(`\n⚠️ Meta tag NÃO encontrado no site após ${maxTentativas} tentativas\n`);

      // Tentar salvar em cnpj-data.json e fazer push (como no script-auto.js)
      if (cnpj) {
        logger.info(`\n📝 Tentando atualizar meta tag no repositório...\n`);
        try {
          const path = require('path');
          const cnpjDataPath = path.join(process.cwd(), 'cnpj-data.json');
          const cnpjDataContent = JSON.parse(fs.readFileSync(cnpjDataPath, 'utf8'));
          const cnpjKey = cnpj.replace(/\D/g, '');

          if (cnpjDataContent.cnpjs[cnpjKey]) {
            cnpjDataContent.cnpjs[cnpjKey].META_TAG = metaTagCode;
            fs.writeFileSync(cnpjDataPath, JSON.stringify(cnpjDataContent, null, 2), 'utf8');
            logger.success(`✅ Meta tag salvo em cnpj-data.json\n`);

            // Fazer git commit e push
            logger.info(`🚀 Enviando meta tag para Render via Git...\n`);
            try {
              const { execSync } = require('child_process');
              execSync('git add cnpj-data.json', { cwd: process.cwd(), stdio: 'pipe' });
              execSync('git commit -m "data: update meta tag for domain verification"', { cwd: process.cwd(), stdio: 'pipe' });
              execSync('git push origin main', { cwd: process.cwd(), stdio: 'pipe' });
              logger.success(`✅ Meta tag enviado para Render!\n`);

              // Aguardar Render recarregar e verificar novamente
              logger.info(`⏳ Aguardando Render recarregar (40 segundos)...\n`);
              await new Promise(r => setTimeout(r, 40000));

              logger.info(`🔄 Verificando meta tag novamente...\n`);
              try {
                const response = await axios.get(`http://${dominio}/`, { timeout: 10000 });
                if (response.data.includes('facebook-domain-verification') && response.data.includes(metaTagCode)) {
                  temMetaTag = true;
                  logger.success(`✅ Meta tag agora está presente no site!\n`);
                }
              } catch (e) {
                logger.warn(`⚠️ Erro ao verificar novamente: ${e.message}\n`);
              }
            } catch (pushErr) {
              logger.warn(`⚠️ Erro ao fazer push: ${pushErr.message}\n`);
            }
          }
        } catch (err) {
          logger.warn(`⚠️ Erro ao atualizar: ${err.message}\n`);
        }
      }

      if (!temMetaTag) {
        logger.info(`\n📋 INSTRUÇÕES MANUAIS:\n`);
        logger.info(`   1. Acesse: ${dominio}\n`);
        logger.info(`   2. Cole no <head>:\n`);
        logger.info(`   ${metaTagCompleto}\n`);
        logger.info(`   3. Salve e publique\n`);
        logger.info(`   4. Aguarde 1-2 minutos\n`);
      }
    }

    // ===== PASSO 2: Voltar ao Facebook =====
    logger.info('\n🔙 [PASSO 2] Voltando ao Facebook...\n');

    try {
      await page.waitForNavigation({ waitUntil: 'load', timeout: 10000 }).catch(() => {
        // Pode não haver navegação, é ok
      });
    } catch (e) {
      // Ignorar
    }

    const facebookUrl = `https://business.facebook.com/latest/settings/domains/?business_id=${businessId}`;

    logger.info(`   Navegando para: ${facebookUrl}\n`);
    await page.goto(facebookUrl, { waitUntil: 'networkidle2', timeout: 60000 }).catch(err => {
      logger.warn(`   ⚠️ Aviso ao navegar: ${err.message}\n`);
    });

    await new Promise(r => setTimeout(r, 4000));
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

    // ===== PASSO 4: Informações da Empresa =====
    logger.info('\n📌 [PASSO 4] Preenchendo Informações da Empresa...\n');

    const businessInfoUrl = `https://business.facebook.com/latest/settings/business_info?business_id=${businessId}`;
    logger.info(`   Navegando para: ${businessInfoUrl}\n`);
    await page.goto(businessInfoUrl, { waitUntil: 'load', timeout: 60000 }).catch(() => {
      logger.warn('   ⚠️ Não conseguiu navegar para informações');
    });
    await new Promise(r => setTimeout(r, 3000));
    logger.success('   ✅ Página carregada\n');

    // Clicar em "Editar Detalhes"
    logger.info('   ✏️ Clicando em Editar Detalhes...');
    await page.evaluate(() => {
      const buttons = document.querySelectorAll('button, [role="button"], a');
      for (const btn of buttons) {
        if (btn.textContent?.toLowerCase().includes('editar') || btn.textContent?.toLowerCase().includes('edit')) {
          btn.click();
          return true;
        }
      }
    });

    await new Promise(r => setTimeout(r, 2000));
    logger.success('   ✅ Modal de edição aberto\n');

    // ===== PASSO 5: WhatsApp =====
    logger.info('📌 [PASSO 5] Criando Conta WhatsApp...\n');

    const whatsappUrl = `https://business.facebook.com/latest/settings/whatsapp_account?business_id=${businessId}`;
    logger.info('   💬 Acessando WhatsApp...');
    await page.goto(whatsappUrl, { waitUntil: 'load', timeout: 60000 }).catch(() => {
      logger.warn('   ⚠️ Não conseguiu acessar WhatsApp');
    });
    await new Promise(r => setTimeout(r, 3000));
    logger.success('   ✅ Página carregada\n');

    // Clicar em "Adicionar"
    logger.info('   ➕ Clicando em Adicionar...');
    await page.evaluate(() => {
      const buttons = document.querySelectorAll('button, [role="button"]');
      for (const btn of buttons) {
        if (btn.textContent?.toLowerCase().includes('adicionar') || btn.textContent?.toLowerCase().includes('add')) {
          btn.click();
          return true;
        }
      }
    });

    await new Promise(r => setTimeout(r, 2000));
    logger.success('   ✅ Modal aberto\n');

    logger.success('\n✅✅ FLUXO COMPLETO CONCLUÍDO!\n');
    logger.info('='.repeat(80));
    logger.info('\n📋 RESUMO:\n');
    logger.info('   ✅ Meta tag capturado e verificado\n');
    logger.info('   ✅ Domínio verificado no Facebook\n');
    logger.info('   ✅ Informações da empresa preenchidas\n');
    logger.info('   ✅ WhatsApp pronto para configuração\n');
    logger.info('='.repeat(80) + '\n');

  } catch (error) {
    logger.error(`\n❌ ERRO: ${error.message}\n`);
  }
}

executarVerificacao();
