# 🎨 FLUXO COM GENESIZ - Novo Workflow com genesisai2001

## ✅ O que mudou

**Agora usando genesisai2001 hospedado na Vercel!**

```
Antes: Render isolado → Agora: Render + Genesiz na Vercel
```

---

## 📁 Novo Arquivo

### **`fluxo-com-genesiz.js`** 🚀 NOVO
Script que integra tudo:
- Cria projeto Render (domínio de verificação)
- Captura meta tag do Facebook
- **Usa genesisai2001 para gerar o site**
- Faz deploy automático
- Verifica meta tag no site
- Confirma verificação no Facebook

---

## 🔄 Fluxo Novo vs Antigo

### Antes (fluxo-completo-v2.js)
```
1. Cria projeto Render
2. Gera HTML localmente (generateSiteHTML do genesisai2001)
3. Git commit/push
4. Render faz deploy
5. Verifica meta tag
```

### Agora (fluxo-com-genesiz.js)
```
1. Cria projeto Render
2. Captura meta tag do Facebook
3. Usa genesisai2001 (na Vercel) para gerar site
   └─ generateSiteHTML com dados dinâmicos
4. Git commit/push
5. Render faz deploy (com site gerado pelo genesisai2001)
6. Verifica meta tag no site
7. Confirma verificação no Facebook
```

---

## 🌐 Genesisai2001 na Vercel

**URL:** https://genesisai2001-mkerb64di-perwzinho.vercel.app

**O que é:**
- Dashboard gerador de sites dinamicamente
- React + TypeScript + Vite
- Hospedado na Vercel com CI/CD automático

**Como está sendo usado:**
- Código TypeScript é importado/adaptado para JavaScript
- Função `generateSiteHTML()` gera HTML profissional
- Meta tag é injetado dinamicamente no head
- Site é publicado via Render

---

## 📊 Dados Dinâmicos

O site gerado inclui:

```javascript
{
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
  horario: 'Segunda a sexta, das 09h às 18h',
  fbVerificationTag: 'META_TAG_AQUI' ← Injetado dinamicamente
}
```

---

## 🎯 Vantagens da Nova Abordagem

1. **Separação de responsabilidades:**
   - Genesiz: Gera o HTML
   - Render: Hospeda o site
   - Facebook: Verifica domínio

2. **Escalabilidade:**
   - Genesiz já é uma aplicação pronta
   - Pode gerar múltiplos sites
   - Dados dinâmicos para cada empresa

3. **Manutenibilidade:**
   - HTML é gerado pelo genesisai2001 (código limpo)
   - Atualizações de design ficam centralizadas
   - Não precisa mexer em templates

4. **Profissionalismo:**
   - Site gerado é completo e otimizado
   - Schema.org para SEO
   - Responsivo (mobile-first)
   - LGPD compliant

---

## 🚀 Como Usar

```bash
# Rodar o novo fluxo
node fluxo-com-genesiz.js
```

**O que acontece:**
1. ✅ Abre browser no Facebook
2. ✅ Navega para Business Manager → Domains
3. ✅ Clica "Criar um domínio"
4. ✅ Preenche domínio (exemplo: `cnpj-123456.onrender.com`)
5. ✅ Facebook gera meta tag
6. ✅ Captura o meta tag
7. ✅ **Genesiz gera site com o meta tag**
8. ✅ Git commit + push
9. ✅ Render faz deploy
10. ✅ Verifica se meta tag está no site
11. ✅ Clica "Verificar" no Facebook
12. ✅ **Domínio verificado!** 🎉

---

## 🔗 Referências

- **Genesisai2001:** https://github.com/ericksales4528-glitch/genesisai2001
- **Genesiz na Vercel:** https://genesisai2001-mkerb64di-perwzinho.vercel.app
- **Arquivo local:** `/atualizar-metatag-v2.js` (código TypeScript convertido para JS)

---

## 📝 Próximos Passos

1. Testar `fluxo-com-genesiz.js` com browser aberto
2. Validar que meta tag é injetado corretamente
3. Confirmar verificação no Facebook
4. Integrar com automação de WhatsApp
5. Considerar múltiplas contas simultâneas

---

## ⚙️ Configuração

Se precisar mudar a URL do Genesiz, editar:

```javascript
const GENESIZ_URL = 'https://genesisai2001-mkerb64di-perwzinho.vercel.app';
```

Dados padrão da empresa podem ser customizados em:

```javascript
const dadosEmpresa = {
  // ... editar aqui
};
```

