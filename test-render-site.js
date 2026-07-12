const logger = require('./src/utils/logger');

async function testRenderSite() {
  const siteUrl = 'https://cnpj-32960315-t8f1nd.onrender.com';
  const metaTag = 'rlaor279g623i3t6afkpmrjnwxik5d';

  logger.info('\n' + '='.repeat(80));
  logger.info('🌐 ACESSANDO SITE DO RENDER');
  logger.info('='.repeat(80) + '\n');

  logger.info(`📍 URL: ${siteUrl}\n`);
  logger.info(`🔍 Procurando meta tag: ${metaTag}\n`);

  try {
    logger.info('⏳ Acessando site...\n');

    const response = await fetch(siteUrl, {
      timeout: 10000
    });

    logger.info(`📊 Status: ${response.status}\n`);

    if (!response.ok) {
      logger.error(`❌ Erro HTTP: ${response.status}\n`);
      return;
    }

    const html = await response.text();

    logger.success('✅ Site acessado com sucesso!\n');

    // Verificações
    logger.info('🔍 VERIFICAÇÕES:\n');

    const temMetaTag = html.includes(`content="${metaTag}"`);
    const temCNPJ = html.includes('32960315000177');
    const temRazaoSocial = html.includes('GRUPO G');
    const temDoctype = html.includes('<!DOCTYPE');
    const temHead = html.includes('<head>');

    logger.info(`${temDoctype ? '✅' : '❌'} DOCTYPE`);
    logger.info(`${temHead ? '✅' : '❌'} <head> tag`);
    logger.info(`${temMetaTag ? '✅' : '❌'} Meta tag com código: ${metaTag}`);
    logger.info(`${temCNPJ ? '✅' : '❌'} CNPJ: 32960315000177`);
    logger.info(`${temRazaoSocial ? '✅' : '❌'} Razão Social: GRUPO G\n`);

    if (temMetaTag) {
      logger.success('🎉 META TAG ENCONTRADO NO SITE!\n');

      // Extrair linha completa
      const lines = html.split('\n');
      for (const line of lines) {
        if (line.includes('facebook-domain-verification')) {
          logger.info('📋 Meta tag encontrado:\n');
          logger.info(`${line.trim()}\n`);
          break;
        }
      }
    } else {
      logger.error('❌ META TAG NÃO ENCONTRADO!\n');
    }

    // Mostrar conteúdo
    logger.info('📄 PRIMEIROS 1500 CARACTERES:\n');
    logger.info(html.substring(0, 1500) + '\n');

    // Estatísticas
    logger.info('📊 ESTATÍSTICAS:\n');
    logger.info(`   Tamanho: ${(html.length / 1024).toFixed(2)} KB`);
    logger.info(`   Linhas: ${html.split('\n').length}`);
    logger.info(`   Contém "meta": ${html.toLowerCase().includes('meta')}`);
    logger.info(`   Contém "facebook": ${html.toLowerCase().includes('facebook')}\n`);

  } catch (error) {
    logger.error(`❌ Erro ao acessar: ${error.message}\n`);

    if (error.message.includes('ENOTFOUND')) {
      logger.warn('⚠️ Domínio não resolveu (pode não estar deployed ainda)\n');
    } else if (error.message.includes('ECONNREFUSED')) {
      logger.warn('⚠️ Conexão recusada (servidor não respondeu)\n');
    } else if (error.message.includes('timeout')) {
      logger.warn('⚠️ Timeout ao acessar (site pode estar lento)\n');
    }
  }

  logger.info('='.repeat(80) + '\n');
}

testRenderSite();
