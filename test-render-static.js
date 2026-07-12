const logger = require('./src/utils/logger');

const RENDER_API_KEY = 'rnd_twVpTqjhhrY4bUYSNX2ucC282R9x';
const RENDER_OWNER_ID = 'tea-d993sa3eo5us7381q41g';
const RENDER_API = 'https://api.render.com/v1';

async function testRenderStatic() {
  logger.info('\n' + '='.repeat(80));
  logger.info('🔧 TESTE - Static Site no Render');
  logger.info('='.repeat(80) + '\n');

  const payload = {
    name: 'test-static-cnpj-abc',
    ownerId: RENDER_OWNER_ID,
    type: 'static_site',
    plan: 'free'
  };

  logger.info('📤 Payload:\n');
  logger.info(JSON.stringify(payload, null, 2) + '\n');

  try {
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

    if (response.ok) {
      logger.success('✅ Serviço estático criado!\n');
      logger.info(`Service ID: ${data.id}`);
      logger.info(`URL: ${data.url}\n`);
    } else {
      logger.error(`❌ ${data.message || data.error}\n`);
    }

  } catch (error) {
    logger.error(`❌ ${error.message}\n`);
  }

  logger.info('='.repeat(80) + '\n');
}

testRenderStatic();
