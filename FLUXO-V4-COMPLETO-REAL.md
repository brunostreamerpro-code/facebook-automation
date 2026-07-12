# 🚀 FLUXO V4 - SISTEMA COMPLETO COM DADOS REAIS

## 📋 Arquitetura

```
CNPJ Input
    ↓
Query Byscas (busca dados reais)
    ↓
Criar Projeto Render (projeto-cnpj.onrender.com)
    ↓
Gerar Site no Genesisai2001 (com dados reais)
    ↓
Facebook Business Manager (adicionar domínio)
    ↓
Capturar Meta Tag
    ↓
Atualizar Site com Meta Tag
    ↓
Verificar Domínio ✅
    ↓
Whatsapp Automation (próximo passo)
```

---

## 🔧 Passos Implementados

### ✅ PASSO 1-6: Fluxo Facebook (Funcionando)
- ✅ Carregar cookies
- ✅ Capturar Business ID
- ✅ Preencher domínio
- ✅ Aplicar anti-bot
- ✅ Enviar domínio
- ✅ Capturar meta tag

### ✅ PASSO 7: Domínio .onrender.com (Testado)
- ✅ Facebook ACEITA `.onrender.com`
- ✅ Meta tag é gerado corretamente
- ✅ Botão "Verificar" aparece

### 🔨 PASSO 8: Query Byscas (Precisa API)
- Buscar dados reais do CNPJ
- Nome, endereço, telefone, etc
- **PENDENTE: URL/método da API**

### 🔨 PASSO 9: Criar Projeto Render (Será automatizado)
- Nome: `cnpj-{random}.onrender.com`
- Deploy automático
- **PENDENTE: Integração com Render API**

### 🔨 PASSO 10: Atualizar Site com Meta Tag
- POST no Genesisai2001 com dados + meta tag
- Site pronto com verificação

### 🔨 PASSO 11: Verificar Domínio Facebook
- Clicar botão "Verificar"
- Confirmar sucesso

---

## 📊 Domínios Testados

| Domínio | Tipo | Facebook | Status |
|---------|------|----------|--------|
| `genesisai2001.vercel.app` | Subdomínio | ❌ Rejeitado | Meta tag não gerado |
| `teste-fb-verification.onrender.com` | Raiz Render | ✅ Aceito | Meta tag gerado ✅ |

---

## 🎯 Próximos Passos

1. **Integrar Query Byscas**
   - URL: `___` (PENDENTE)
   - Retorno: JSON com dados do CNPJ

2. **Render API**
   - Criar projeto automático
   - Deploy código
   - Obter URL `*.onrender.com`

3. **Atualizar fluxo-completo-v4.js**
   - Incluir query byscas
   - Incluir render automation
   - Usar `.onrender.com`

4. **Testar end-to-end**
   - Com dados reais
   - Com múltiplas contas

---

## 📝 Dados Esperados do CNPJ

```json
{
  "razaoSocial": "Nome Empresa LTDA",
  "cnpj": "12.345.678/0001-90",
  "logradouro": "Rua/Av...",
  "numero": "123",
  "bairro": "Centro",
  "cidadeUf": "São Paulo-SP",
  "cep": "01310-100",
  "telefone": "(11) 9999-9999",
  "email": "contato@empresa.com.br"
}
```

---

## 🔐 Credenciais Necessárias

- ✅ Cookies Facebook (lista.txt)
- ✅ Genesisai2001 API (PRONTO)
- 🔨 Render API Key (PENDENTE)
- 🔨 Query Byscas Token (PENDENTE)

---

## 📈 Timeline

- ✅ 2026-01-01: Automação Facebook v1-v3
- ✅ 2026-07-11: Domínio .onrender.com testado
- 🔨 2026-07-11: Aguardando API byscas
- 📅 2026-07-12: Implementar full automation

