-- AlterTable: add logo image (base64) to tenants
ALTER TABLE "tenants" ADD COLUMN "logoImage" TEXT;
