const logger = require('./src/utils/logger');

async function debugLogin() {
  logger.info('\n🔍 Debugando API de Login\n');

  try {
    logger.info('📡 POST https://querybuscas.com/api/auth/login\n');

    const response = await fetch('https://querybuscas.com/api/auth/login', {
      method: 'POST',
      headers: {
        'accept': '*/*',
        'content-type': 'application/json',
        'accept-language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7'
      },
      body: JSON.stringify({
        username: 'perwzinho',
        password: 'perwzinho'
      })
    });

    logger.info(`Status: ${response.status}\n`);

    const data = await response.json();
    logger.info('📊 Resposta:\n');
    logger.info(JSON.stringify(data, null, 2) + '\n');

    if (data.auth_token) {
      logger.info(`✅ Auth Token: ${data.auth_token}\n`);
    } else if (data.token) {
      logger.info(`✅ Token: ${data.token}\n`);
    } else {
      logger.warn('⚠️ Nenhum campo de token encontrado');
      logger.info('Campos disponíveis:', Object.keys(data).join(', ') + '\n');
    }

  } catch (error) {
    logger.error(`Erro: ${error.message}\n`);
  }
}

debugLogin();
