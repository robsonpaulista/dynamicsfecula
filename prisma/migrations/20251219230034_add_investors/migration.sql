/*
  Warnings:

  - You are about to drop the column `name` on the `payment_sources` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "payment_sources" DROP COLUMN "name",
ADD COLUMN     "investor_id" TEXT;

-- CreateTable
CREATE TABLE "investors" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "document" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "investors_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "payment_sources_investor_id_idx" ON "payment_sources"("investor_id");

-- AddForeignKey
ALTER TABLE "payment_sources" ADD CONSTRAINT "payment_sources_investor_id_fkey" FOREIGN KEY ("investor_id") REFERENCES "investors"("id") ON DELETE SET NULL ON UPDATE CASCADE;
