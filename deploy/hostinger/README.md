# Deploy na Hostinger — visionmetricsapp.com.br

Daqui **não é possível** conectar na sua conta Hostinger; estes arquivos deixam o projeto pronto para você subir na **VPS** (recomendado). Hospedagem compartilhada sem Node persistente **não** atende Nest + Next + WebSocket.

## O que você precisa na Hostinger

- **VPS** com Ubuntu 22.04 (ou similar), IP público.
- Domínio **visionmetricsapp.com.br** com DNS apontando para o VPS:
  - Registro **A** `@` → IP da VPS
  - Registro **A** `www` → mesmo IP (opcional, mas suportado no `.env`)

## 1. Servidor — Docker e Nginx

```bash
sudo apt update && sudo apt install -y docker.io docker-compose-plugin nginx certbot python3-certbot-nginx
sudo systemctl enable --now docker nginx
sudo usermod -aG docker "$USER"
# Faça logout/login para o grupo docker valer.
```

## 2. Código no VPS

```bash
git clone <seu-repositorio-gateway>.git
cd Gateway
cp deploy/hostinger/env.hostinger.example deploy/hostinger/.env
nano deploy/hostinger/.env   # JWT_SECRET, QR_SECRET obrigatórios
```

## 3. Subir API + Frontend

```bash
docker compose -f docker-compose.hostinger.yml up -d --build
docker compose -f docker-compose.hostinger.yml logs -f
```

O SQLite fica no volume Docker `gateway_sqlite_data` (`file:/app/data/prod.db`). Faça **backup** desse volume em produção.

## 4. Nginx + HTTPS

Primeira vez: o arquivo `nginx-visionmetricsapp.conf` expõe só **porta 80** (sem certificado). Isso evita erro no `nginx -t`.

```bash
sudo cp deploy/hostinger/nginx-visionmetricsapp.conf /etc/nginx/sites-available/gateway
sudo ln -sf /etc/nginx/sites-available/gateway /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t && sudo systemctl reload nginx
```

Em seguida **obtenha HTTPS** (Certbot costuma editar o Nginx e acrescentar SSL):

```bash
sudo certbot --nginx -d visionmetricsapp.com.br -d www.visionmetricsapp.com.br
```

Depois disso use sempre **`https://`** no navegador (combina com `FRONTEND_URL` / `NEXT_PUBLIC_*` em HTTPS).

```bash
sudo systemctl reload nginx
```

## 5. Variáveis importantes

| Variável | Exemplo |
|---------|---------|
| `FRONTEND_URL` | `https://visionmetricsapp.com.br,https://www.visionmetricsapp.com.br` |
| `BACKEND_URL` | `https://visionmetricsapp.com.br` (webhook MP: `…/api/pagamentos/webhook`) |

No painel **Mercado Pago**, a URL de webhook deve ser:

`https://visionmetricsapp.com.br/api/pagamentos/webhook`

Após mudar `deploy/hostinger/.env`, recrie o backend:

```bash
docker compose -f docker-compose.hostinger.yml up -d --force-recreate backend
```

## 6. Trocar domínio no front (build)

Os URLs públicos do Next são definidos em **build time** em `docker-compose.hostinger.yml` (`NEXT_PUBLIC_*`). Se mudar o domínio, edite esse arquivo e rode:

```bash
docker compose -f docker-compose.hostinger.yml build --no-cache frontend
docker compose -f docker-compose.hostinger.yml up -d frontend
```

## 7. Primeiro tenant

Com o backend no ar, crie um tenant com `POST https://visionmetricsapp.com.br/api/tenants` (corpo JSON conforme `TenantsController`) ou use o fluxo que você já utiliza em desenvolvimento. O slug demo `demo-club` no build só afeta defaults do front; o login usa o tenant que existir no banco.

## Firewall

Abra **80** e **443** no painel da Hostinger / `ufw`:

```bash
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw enable
```
