-- CreateTable
CREATE TABLE "movimentos_carteira" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    "comandaId" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "valor" REAL NOT NULL,
    "saldoAntes" REAL NOT NULL,
    "saldoDepois" REAL NOT NULL,
    "usuarioOperadorId" TEXT,
    "pagamentoId" TEXT,
    "observacao" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "movimentos_carteira_comandaId_fkey" FOREIGN KEY ("comandaId") REFERENCES "comandas" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "movimentos_carteira_usuarioOperadorId_fkey" FOREIGN KEY ("usuarioOperadorId") REFERENCES "usuarios" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "movimentos_carteira_pagamentoId_fkey" FOREIGN KEY ("pagamentoId") REFERENCES "pagamentos" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_comandas" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    "eventoId" TEXT,
    "codigo" TEXT NOT NULL,
    "qrCodeHash" TEXT NOT NULL,
    "qrCodeUrl" TEXT,
    "clienteNome" TEXT,
    "clienteTelefone" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ABERTA',
    "total" REAL NOT NULL DEFAULT 0,
    "saldoCredito" REAL NOT NULL DEFAULT 0,
    "qrPayloadMac" TEXT,
    "usadaEm" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "paidAt" DATETIME,
    CONSTRAINT "comandas_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "comandas_eventoId_fkey" FOREIGN KEY ("eventoId") REFERENCES "eventos" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_comandas" ("clienteNome", "clienteTelefone", "codigo", "createdAt", "eventoId", "id", "paidAt", "qrCodeHash", "qrCodeUrl", "status", "tenantId", "total", "updatedAt", "usadaEm") SELECT "clienteNome", "clienteTelefone", "codigo", "createdAt", "eventoId", "id", "paidAt", "qrCodeHash", "qrCodeUrl", "status", "tenantId", "total", "updatedAt", "usadaEm" FROM "comandas";
DROP TABLE "comandas";
ALTER TABLE "new_comandas" RENAME TO "comandas";
CREATE UNIQUE INDEX "comandas_codigo_key" ON "comandas"("codigo");
CREATE UNIQUE INDEX "comandas_qrCodeHash_key" ON "comandas"("qrCodeHash");
CREATE TABLE "new_divisoes_conta" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "comandaId" TEXT NOT NULL,
    "nome" TEXT NOT NULL DEFAULT 'Pessoa',
    "valor" REAL NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDENTE',
    "pixQrCode" TEXT,
    "pixQrCodeBase64" TEXT,
    "pixExpiracao" DATETIME,
    "mpPaymentId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "divisoes_conta_comandaId_fkey" FOREIGN KEY ("comandaId") REFERENCES "comandas" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_divisoes_conta" ("comandaId", "createdAt", "id", "mpPaymentId", "nome", "pixExpiracao", "pixQrCode", "pixQrCodeBase64", "status", "updatedAt", "valor") SELECT "comandaId", "createdAt", "id", "mpPaymentId", "nome", "pixExpiracao", "pixQrCode", "pixQrCodeBase64", "status", "updatedAt", "valor" FROM "divisoes_conta";
DROP TABLE "divisoes_conta";
ALTER TABLE "new_divisoes_conta" RENAME TO "divisoes_conta";
CREATE UNIQUE INDEX "divisoes_conta_mpPaymentId_key" ON "divisoes_conta"("mpPaymentId");
CREATE TABLE "new_pagamentos" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "comandaId" TEXT NOT NULL,
    "mpPaymentId" TEXT,
    "mpPreferenceId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDENTE',
    "metodo" TEXT,
    "valor" REAL NOT NULL,
    "intencao" TEXT NOT NULL DEFAULT 'FECHAR_COMANDA',
    "pixQrCode" TEXT,
    "pixQrCodeBase64" TEXT,
    "pixExpiracao" DATETIME,
    "webhookData" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "paidAt" DATETIME,
    CONSTRAINT "pagamentos_comandaId_fkey" FOREIGN KEY ("comandaId") REFERENCES "comandas" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_pagamentos" ("comandaId", "createdAt", "id", "metodo", "mpPaymentId", "mpPreferenceId", "paidAt", "pixExpiracao", "pixQrCode", "pixQrCodeBase64", "status", "updatedAt", "valor", "webhookData") SELECT "comandaId", "createdAt", "id", "metodo", "mpPaymentId", "mpPreferenceId", "paidAt", "pixExpiracao", "pixQrCode", "pixQrCodeBase64", "status", "updatedAt", "valor", "webhookData" FROM "pagamentos";
DROP TABLE "pagamentos";
ALTER TABLE "new_pagamentos" RENAME TO "pagamentos";
CREATE UNIQUE INDEX "pagamentos_mpPaymentId_key" ON "pagamentos"("mpPaymentId");
CREATE TABLE "new_produtos" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "preco" REAL NOT NULL,
    "categoria" TEXT NOT NULL,
    "descricao" TEXT,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "estoque" INTEGER NOT NULL DEFAULT -1,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "produtos_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_produtos" ("ativo", "categoria", "createdAt", "descricao", "id", "nome", "preco", "tenantId", "updatedAt") SELECT "ativo", "categoria", "createdAt", "descricao", "id", "nome", "preco", "tenantId", "updatedAt" FROM "produtos";
DROP TABLE "produtos";
ALTER TABLE "new_produtos" RENAME TO "produtos";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "movimentos_carteira_pagamentoId_key" ON "movimentos_carteira"("pagamentoId");
