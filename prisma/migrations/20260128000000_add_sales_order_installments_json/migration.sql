-- AlterTable
ALTER TABLE "sales_orders" ADD COLUMN IF NOT EXISTS "installments_json" JSONB;
