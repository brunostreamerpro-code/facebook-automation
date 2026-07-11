const RenderServiceAPI = require('./src/services/RenderServiceAPI');
const logger = require('./src/utils/logger');

async function testarRender() {
  try {
    logger.info('\n🧪 TESTE DE RENDER API\n');
    logger.info('=' .repeat(60) + '\n');

    const renderAPI = new RenderServiceAPI();

    logger.info('📊 Dados de teste:');
    logger.info('   CNPJ: 12345678000190');
    logger.info('   Service Name: test-render-api\n');

    logger.info('🔧 Testando criação de projeto Render...\n');

    const resultado = await renderAPI.createWebService({
      cnpj: '12345678000190'
    });

    if (resultado && resultado.url) {
      logger.success('\n✅ SUCESSO! Projeto criado:\n');
      logger.info(`   Service ID: ${resultado.serviceId}`);
      logger.info(`   Service Name: ${resultado.serviceName}`);
      logger.info(`   Slug: ${resultado.slug}`);
      logger.info(`   URL: ${resultado.url}`);
      logger.info(`   Status: ${resultado.status}\n`);

      logger.info('=' .repeat(60));
      logger.success('🎉 TOKEN DO RENDER ESTÁ VÁLIDO!\n');
    } else {
      logger.error('\n❌ TESTE FALHOU - Nenhum resultado retornado\n');
    }

  } catch (error) {
    logger.error('\n❌ ERRO NO TESTE:\n');
    logger.error(`   ${error.message}\n`);
    if (error.response) {
      logger.error(`   Status: ${error.response.status}`);
      logger.error(`   Data: ${JSON.stringify(error.response.data, null, 2)}\n`);
    }
    logger.error('=' .repeat(60) + '\n');
  }
}

testarRender();
