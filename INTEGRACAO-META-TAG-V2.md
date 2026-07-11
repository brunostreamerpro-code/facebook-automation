# 🚀 INTEGRAÇÃO META TAG V2 - Geração Dinâmica

## ✅ O que foi feito

Integrou-se a lógica do **genesisai2001** para gerar HTML dinamicamente com meta tag injetado corretamente, eliminando o problema do `{{META_TAG}}` vazio.

---

## 📁 Arquivos Criados/Modificados

### 1. **`atualizar-metatag-v2.js`** ✨ NOVO
Gerador dinâmico de HTML baseado no genesisai2001.

**Funcionalidades:**
- ✅ `normalizeFacebookVerificationTag()` - Limpa e normaliza o meta tag
  - Extrai valor de tags HTML completas: `<meta ...="..." content="CODIGO" />`
  - Remove caracteres inválidos
  - Retorna código limpo

- ✅ `generateSiteHTML()` - Gera HTML completo com meta tag injetado
  - Cria site profissional com dados dinâmicos
  - Injeta meta tag diretamente no `<head>`
  - Inclui Schema.org para SEO
  - Responsivo e otimizado

- ✅ `atualizarMetaTag()` - Atualiza arquivo e escreve em `src/web/public/index.html`

```javascript
const { atualizarMetaTag } = require('./atualizar-metatag-v2');

await atualizarMetaTag('wrrb22brqaxrbc6ek5y59d9vka18tc', {
  cnpj: '14123456000178',
  razaoSocial: 'Empresa Teste LTDA',
  emailDomain: 'empresa.com.br',
  // ... mais dados
});
```

---

### 2. **`fluxo-completo-v2.js`** 🔄 MODIFICADO
Atualizado para usar o novo gerador.

**Mudanças:**
```javascript
// ANTES
const atualizarMetaTag = require('./atualizar-metatag');

// DEPOIS
const { atualizarMetaTag } = require('./atualizar-metatag-v2');
```

**Dados passados agora incluem:**
```javascript
const dadosEmpresa = {
  cnpj: '00000000000000',
  razaoSocial: 'Empresa Teste',
  emailDomain: 'empresa.com.br',
  telefone: '(11) 0000-0000',
  whatsapp: '',
  logradouro: 'Rua Exemplo',
  numero: '123',
  complemento: '',
  bairro: 'Centro',
  cidadeUf: 'São Paulo-SP',
  cep: '00000-000',
  atividadePrincipal: 'Serviços',
  segmento: 'servicos',
  descricao: 'Empresa de serviços brasileira',
  horario: 'Segunda a sexta, das 09h às 18h'
};
```

---

### 3. **`test-meta-v2.js`** 🧪 NOVO
Script de teste para validar a geração dinâmica.

**Testes realizados:**
- ✅ Normalização de meta tag (3 formatos diferentes)
- ✅ Geração de HTML com meta tag injetado
- ✅ Verificação de valores corretos no HTML
- ✅ Atualização de arquivo

**Como rodar:**
```bash
node test-meta-v2.js
```

---

## 🔄 Fluxo Completo Agora

```
1. Facebook gera meta tag
   ↓
2. PASSO 7: Captura meta tag do Facebook
   ↓
3. PASSO 8: Atualiza HTML
   ├─ normalizeFacebookVerificationTag(metaTag)
   ├─ generateSiteHTML(dados + metaTag normalizado)
   └─ Escreve em src/web/public/index.html
   ↓
4. Git commit + push
   ↓
5. Render faz deploy automático
   ↓
6. PASSO 9: Verifica se meta tag está no Render
   ├─ Acessa site
   ├─ Procura: <meta name="facebook-domain-verification" content="...">
   └─ Se encontrado: prossegue para PASSO 10
   ↓
7. PASSO 10: Facebook verifica domínio
   └─ ✅ VERIFICADO!
```

---

## 📝 HTML Gerado - Exemplo

```html
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="facebook-domain-verification" content="wrrb22brqaxrbc6ek5y59d9vka18tc" />
    <!-- ... resto do head ... -->
</head>
<body>
    <!-- Site profissional com dados da empresa -->
</body>
</html>
```

**Diferença:**
- ✅ **ANTES:** `<meta name="facebook-domain-verification" content="{{META_TAG}}" />` ← Vazio!
- ✅ **DEPOIS:** `<meta name="facebook-domain-verification" content="wrrb22brqaxrbc6ek5y59d9vka18tc" />` ← Correto!

---

## 🎯 Vantagens

1. **Meta tag sempre correto** - Não há placeholder vazio
2. **Site profissional** - Baseado em template real do genesisai2001
3. **Dados dinâmicos** - Cada empresa tem seu próprio site
4. **SEO otimizado** - Schema.org + Open Graph
5. **Responsivo** - Funciona em mobile e desktop
6. **Sem template estático** - Geração pura de HTML

---

## 🧪 Resultado dos Testes

```
✅ Normalização de meta tag (3 formatos)
✅ Geração de HTML com meta tag injetado
✅ Meta tag "facebook-domain-verification" encontrado
✅ Valor do meta tag correto
✅ Razão social no HTML
✅ CNPJ no HTML
✅ Domain email no HTML
✅ Arquivo atualizado com sucesso
```

---

## 🚀 Próximos Passos

1. Rodar `fluxo-completo-v2.js` com os testes completos
2. Verificar se meta tag aparece no Render após deploy
3. Testar verificação de domínio no Facebook
4. Validar em conta real se tudo funciona

