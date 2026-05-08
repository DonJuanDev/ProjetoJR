-- AlterTable: Pix Manual config on tenants
ALTER TABLE "tenants" ADD COLUMN "pixManualAtivo" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "tenants" ADD COLUMN "pixManualChave" TEXT;
ALTER TABLE "tenants" ADD COLUMN "pixManualDescricao" TEXT;
