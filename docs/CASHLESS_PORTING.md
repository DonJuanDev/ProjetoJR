# Inventário Gateway × padrões igreja-cashless — plano incremental

Este documento mapeia o que já existia antes desta porta e como foi alinhado às boas práticas de cashless (transações Prisma, idempotência PIX, carteira opcional).

## O que já existia no Gateway

| Área | Situação anterior |
|------|-------------------|
| **Consistência / transações** | `processarWebhook` já usava `$transaction`; `confirmarManual` também. |
| **Idempotência webhook** | Não garantida: retries do MP poderiam repetir efeitos (ex.: atualizar estado / emit socket). |
| **Carteira pré-paga** | Inexistente. |
| **QR anti-fraude** | `qrCodeHash` opaco desde a criação; sem MAC verificável no payload. Env `QR_SECRET` já gerava hash de URL. |
| **PDV + estoque** | Pedidos sem controle de `estoque` no `Produto`. |
| **Rate limit** | `ThrottlerModule` global sem `ThrottleGuard`; limites efetivamente não aplicados. |
| **Roles** | JWT com `ADMIN`, `STAFF`, `SEGURANCA`; sem guard de roles dedicado para “caixa”. |
| **Auditoria carteira** | Inexistente. |

## Implementado neste ciclo (PR lógico 1 — backend core)

1. **Schema**: `Produto.estoque` (-1 ilimitado), `Comanda.saldoCredito`, `Comanda.qrPayloadMac`, `Pagamento.intencao` (`FECHAR_COMANDA` \| `RECARGA_CARTEIRA`), modelo `MovimentoCarteira`.
2. **Comandas**: ao criar, preenche `qrPayloadMac` = HMAC do par `comanda.id|qrCodeHash` para validação em operações privilegiadas.
3. **Webhooks PIX comanda/divisão**: retorno antecespado quando já processados (evita double credit / estado inconsistente).
4. **PIX recarga carteira**: `POST /pagamentos/recarga-carteira-pix` + tratamento em `processarWebhook` dentro de `$transaction`.
5. **Pedidos**: decremento atômico de estoque opcionalmente + débito de carteira com `formaPagamento: 'DEBITO_CARTEIRA'` no DTO.
6. **Recarga manual no caixa**: `POST /carteira/recarga-caixa` (JWT `ADMIN` ou `STAFF`), validação de `qrPayloadSig` quando a comanda tiver MAC.
7. **`GET /carteira/movimentos/:comandaId`**: auditoria por comanda (staff).
8. **Rate limiting**: guard global `ThrottlerGuard`; `@SkipThrottle` nos webhooks; limites mais rígidos em `pagamentos` e `carteira`.

## PRs incrementais futuros sugeridos

- **PR2 — Frontend cliente**: ~~Exibir saldo + recarga PIX~~ (feito no painel cliente); falta propagar `sig` no app staff se necessário.
- **PR3 — Tenant flag**: Habilitar/desabilitar carteira e política default (DEBITO vs fechamento só no check-out).
- **PR4 — Testes**: e2e/emulados para webhook duplo e corrida estoque×carteira (`prisma`-transaction tests).
- **PR5 — Role CAIXA** + relatório consolidado de movimentações por tenant.

## API staff / PDV

- **Pedido com débito na carteira**: `POST /pedidos` com `"formaPagamento": "DEBITO_CARTEIRA"` (exige saldo ≥ total; estoque e saldo na mesma transação Prisma). Omitir o campo mantém fluxo clássico (só atualiza estoque).
- **Cancelar pedido**: `DELETE /pedidos/:id` restaura estoque; se o pedido foi `DEBITO_CARTEIRA`, credita de volta o saldo e grava `ESTORNO_PEDIDO` no ledger.
- **Recarga manual no caixa**: `POST /carteira/recarga-caixa` — body `{ "qrHash", "valor", "qrPayloadSig?" }`. Comandas novas exigem `qrPayloadSig` igual ao `?sig=` do QR (MAC no banco).

## Variáveis de ambiente

Ver `backend/.env.example`: `RATE_LIMIT_TTL_MS`, `RATE_LIMIT_MAX`, `QR_SECRET` (obrigatório em produção para MAC do QR).

## Testes manuais rápidos

1. Sandbox MP: pagar PIX comanda até aprovado; disparar webhook duas vezes — comanda deve permanecer `PAGA` uma vez só; segunda resposta pode trazer `idempotent: true`.
2. Recarga carteira PIX (`POST /pagamentos/recarga-carteira-pix`): aprovar PIX, verificar `saldoCredito` e linha `RECARGA_PIX` em `MovimentoCarteira`.
3. Pedido `formaPagamento: "DEBITO_CARTEIRA"` com saldo insuficiente — deve falhar sem alterar estoque.
4. Produto `estoque` 1, pedido 2 unidades — `BadRequest`.
5. Caixa: `POST /carteira/recarga-caixa` com JWT staff e `qrPayloadSig` quando a comanda tiver `qrPayloadMac`.
