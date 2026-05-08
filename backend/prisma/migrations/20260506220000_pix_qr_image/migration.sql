-- AlterTable: add QR code image (base64) to tenants
ALTER TABLE "tenants" ADD COLUMN "pixManualQrCodeImage" TEXT;
