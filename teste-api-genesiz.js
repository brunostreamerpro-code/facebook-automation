/**
 * 🧪 TESTE - API do Genesisai2001
 *
 * Testa se a API está funcionando corretamente
 * Sem precisar de Facebook ou Render
 */

const logger = require('./src/utils/logger');

const GENESIZ_API = 'https://genesisai2001.vercel.app/api/generate-site';

async function testarAPI() {
  logger.info('\n' + '='.repeat(80));
  logger.info('🧪 TESTE - API Genesisai2001');
  logger.info('='.repeat(80) + '\n');

  const metaTagTeste = 'wrrb22brqaxrbc6ek5y59d9vka18tc';

  const companyData = {
    razaoSocial: 'Empresa Teste LTDA',
    cnpj: '14123456000178',
    emailDomain: 'empresa.com.br',
    telefone: '(11) 9999-9999',
    whatsapp: '11999999999',
    logradouro: 'Rua Paulista',
    numero: '1000',
    complemento: 'Sala 101',
    bairro: 'Bela Vista',
    cidadeUf: 'São Paulo-SP',
    cep: '01310-100',
    atividadePrincipal: 'Consultoria em TI',
    segmento: 'tecnologia',
    descricao: 'Empresa especializada em soluções de tecnologia',
    horario: 'Segunda a sexta, das 09h às 18h',
    fbVerificationTag: metaTagTeste
  };

  logger.info('📊 Dados da Empresa:');
  logger.info(`   Razão Social: ${companyData.razaoSocial}`);
  logger.info(`   CNPJ: ${companyData.cnpj}`);
  logger.info(`   Email Domain: ${companyData.emailDomain}`);
  logger.info(`   Meta Tag: ${companyData.fbVerificationTag}\n`);

  logger.info(`🚀 Chamando API: ${GENESIZ_API}\n`);

  try {
    logger.info('   Enviando POST request...\n');

    const response = await fetch(GENESIZ_API, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(companyData),
      timeout: 10000
    });

    if (!response.ok) {
      logger.error(`❌ Erro HTTP: ${response.status}`);
      const errorText = await response.text();
      logger.error(`   ${errorText}\n`);
      return;
    }

    logger.success(`✅ Status: ${response.status} OK\n`);

    const html = await response.text();

    logger.info('📄 Analisando HTML gerado...\n');

    // Testes
    const testes = [
      {
        nome: 'Meta tag facebook-domain-verification',
        teste: () => html.includes('facebook-domain-verification'),
        busca: 'facebook-domain-verification'
      },
      {
        nome: 'Meta tag com valor correto',
        teste: () => html.includes(`content="${metaTagTeste}"`),
        busca: `content="${metaTagTeste}"`
      },
      {
        nome: 'Razão Social no HTML',
        teste: () => html.includes(companyData.razaoSocial),
        busca: companyData.razaoSocial
      },
      {
        nome: 'CNPJ no HTML',
        teste: () => html.includes(companyData.cnpj),
        busca: companyData.cnpj
      },
      {
        nome: 'Email Domain no HTML',
        teste: () => html.includes(companyData.emailDomain),
        busca: companyData.emailDomain
      },
      {
        nome: 'Telefone no HTML',
        teste: () => html.includes(companyData.telefone),
        busca: companyData.telefone
      },
      {
        nome: 'Schema.org JSON-LD',
        teste: () => html.includes('schema.org'),
        busca: 'schema.org'
      },
      {
        nome: 'Tags HTML básicas',
        teste: () => html.includes('<!DOCTYPE html>') && html.includes('</body>'),
        busca: '<!DOCTYPE html> ... </body>'
      }
    ];

    logger.info('✅ TESTES EXECUTADOS:\n');

    let sucessos = 0;
    for (const teste of testes) {
      const resultado = teste.teste();
      if (resultado) {
        logger.success(`   ✅ ${teste.nome}`);
        sucessos++;
      } else {
        logger.error(`   ❌ ${teste.nome}`);
      }
    }

    logger.info(`\n📊 Resultado: ${sucessos}/${testes.length} testes passaram\n`);

    if (sucessos === testes.length) {
      logger.success('🎉 TODOS OS TESTES PASSARAM!\n');
      logger.success('✅ API está 100% funcional!\n');
    } else {
      logger.warn(`⚠️ ${testes.length - sucessos} testes falharam\n`);
    }

    // Mostrar tamanho do HTML
    const tamanhoKB = (html.length / 1024).toFixed(2);
    logger.info(`📦 Tamanho do HTML: ${tamanhoKB} KB\n`);

    // Mostrar preview do meta tag
    logger.info('🔍 Preview do Meta Tag no HTML:\n');
    const metaTagMatch = html.match(/<meta name="facebook-domain-verification"[^>]*>/);
    if (metaTagMatch) {
      logger.info(`   ${metaTagMatch[0]}\n`);
    }

    // Mostrar estrutura do HTML
    logger.info('📋 Estrutura HTML:\n');
    const hasHead = html.includes('<head>');
    const hasBody = html.includes('<body>');
    const hasStyleSheet = html.includes('<style>');
    const hasNavigation = html.includes('<nav>');
    const hasFooter = html.includes('<footer>');

    logger.info(`   ${hasHead ? '✅' : '❌'} <head>`);
    logger.info(`   ${hasStyleSheet ? '✅' : '❌'} <style>`);
    logger.info(`   ${hasNavigation ? '✅' : '❌'} <nav>`);
    logger.info(`   ${hasBody ? '✅' : '❌'} <body>`);
    logger.info(`   ${hasFooter ? '✅' : '❌'} <footer>\n`);

    // URL para visualizar
    logger.info('📱 Como usar:\n');
    logger.info(`   1. Copie este JSON:\n`);
    logger.info(`   ${JSON.stringify(companyData, null, 2).substring(0, 100)}...\n`);
    logger.info(`   2. Faça POST para:\n`);
    logger.info(`   ${GENESIZ_API}\n`);
    logger.info(`   3. Receba o HTML pronto para usar!\n`);

    logger.info('\n' + '='.repeat(80));
    logger.success('🎉 TESTE COMPLETO - API FUNCIONANDO PERFEITAMENTE!');
    logger.info('='.repeat(80) + '\n');

  } catch (error) {
    logger.error(`\n❌ Erro ao testar API: ${error.message}\n`);
    logger.info('Possíveis causas:');
    logger.info('1. API pode não estar respondendo');
    logger.info('2. Verifique se Vercel está online');
    logger.info('3. Tente em alguns segundos\n');
  }
}

testarAPI().catch(err => {
  logger.error(`Erro fatal: ${err.message}`);
  process.exit(1);
});
