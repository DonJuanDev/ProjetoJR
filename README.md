# 🎪 Gateway — SaaS de Comandas Digitais

Sistema completo de comandas digitais para casas noturnas, bares e eventos.
Autoatendimento via QR Code + pagamento via Mercado Pago (Pix e cartão).

---

## 🏗️ Stack

| Camada | Tecnologia |
|---|---|
| Frontend | Next.js 14 + Tailwind CSS + PWA |
| Backend | NestJS + Prisma |
| Banco | PostgreSQL |
| Tempo Real | Socket.io |
| Pagamentos | Mercado Pago (Pix + Cartão) |

---

## 📁 Estrutura

```
Gateway/
├── backend/              # NestJS API
│   ├── src/
│   │   ├── modules/
│   │   │   ├── auth/         # JWT Login
│   │   │   ├── comandas/     # CRUD comandas + QR
│   │   │   ├── pedidos/      # Lançamento de itens
│   │   │   ├── pagamentos/   # Mercado Pago + Webhook
│   │   │   ├── produtos/     # Cardápio
│   │   │   └── tenants/      # Multi-tenant
│   │   ├── gateways/         # Socket.io
│   │   └── prisma/           # Banco de dados
│   └── prisma/schema.prisma
├── frontend/             # Next.js App
│   └── app/
│       ├── cliente/[id]/ # 📱 Painel do cliente (QR)
│       ├── staff/        # 🍻 Interface do garçom
│       ├── saida/        # 🚪 Validação de saída
│       └── admin/        # 📊 Dashboard
└── docker-compose.yml
```

---

## 🚀 Rodar localmente

### Pré-requisitos
- Node.js 20+
- PostgreSQL (ou Docker)

### Passo 1 — Clone e configure variáveis

```bash
# Copie os exemplos de .env
cp .env.example .env
cp backend/.env.example backend/.env
cp frontend/.env.local.example frontend/.env.local
```

Edite `backend/.env` com suas credenciais.

### Passo 2 — Suba o banco com Docker

```bash
docker run --name gateway_pg \
  -e POSTGRES_PASSWORD=gateway_pass \
  -e POSTGRES_DB=gateway_db \
  -p 5432:5432 -d postgres:16-alpine
```

### Passo 3 — Instale dependências e rode as migrações

```bash
# Backend
cd backend
npm install
npx prisma migrate dev --name init
npm run prisma:seed      # Cria dados demo

# Frontend
cd ../frontend
npm install
```

### Passo 4 — Inicie os servidores

```bash
# Terminal 1 — Backend
cd backend
npm run start:dev

# Terminal 2 — Frontend
cd frontend
npm run dev
```

Acesse:
- Frontend: http://localhost:3000
- API: http://localhost:3001/api

---

## 🐳 Rodar com Docker Compose

```bash
# Configure as variáveis de ambiente
cp .env.example .env
# Edite .env com suas credenciais do Mercado Pago

docker compose up -d

# Primeira vez: rode as migrações
docker compose exec backend npx prisma migrate deploy
docker compose exec backend npx prisma db seed
```

### Produção na VPS (ex.: Hostinger — visionmetricsapp.com.br)

Passo a passo com Nginx, HTTPS e `docker-compose.hostinger.yml`: [deploy/hostinger/README.md](deploy/hostinger/README.md).

### Produção sem VPS — Vercel + Railway

