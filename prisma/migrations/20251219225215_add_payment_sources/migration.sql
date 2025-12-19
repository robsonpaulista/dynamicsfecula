-- CreateTable
CREATE TABLE "payment_sources" (
    "id" TEXT NOT NULL,
    "accounts_payable_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payment_sources_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "payment_sources_accounts_payable_id_idx" ON "payment_sources"("accounts_payable_id");

-- AddForeignKey
ALTER TABLE "payment_sources" ADD CONSTRAINT "payment_sources_accounts_payable_id_fkey" FOREIGN KEY ("accounts_payable_id") REFERENCES "accounts_payable"("id") ON DELETE CASCADE ON UPDATE CASCADE;
