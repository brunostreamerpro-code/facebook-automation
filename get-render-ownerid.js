const logger = require('./src/utils/logger');

const RENDER_API_KEY = 'rnd_twVpTqjhhrY4bUYSNX2ucC282R9x';
const RENDER_API = 'https://api.render.com/v1';

async function getRenderOwnerId() {
  logger.info('\n' + '='.repeat(80));
  logger.info('🔐 OBTER OWNER ID DO RENDER');
  logger.info('='.repeat(80) + '\n');

  try {
    logger.info('📡 Chamando /owners...\n');

    const response = await fetch(`${RENDER_API}/owners`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${RENDER_API_KEY}`,
        'Accept': 'application/json'
      }
    });

    logger.info(`Status: ${response.status}\n`);

    if (!response.ok) {
      logger.error(`❌ Erro: ${response.status}\n`);
      const error = await response.json();
      logger.info(JSON.stringify(error, null, 2) + '\n');
      return;
    }

    const data = await response.json();

    logger.success('✅ Owners encontrado!\n');
    logger.info('Response:\n');
    logger.info(JSON.stringify(data, null, 2) + '\n');

    if (Array.isArray(data)) {
      logger.info('📋 OWNERS DISPONÍVEIS:\n');
      for (const owner of data) {
        logger.info(`ID: ${owner.id}`);
        logger.info(`Type: ${owner.type}`);
        logger.info(`Name: ${owner.name || 'N/A'}\n`);
      }

      if (data.length > 0) {
        logger.success(`✅ Use ownerID: ${data[0].id}\n`);
      }
    }

  } catch (error) {
    logger.error(`❌ Erro: ${error.message}\n`);
  }

  logger.info('='.repeat(80) + '\n');
}

getRenderOwnerId();
