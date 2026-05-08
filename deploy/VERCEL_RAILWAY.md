# Deploy fácil: Vercel (site) + Railway (API)

Você **não precisa** de VPS, Nginx nem Certbot. O fluxo é: código no GitHub → Railway roda o **backend** (Docker) → Vercel roda o **Next.js**.

Repositório alvo: [github.com/DonJuanDev/ProjetoJR](https://github.com/DonJuanDev/ProjetoJR)

---

## 0. Enviar o código para o GitHub (uma vez)

No seu PC (com [Git instalado](https://git-scm.com/downloads)), na pasta do projeto **Gateway**:

```bash
cd Gateway
git init
git add .
git commit -m "Gateway: Next + Nest + deploy Railway/Vercel"
git branch -M main
git remote add origin https://github.com/DonJuanDev/ProjetoJR.git
git push -u origin main
```

Se o remoto já existir e der erro, use `git remote set-url origin https://github.com/DonJuanDev/ProjetoJR.git`.

*(Alternativa: [GitHub Desktop](https://desktop.github.com/) — arrastar a pasta, publicar no repositório vazio.)*

---

## 1. Railway — backend (API + WebSocket + SQLite)

1. Acesse [railway.app](https://railway.app) e faça login com GitHub.
2. **New project** → **Deploy from GitHub repo** → escolha **ProjetoJR**.
3. Na configuração do serviço:
   - **Root Directory**: `backend`
   - Railway detecta o `Dockerfile` e o [`railway.toml`](backend/railway.toml).
4. **Variables** (Environment) — **obrigatório** incluir `DATABASE_URL` (se faltar, o container reinicia em loop):
   | Name | Valor (exemplo) |
   |------|------------------|
   | `DATABASE_URL` | `file:/data/prod.db` |
   | `JWT_SECRET` | string longa aleatória |
   | `QR_SECRET` | outra string longa aleatória |
   | `FRONTEND_URL` | *(depois do passo 2)* URL do Vercel, ex. `https://projeto-jr.vercel.app` |
   | `BACKEND_URL` | URL pública do Railway, ex. `https://seu-app.up.railway.app` |
   | `PORT` | *(Railway costuma injetar sozinho; se pedir, deixe o default)* |

5. **Volume (importante)** — sem isso o SQLite some a cada deploy:  
   no serviço → **Volumes** → Add volume → mount path **`/data`**.

6. Gere o domínio público: **Settings** → **Networking** → **Generate domain**.  
   Copie a URL (HTTPS). Essa é a base do `BACKEND_URL` e do webhook do Mercado Pago:  
   `https://SUA-URL-RAILWAY/api/pagamentos/webhook`

7. **Deploy**. Abra no navegador: `https://SUA-URL-RAILWAY/api/health` → deve responder `{"ok":true}`.

**Primeira vez — criar tenant (banco vazio):**

```bash
curl -X POST https://SUA-URL-RAILWAY/api/tenants \
  -H "Content-Type: application/json" \
  -d "{\"nome\":\"Demo\",\"slug\":\"demo-club\",\"adminEmail\":\"seu@email.com\",\"adminSenha\":\"SenhaSegura123\"}"
```

---

## 2. Vercel — frontend (Next.js)

1. Acesse [vercel.com](https://vercel.com) → Login com GitHub → **Add New Project**.
2. Importe **ProjetoJR**.
3. **Root Directory**: `frontend` *(campo “Root” nas configurações do projeto)*.
4. **Environment Variables** (Production):

   | Name | Valor |
   |------|--------|
   | `NEXT_PUBLIC_API_URL` | `https://SUA-URL-RAILWAY/api` |
   | `NEXT_PUBLIC_WS_URL` | `https://SUA-URL-RAILWAY` *(mesma base, **sem** `/api`)* |
   | `NEXT_PUBLIC_TENANT_SLUG` | `demo-club` *(ou o slug que você criou)* |

5. **Deploy**.

---

## 3. Amarrar CORS de volta

O Railway precisa saber o domínio exato do Vercel:

- Em Railway → Variables → `FRONTEND_URL` = URL de produção do Vercel (ex. `https://projeto-jr.vercel.app`, sem barra no final).
- Faça **Redeploy** do backend.

Se usar domínio customizado na Vercel, coloque **esse** URL em `FRONTEND_URL`.

---

## 4. Mercado Pago (quando for usar)

- Webhook: `https://SUA-URL-RAILWAY/api/pagamentos/webhook`
- `BACKEND_URL` no Railway deve ser exatamente a mesma base (`https://SUA-URL-RAILWAY`).

---

## Ordem rápida (resumo)

1. `git push` → GitHub  
2. Railway: backend, volume `/data`, envs, domínio, testar `/api/health`, criar tenant  
3. Vercel: frontend com `NEXT_PUBLIC_*` apontando para Railway  
4. Railway: atualizar `FRONTEND_URL` + redeploy  

---

## Problemas comuns

| Sintoma | O que checar |
|--------|----------------|
| “Failed to fetch” / CORS | `FRONTEND_URL` no Railway = URL **exata** do site na Vercel (https). |
| Dados sumiram | Volume Railway não montado em `/data` ou `DATABASE_URL` ≠ `file:/data/prod.db`. |
| WebSocket não atualiza | `NEXT_PUBLIC_WS_URL` = base HTTPS do Railway, **sem** `/api`. |
| Login não existe | Rodar o `curl` de criação de tenant (`POST /api/tenants`). |
