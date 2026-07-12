const logger = require('./src/utils/logger');

const GENESIZ_API = 'https://genesisai2001.vercel.app/api/generate-site';

async function testGenesysai2001() {
  logger.info('\n' + '='.repeat(80));
  logger.info('🧪 TESTE - Genesysai2001 gera site com meta tag?');
  logger.info('='.repeat(80) + '\n');

  const metaTagTeste = '197phoerl2o9v5p0ucv0qnvhsrx5wj';

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
    descricao: 'Teste com meta tag',
    horario: 'Segunda a sexta, 09h-18h',
    fbVerificationTag: metaTagTeste
  };

  try {
    logger.info(`📤 POST ${GENESIZ_API}\n`);
    logger.info(`📌 Meta Tag: ${metaTagTeste}\n`);

    const response = await fetch(GENESIZ_API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(companyData)
    });

    if (!response.ok) {
      logger.error(`❌ Erro HTTP: ${response.status}\n`);
      return;
    }

    const html = await response.text();

    logger.info(`✅ Resposta 200 OK\n`);
    logger.info(`📊 HTML size: ${(html.length / 1024).toFixed(2)} KB\n`);

    // Verificações
    const temMetaTag = html.includes(`content="${metaTagTeste}"`);
    const temNome = html.includes(companyData.razaoSocial);
    const temCNPJ = html.includes(companyData.cnpj);
    const temDoctype = html.includes('<!DOCTYPE');
    const temHead = html.includes('<head>');
    const temBody = html.includes('<body>');

    logger.info('✅ VERIFICAÇÕES:\n');
    logger.info(`${temDoctype ? '✅' : '❌'} <!DOCTYPE html>`);
    logger.info(`${temHead ? '✅' : '❌'} <head> tag`);
    logger.info(`${temBody ? '✅' : '❌'} <body> tag`);
    logger.info(`${temNome ? '✅' : '❌'} Razão Social: ${companyData.razaoSocial}`);
    logger.info(`${temCNPJ ? '✅' : '❌'} CNPJ: ${companyData.cnpj}`);
    logger.info(`${temMetaTag ? '✅' : '❌'} Meta Tag: content="${metaTagTeste}"\n`);

    if (temMetaTag) {
      logger.success('🎉 META TAG PRESENTE NO HTML!\n');

      // Procurar pela meta tag exatamente
      const metaTagPattern = new RegExp(`<meta[^>]*facebook-domain-verification[^>]*content="${metaTagTeste}"[^>]*/?>`, 'i');
      const temCompleto = metaTagPattern.test(html);

      if (temCompleto) {
        logger.success('✅ Meta tag completa encontrada\n');

        // Extrair a meta tag
        const match = html.match(metaTagPattern);
        if (match) {
          logger.info('📋 Meta tag encontrada:\n');
          logger.info(`${match[0]}\n`);
        }
      } else {
        logger.warn('⚠️ Meta tag presente mas talvez incompleta\n');
      }
    } else {
      logger.error('❌ META TAG NÃO PRESENTE NO HTML!\n');

      // Debug: procurar qualquer "197phoerl..."
      if (html.includes(metaTagTeste)) {
        logger.warn('⚠️ Código encontrado mas não dentro de meta tag\n');
      } else {
        logger.error('❌ Código não encontrado em lugar nenhum!\n');
      }
    }

    // Mostrar snippet do HTML
    logger.info('📄 Snippet do HTML (primeiros 500 chars):\n');
    logger.info(html.substring(0, 500) + '\n');

  } catch (error) {
    logger.error(`❌ Erro: ${error.message}\n`);
  }

  logger.info('='.repeat(80) + '\n');
}

testGenesysai2001();
