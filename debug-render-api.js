const logger = require('./src/utils/logger');

const RENDER_API_KEY = 'rnd_twVpTqjhhrY4bUYSNX2ucC282R9x';
const RENDER_API = 'https://api.render.com/v1';

async function debugRenderAPI() {
  logger.info('\n' + '='.repeat(80));
  logger.info('🔍 DEBUG - Render API');
  logger.info('='.repeat(80) + '\n');

  logger.info(`API Key: ${RENDER_API_KEY.substring(0, 10)}...`);
  logger.info(`Endpoint: ${RENDER_API}/services\n`);

  try {
    logger.info('📤 Tentativa 1: Criar serviço web simples...\n');

    const payload = {
      name: 'test-domain-12345',
      type: 'web_service',
      plan: 'free'
    };

    logger.info(`Payload:\n${JSON.stringify(payload, null, 2)}\n`);

    const response = await fetch(`${RENDER_API}/services`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RENDER_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    logger.info(`Status: ${response.status}\n`);

    const data = await response.json();

    logger.info('📊 Response:\n');
    logger.info(JSON.stringify(data, null, 2) + '\n');

    if (!response.ok) {
      logger.error('❌ Erro retornado pela API:\n');
      if (data.message) logger.error(`Message: ${data.message}`);
      if (data.errors) logger.error(`Errors: ${JSON.stringify(data.errors)}`);
      if (data.error) logger.error(`Error: ${data.error}`);
    }

  } catch (error) {
    logger.error(`❌ Erro ao chamar API: ${error.message}\n`);
  }

  // Tentar com autenticação diferente
  logger.info('\n' + '='.repeat(80));
  logger.info('📤 Tentativa 2: Com header Authorization diferente...\n');

  try {
    const response2 = await fetch(`${RENDER_API}/services`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RENDER_API_KEY}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        name: 'test-api-key',
        type: 'web_service'
      })
    });

    logger.info(`Status: ${response2.status}\n`);
    const data2 = await response2.json();
    logger.info('Response:\n' + JSON.stringify(data2, null, 2) + '\n');

  } catch (error) {
    logger.error(`Erro: ${error.message}\n`);
  }

  logger.info('='.repeat(80) + '\n');
}

debugRenderAPI();