Guia passo a passo: [deploy/VERCEL_RAILWAY.md](deploy/VERCEL_RAILWAY.md).  
**Código no GitHub:** [github.com/DonJuanDev/ProjetoJR](https://github.com/DonJuanDev/ProjetoJR) — após clonar/configure Railway (root `backend`) e Vercel (root `frontend`).

Para enviar mudanças locais de volta ao GitHub: `powershell -File scripts/atualizar-github.ps1 -Mensagem "sua mensagem"`

---

## 🔑 Credenciais demo (após seed)

| Usuário | Email | Senha | Acesso |
|---|---|---|---|
| Admin | admin@demo.com | admin123 | /admin |
| Garçom | staff@demo.com | staff123 | /staff |
| Segurança | saida@demo.com | saida123 | /saida |

Tenant: `demo-club`

---

## 💳 Configuração Mercado Pago

### 1. Criar conta de desenvolvedor

Acesse: https://www.mercadopago.com.br/developers

### 2. Obter credenciais de teste (Sandbox)

1. Acesse **Suas aplicações** → **Criar aplicação**
2. Em **Credenciais de teste**, copie:
   - `Access Token` (começa com `TEST-`)
   - `Public Key` (começa com `TEST-`)
3. Cole no `backend/.env`:
   ```
   MP_ACCESS_TOKEN=TEST-xxxxxxxxxxxx
   MP_PUBLIC_KEY=TEST-xxxxxxxxxxxx
   ```

### 3. Configurar Webhook (para receber confirmações)

Em desenvolvimento, use o **ngrok** para expor localhost:

```bash
# Instale ngrok: https://ngrok.com
ngrok http 3001

# Use a URL gerada, ex:
# BACKEND_URL=https://abc123.ngrok.io
```

No painel Mercado Pago:
1. **Suas aplicações** → **Webhooks**
2. URL: `https://SUA-URL-NGROK/api/pagamentos/webhook`
3. Evento: `payment`

### 4. Confirmar pagamento manual (dev/teste)

Para testar sem processar pagamento real:

```bash
curl -X POST http://localhost:3001/api/pagamentos/confirmar-manual/PAGAMENTO_ID \
  -H "Authorization: Bearer SEU_TOKEN_JWT"
```

### 5. Dados de cartão de teste

| Cartão | Número | CVV | Vencimento |
|---|---|---|---|
| Mastercard (aprovado) | 5031 7557 3453 0604 | 123 | 11/25 |
| Visa (aprovado) | 4235 6477 2802 5682 | 123 | 11/25 |
| Qualquer (recusado) | 4000 0000 0000 0002 | 123 | 11/25 |

CPF para teste: `12345678909`

---

## 🧪 Fluxo completo de teste

```
1. Abrir /staff → Login como staff@demo.com
2. Criar nova comanda → Exibe QR Code
3. Escanear QR Code (ou abrir /cliente/HASH) → Painel do cliente
4. Em /staff → Selecionar comanda → Adicionar itens → Lançar pedido
5. No /cliente → Ver itens atualizados em tempo real → Clicar "Pagar"
6. Escolher Pix → Usar QR Code ou código copiado
7. (Opcional) Confirmar manualmente via API de teste
8. Abrir /saida → Escanear QR → Ver resultado VERDE ✅
```

---

## 🌐 Deploy

### Backend — Railway

```bash
# Instale Railway CLI
npm i -g @railway/cli
railway login
railway init
railway add --database postgresql

# Configure variáveis no painel Railway
# Faça deploy
railway up
```

### Frontend — Vercel

```bash
# Instale Vercel CLI
npm i -g vercel
cd frontend
vercel

# Configure variáveis de ambiente no painel Vercel:
# NEXT_PUBLIC_API_URL=https://SEU-BACKEND.railway.app/api
# NEXT_PUBLIC_WS_URL=https://SEU-BACKEND.railway.app
```

### Após deploy — Atualizar Webhook MP

```
URL: https://SEU-BACKEND.railway.app/api/pagamentos/webhook
```

---

## 🔐 Segurança implementada

- JWT com expiração de 8h
- QR Code hash único por HMAC-SHA256
- Toda lógica financeira no backend
- Validação de fraude: QR reutilizado detectado por status da comanda
- Rate limiting (100 req/min)
- Helmet.js para headers de segurança
- CORS configurado por origem

---

## 📡 API Endpoints

| Método | Rota | Auth | Descrição |
|---|---|---|---|
| POST | /api/auth/login | ❌ | Login |
| POST | /api/tenants | ❌ | Criar tenant (SaaS onboarding) |
| GET | /api/tenants/me | ✅ | Dados do tenant atual |
| POST | /api/comandas | ✅ | Criar comanda + QR |
| GET | /api/comandas | ✅ | Listar comandas |
| GET | /api/comandas/dashboard | ✅ | Dashboard admin |
| GET | /api/comandas/qr/:hash | ❌ | Buscar por QR Hash (cliente) |
| GET | /api/comandas/validar/:hash | ✅ | Validar saída |
| POST | /api/pedidos | ✅ | Lançar pedido |
| GET | /api/pedidos/comanda/:id | ✅ | Listar pedidos |
| POST | /api/pagamentos/criar | ❌ | Criar pagamento MP |
| POST | /api/pagamentos/webhook | ❌ | Webhook MP |
| POST | /api/pagamentos/confirmar-manual/:id | ✅ | Confirmar (apenas dev) |
| GET | /api/produtos | ✅ | Listar produtos |
| POST | /api/produtos | ✅ | Criar produto |

---

## 🏢 Multi-tenant (SaaS)

Cada casa noturna é um **Tenant** com:
- Slug único (ex: `blue-house`, `club-x`)
- Credenciais Mercado Pago próprias (ou usa a global)
- Comandas, produtos e usuários isolados por `tenantId`

Para onboarding de novo cliente:

```bash
curl -X POST http://localhost:3001/api/tenants \
  -H "Content-Type: application/json" \
  -d '{
    "nome": "Club X",
    "slug": "club-x",
    "adminEmail": "admin@clubx.com",
    "adminSenha": "senha123"
  }'
```

---

## 📱 PWA

O frontend é configurado como PWA (Progressive Web App):
- Instalável no celular (Android e iOS)
- Interface otimizada para uso em ambiente escuro
- Botões grandes para uso com balada/pouca luz
- Mobile-first
