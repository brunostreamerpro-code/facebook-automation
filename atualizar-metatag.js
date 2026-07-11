/**
 * 🔄 ATUALIZAR META TAG - Atualiza o index.html com novo meta tag
 *
 * Recebe o meta tag e atualiza o arquivo para deployment
 */

const fs = require('fs');
const path = require('path');
const logger = require('./src/utils/logger');

async function atualizarMetaTag(novoMetaTag, dadosEmpresa = {}) {
  try {
    const filePath = path.join(__dirname, 'src/web/public/index.html');
    const templatePath = path.join(__dirname, 'dashboard-template.html');

    logger.info(`\n📝 Atualizando meta tag no HTML...\n`);
    logger.info(`   Novo meta tag: ${novoMetaTag}\n`);

    // Ler o template
    let html = fs.readFileSync(templatePath, 'utf-8');

    // Substituir placeholders do template
    const placeholders = {
      '{{META_TAG}}': novoMetaTag,
      '{{CNPJ}}': dadosEmpresa.cnpj || '00000000000000',
      '{{RAZAO_SOCIAL}}': dadosEmpresa.razaoSocial || 'Empresa Teste',
      '{{NOME_FANTASIA}}': dadosEmpresa.nomeFantasia || 'Empresa Teste',
      '{{EMAIL}}': dadosEmpresa.email || 'contato@empresa.com',
      '{{TELEFONE}}': dadosEmpresa.telefone || '(11) 0000-0000',
      '{{DATA_ABERTURA}}': dadosEmpresa.dataAbertura || '2024-01-01',
      '{{PORTE}}': dadosEmpresa.porte || 'Pequena',
      '{{DATA_GERACAO}}': new Date().getFullYear()
    };

    for (const [placeholder, value] of Object.entries(placeholders)) {
      html = html.replaceAll(placeholder, value);
    }

    logger.info('   ✅ Template processado com sucesso\n');

    fs.writeFileSync(filePath, html, 'utf-8');
    logger.success('✅ Arquivo atualizado com sucesso\n');

    return true;
  } catch (error) {
    logger.error(`\n❌ Erro ao atualizar meta tag: ${error.message}\n`);
    return false;
  }
}

// Export para uso no fluxo principal
module.exports = atualizarMetaTag;

// Se executado diretamente
if (require.main === module) {
  const metaTag = process.argv[2];
  if (!metaTag) {
    logger.error('Uso: node atualizar-metatag.js <meta-tag-code>\n');
    process.exit(1);
  }

  atualizarMetaTag(metaTag).then(sucesso => {
    process.exit(sucesso ? 0 : 1);
  });
}
