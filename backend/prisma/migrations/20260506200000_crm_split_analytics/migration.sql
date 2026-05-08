-- AlterTable: Add clienteTelefone to comandas
ALTER TABLE "comandas" ADD COLUMN "clienteTelefone" TEXT;

-- AlterTable: Add descricao to produtos
ALTER TABLE "produtos" ADD COLUMN "descricao" TEXT;

-- CreateTable: divisoes_conta (split bill)
CREATE TABLE "divisoes_conta" (
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
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "divisoes_conta_comandaId_fkey" FOREIGN KEY ("comandaId") REFERENCES "comandas" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "divisoes_conta_mpPaymentId_key" ON "divisoes_conta"("mpPaymentId");
