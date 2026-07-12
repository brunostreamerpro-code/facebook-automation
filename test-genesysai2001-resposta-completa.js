const logger = require('./src/utils/logger');

const GENESIZ_API = 'https://genesisai2001.vercel.app/api/generate-site';

async function testGenesysai2001Resposta() {
  logger.info('\n' + '='.repeat(80));
  logger.info('🔍 TESTE - O que Genesysai2001 retorna?');
  logger.info('='.repeat(80) + '\n');

  const companyData = {
    cnpj: '32960315000177',
    razaoSocial: 'GRUPO G INFORMACOES COMERCIAIS',
    nomeFantasia: 'GRUPO G',
    emailDomain: 'empresa.com.br',
    email: 'contato@empresa.com.br',
    telefone: '1123647945',
    whatsapp: '11987654321',
    logradouro: 'CUPECE',
    numero: '6062',
    bairro: 'JARDIM PRUDENCIA',
    cidadeUf: 'SAO PAULO-SP',
    cep: '04366001',
    atividadePrincipal: 'Promoção de vendas',
    segmento: 'servicos',
    descricao: 'Empresa especializada em promoção de vendas',
    horario: 'Segunda a sexta, 09h-18h',
    fbVerificationTag: '4496s6i1v0p0ke9v8jspjzmrdlg6fr'
  };

  try {
    logger.info(`📤 POST ${GENESIZ_API}\n`);

    const response = await fetch(GENESIZ_API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(companyData)
    });

    if (!response.ok) {
      logger.error(`❌ Erro HTTP: ${response.status}\n`);
      return;
    }

    // Verificar headers
    logger.info('📋 RESPONSE HEADERS:\n');
    for (const [key, value] of response.headers.entries()) {
      logger.info(`  ${key}: ${value}`);
    }

    // Ler body
    const body = await response.text();

    // Tentar parsear como JSON
    let isJson = false;
    let jsonData = null;

    try {
      jsonData = JSON.parse(body);
      isJson = true;
      logger.info('\n✅ Resposta é JSON!\n');
      logger.info('JSON Content:\n');
      logger.info(JSON.stringify(jsonData, null, 2) + '\n');
    } catch (e) {
      logger.info('\n📄 Resposta é HTML (não JSON)\n');
    }

    if (!isJson) {
      // Procurar por URLs ou links na resposta
      logger.info('🔗 Procurando URLs na resposta HTML:\n');

      const urlPattern = /(https?:\/\/[^\s<>"{}|\^`\[\]]*)/g;
      const urls = body.match(urlPattern) || [];

      if (urls.length > 0) {
        logger.info(`Encontradas ${urls.length} URLs:\n`);
        for (const url of urls) {
          logger.info(`  • ${url}`);
        }
      } else {
        logger.warn('  Nenhuma URL encontrada\n');
      }

      // Procurar por "render", "deploy", "site", etc
      logger.info('\n🎯 Procurando palavras-chave:\n');
      const keywords = ['render', 'vercel', 'deployed', 'site', 'url', 'link', 'cnpj-'];
      for (const keyword of keywords) {
        if (body.toLowerCase().includes(keyword)) {
          logger.info(`  ✅ "${keyword}" encontrada\n`);
        }
      }
    }

    // Mostrar primeiros 1000 chars
    logger.info('📄 Primeiros 1000 caracteres da resposta:\n');
    if (isJson) {
      logger.info(JSON.stringify(jsonData, null, 2).substring(0, 1000) + '\n');
    } else {
      logger.info(body.substring(0, 1000) + '\n');
    }

  } catch (error) {
    logger.error(`❌ Erro: ${error.message}\n`);
  }

  logger.info('='.repeat(80) + '\n');
}

testGenesysai2001Resposta();
