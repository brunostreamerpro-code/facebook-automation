# 🚀 GENESIZ + RENDER - Setup Completo

## ✅ Status

- ✅ Genesisai2001 hospedado na Vercel
- ✅ Render pré-configurado (sem precisa adicionar credenciais)
- ✅ Deploy automático ativo

---

## 🌐 URLs

| Serviço | URL |
|---------|-----|
| **Genesisai2001** | https://genesisai2001.vercel.app |
| **Render API** | Pré-configurado internamente |

---

## 🎯 Novo Workflow Simplificado

### Antes (Maneira Antiga)
```
1. Criar projeto Render manualmente
2. Preencher dados empresa
3. Gerar HTML
4. Fazer git commit/push
5. Aguardar deploy
6. Usar URL
```

### Agora (Automatizado Completo!) ⚡
```
1. Acessar https://genesisai2001.vercel.app
2. Preencher:
   - Razão Social
   - CNPJ
   - Email Domain
   - Telefone
   - Meta tag do Facebook (se tiver)
3. Clicar "Deploy Render"
4. ✅ Pronto!
   - Projeto criado automaticamente
   - Site publicado
   - URL retornada
   - Pronto para Facebook
```

---

## 🔐 Credenciais Pré-configuradas

No código do Genesisai2001 estão as credenciais:
```typescript
const DEFAULT_RENDER_CONFIG = {
  apiKey: "rnd_uDY3BcFbgTtCRCATXAbFCHaaiGZn",
  ownerId: "tea-d993sa3eo5us7381q41g"
};
```

**Resultado:** Usuário não precisa fazer nada! Tudo já funciona.

---

## 💡 Exemplo de Uso Prático

### Cenário: Verificar Domínio no Facebook

```
1. Abrir Facebook Business Manager
2. Ir para Domains
3. Clicar "Adicionar Domínio"
4. Facebook gera meta tag (exemplo: wrrb22brqaxrbc6ek5y59d9vka18tc)
5. Abrir https://genesisai2001.vercel.app
6. Preencher dados:
   - Razão Social: "Minha Empresa LTDA"
   - CNPJ: "14123456000178"
   - Email Domain: "minhaempresa.com.br"
   - Meta tag: "wrrb22brqaxrbc6ek5y59d9vka18tc"
7. Clicar "Deploy Render"
8. ✅ Receber URL (exemplo: cnpj-3456-78234-a9k.onrender.com)
9. Voltar ao Facebook
10. Preencher domínio no campo
11. Facebook verifica automaticamente
12. ✅ Domínio Verificado!
```

---

## 🤖 Integração com Automação

### Fluxo Automático (fluxo-com-genesiz.js)

```javascript
import { deployToRender, getRenderConfig } from '@/lib/renderIntegration';

async function verificarDominioAutomaticamente(metaTag, empresa) {
  // Render já está pré-configurado!
  const config = getRenderConfig(); // Retorna credenciais padrão
  
  // Criar site automaticamente
  const result = await deployToRender(config, empresa);
  
  if (result.success) {
    // URL do site pronto para usar
    console.log("Site criado em:", result.url);
    
    // Usar no Facebook para verificação
    await abrirFacebookEVerificar(result.url);
  }
}
```

---

## 📊 Dados Necessários para Deploy

```javascript
const companyData = {
  razaoSocial: "Empresa Teste",
  cnpj: "14123456000178",
  emailDomain: "empresa.com.br",
  telefone: "(11) 9999-9999",
  whatsapp: "11999999999",
  logradouro: "Rua Paulista",
  numero: "1000",
  cidadeUf: "São Paulo-SP",
  segmento: "servicos",
  fbVerificationTag: "wrrb22brqaxrbc6ek5y59d9vka18tc" // Meta tag do Facebook
};

const result = await deployToRender(config, companyData);
// result.url será: https://cnpj-6178-xxxxx.onrender.com
```

---

## 🎛️ Componente RenderConfig

Agora mostra status pré-configurado:

```
┌─────────────────────────────────────────┐
│ Render - Pré-Configurado ✅             │
├─────────────────────────────────────────┤
│                                         │
│ ✅ Render pronto para deploy automático │
│                                         │
│ API Key: rnd_uDY3B...iGZn              │
│ Owner ID: tea-d99...1q41g              │
│                                         │
│ Quando você gerar um site:              │
│ ✅ Criado no Render                     │
│ ✅ Publicado com URL pronta             │
│ ✅ Meta tag injetado                    │
│ ✅ Pronto para Facebook                 │
│                                         │
└─────────────────────────────────────────┘
```

---

## 🚀 Fluxo Completo de Automação

```
Facebook              Genesisai2001           Render
   │                      │                     │
   ├─ Criar Domínio       │                     │
   │  Gera Meta tag ──────┤                     │
   │                      │                     │
   │  Preenche dados ──┐  │                     │
   │  Meta tag     ────┼──┤ Deploy Render ──────┤
   │                  └──┤                      │
   │                     │  Criar Serviço   ───┤
   │                     │                      │ Projeto
   │                     │◄─ URL Retornada ────┤
   │                     │  (cnpj-xxxx.onrender.com)
   │                     │                      │
   │◄────────────────────┤                      │
   │  Preenche Domínio   │                      │
   │  (URL do Render)    │                      │
   │                     │                      │
   ├─ Facebook Verifica  │                      │
   │  Meta tag no site   │                      │
   │                     │                      │
   ├─ Domínio Verificado!│                      │
   ✅                    ✅                     ✅
```

---

## 🔄 Como Funciona por Dentro

1. **Genesisai2001 carrega:**
   - Código TypeScript compila para JavaScript
   - `renderIntegration.ts` define `DEFAULT_RENDER_CONFIG`
   - Credenciais são carregadas automaticamente

2. **Quando usuário clica Deploy:**
   - Função `deployToRender(config, companyData)` é chamada
   - Config tem credenciais pré-configuradas
   - API do Render é chamada diretamente
   - Novo serviço é criado
   - URL é retornada

3. **Render cria o serviço:**
   - Nome único: `cnpj-xxxx-xxxxx-xxx`
   - Plano: Free
   - Região: Ohio
   - Runtime: Node.js

---

## ✅ Checklist

- [x] Genesisai2001 subido na Vercel
- [x] Render pré-configurado no código
- [x] Componente RenderConfig atualizado
- [x] Sem precisa pedir credenciais ao usuário
- [x] Deployment automático funciona
- [x] Pronto para integração com automação

---

## 🎯 Próximos Passos

1. Usar a URL do genesisai2001 nos fluxos de automação
2. Integrar com fluxo-com-genesiz.js
3. Testar deploy automático com dados reais
4. Verificar domínio no Facebook

