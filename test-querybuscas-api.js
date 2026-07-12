const logger = require('./src/utils/logger');

const AUTH_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6NywidXNlcm5hbWUiOiJwZXJ3emluaG8iLCJwbGFubyI6Im1lbnNhbCIsImRpYXMiOjMwMiwidGlwbyI6ImNsaWVudGUiLCJzZXNzaW9uVG9rZW4iOiI0MTVjYmNlNDYyYjNhMzdjYjIxMGE4Zjc3ODkwMjU5YWI4NTBiMjVlY2Y2ZmE2NjE5MmUxN2Y3YTRhZThlMzAxIiwiaWF0IjoxNzgzODE0ODE4LCJleHAiOjE3ODM5MDEyMTh9.WfMzmLDRMA2Uoe0T2gjFqNcWIpeTtT-CpFCVgSHQUjo';
const CF_CLEARANCE = 'NgAFLJO1c_HONldkD1o6lRxLi3MSmwChNL9zTYu.HZc-1783814863-1.2.1.1-8mnzDmO9eA_r.YXMyBMCsaqsORU6flv7YSwE2q8ne4yih6uFZ88egAoIJ2fc2kxn7SiMscdajz33kbUeMrlIZze1R7NRKWjfrR_41BHC1.fd7RwYwgv.WJtQ4_HE8_QvkB7U3O5V9rvfZo7RjUINbhI81kxprQFi81GVbuDiBIlnKjMZ8UidbCloObx796wxM2RKwj0IEWuHKew0I8jajeAWd4kgy4W9WHZhKbgINz9eN6od9FpgDvkdCPeGJPRiznZZFxHP_mKlQ1G4B9x5fJvruwKlSR_aqg5BWwZfw9bGMll9zDiuKh3BJAc.jng6kP3d8L2wCjmrz6O8RsU6jw';

async function testarQueryBuscasAPI() {
  logger.info('\n' + '='.repeat(80));
  logger.info('🧪 TESTE - API QueryBuscas');
  logger.info('='.repeat(80) + '\n');

  try {
    logger.info('📡 Chamando API de gerador de CNPJ...\n');

    const response = await fetch('https://querybuscas.com/api/geradores/cnpj', {
      method: 'GET',
      headers: {
        'accept': '*/*',
        'accept-language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7',
        'sec-fetch-dest': 'empty',
        'sec-fetch-mode': 'cors',
        'sec-fetch-site': 'same-origin',
        'cookie': `auth_token=${AUTH_TOKEN}; cf_clearance=${CF_CLEARANCE}`
      }
    });

    if (!response.ok) {
      logger.error(`❌ Erro HTTP: ${response.status}`);
      const errorText = await response.text();
      logger.error(`Resposta: ${errorText.substring(0, 200)}\n`);
      return;
    }

    const data = await response.json();

    logger.success('✅ Resposta recebida!\n');
    logger.info('📊 Dados retornados:\n');
    logger.info(JSON.stringify(data, null, 2) + '\n');

    // Tentar buscar dados da empresa com o CNPJ
    if (data.cnpj) {
      logger.info(`\n🔍 Procurando dados da empresa com CNPJ: ${data.cnpj}\n`);

      const cnpjResponse = await fetch(`https://querybuscas.com/api/consultas/consultar-cnpj?cnpj=${data.cnpj}`, {
        method: 'GET',
        headers: {
          'accept': '*/*',
          'accept-language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7',
          'sec-fetch-dest': 'empty',
          'sec-fetch-mode': 'cors',
          'sec-fetch-site': 'same-origin',
          'cookie': `auth_token=${AUTH_TOKEN}; cf_clearance=${CF_CLEARANCE}`
        }
      });

      if (cnpjResponse.ok) {
        const cnpjData = await cnpjResponse.json();
        logger.success('✅ Dados da empresa encontrados!\n');
        logger.info(JSON.stringify(cnpjData, null, 2) + '\n');
      } else {
        logger.warn(`⚠️ Não conseguiu buscar dados: ${cnpjResponse.status}\n`);

        // Tentar outro endpoint
        logger.info('Tentando outro endpoint...\n');
        const altResponse = await fetch(`https://querybuscas.com/api/geradores/cnpj/${data.cnpj}`, {
          method: 'GET',
          headers: {
            'accept': '*/*',
            'cookie': `auth_token=${AUTH_TOKEN}; cf_clearance=${CF_CLEARANCE}`
          }
        });

        if (altResponse.ok) {
          const altData = await altResponse.json();
          logger.success('✅ Dados encontrados!\n');
          logger.info(JSON.stringify(altData, null, 2) + '\n');
        }
      }
    }

  } catch (error) {
    logger.error(`❌ Erro: ${error.message}\n`);
  }

  logger.info('='.repeat(80) + '\n');
}

testarQueryBuscasAPI();
