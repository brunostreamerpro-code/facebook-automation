/**
 * 🧪 TEST-META-V2 - Testar geração dinâmica de HTML com meta tag
 */

const { atualizarMetaTag, generateSiteHTML, normalizeFacebookVerificationTag } = require('./atualizar-metatag-v2');
const logger = require('./src/utils/logger');

async function testarGeracao() {
  logger.info('\n' + '='.repeat(80));
  logger.info('🧪 TESTE - Geração de HTML com Meta Tag');
  logger.info('='.repeat(80) + '\n');

  // Teste 1: Normalizar meta tag
  logger.info('📝 TESTE 1: Normalizando meta tag\n');
  const metaTagTeste1 = 'wrrb22brqaxrbc6ek5y59d9vka18tc';
  const metaTagTeste2 = '<meta name="facebook-domain-verification" content="wrrb22brqaxrbc6ek5y59d9vka18tc" />';
  const metaTagTeste3 = 'content="wrrb22brqaxrbc6ek5y59d9vka18tc"';

  logger.info(`   Input 1: ${metaTagTeste1}`);
  logger.info(`   Output 1: ${normalizeFacebookVerificationTag(metaTagTeste1)}\n`);

  logger.info(`   Input 2: ${metaTagTeste2}`);
  logger.info(`   Output 2: ${normalizeFacebookVerificationTag(metaTagTeste2)}\n`);

  logger.info(`   Input 3: ${metaTagTeste3}`);
  logger.info(`   Output 3: ${normalizeFacebookVerificationTag(metaTagTeste3)}\n`);

  // Teste 2: Gerar HTML
  logger.info('📝 TESTE 2: Gerando HTML com meta tag\n');
  const dadosTeste = {
    cnpj: '14123456000178',
    razaoSocial: 'Empresa Teste LTDA',
    emailDomain: 'empresa.com.br',
    telefone: '(11) 99999-9999',
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
    fbVerificationTag: 'wrrb22brqaxrbc6ek5y59d9vka18tc'
  };

  const html = generateSiteHTML(dadosTeste);

  // Verificar se o meta tag está presente
  if (html.includes('facebook-domain-verification')) {
    logger.success('✅ Meta tag "facebook-domain-verification" encontrado no HTML\n');
  } else {
    logger.error('❌ Meta tag "facebook-domain-verification" NÃO encontrado no HTML\n');
  }

  // Verificar se o meta tag tem o valor correto
  if (html.includes('wrrb22brqaxrbc6ek5y59d9vka18tc')) {
    logger.success('✅ Valor do meta tag está correto: wrrb22brqaxrbc6ek5y59d9vka18tc\n');
  } else {
    logger.error('❌ Valor do meta tag está INCORRETO\n');
  }

  // Verificar se os dados da empresa estão no HTML
  if (html.includes('Empresa Teste LTDA')) {
    logger.success('✅ Razão social encontrada no HTML\n');
  }

  if (html.includes('14123456000178')) {
    logger.success('✅ CNPJ encontrado no HTML\n');
  }

  if (html.includes('empresa.com.br')) {
    logger.success('✅ Domain email encontrado no HTML\n');
  }

  // Teste 3: Atualizar arquivo
  logger.info('\n📝 TESTE 3: Testando atualizarMetaTag\n');
  try {
    const resultado = await atualizarMetaTag('wrrb22brqaxrbc6ek5y59d9vka18tc', dadosTeste);
    if (resultado) {
      logger.success('✅ Arquivo atualizado com sucesso\n');
    } else {
      logger.error('❌ Erro ao atualizar arquivo\n');
    }
  } catch (error) {
    logger.error(`❌ Erro: ${error.message}\n`);
  }

  logger.info('\n' + '='.repeat(80));
  logger.info('✅ TESTES CONCLUÍDOS');
  logger.info('='.repeat(80) + '\n');
}

testarGeracao().catch(err => {
  logger.error(`Erro ao executar testes: ${err.message}`);
  process.exit(1);
});
