-- CreateTable
CREATE TABLE "delivery_cost_allocations" (
    "id" TEXT NOT NULL,
    "accounts_payable_id" TEXT NOT NULL,
    "sales_order_id" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "delivery_cost_allocations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "delivery_cost_allocations_accounts_payable_id_sales_order_id_key" ON "delivery_cost_allocations"("accounts_payable_id", "sales_order_id");

-- CreateIndex
CREATE INDEX "delivery_cost_allocations_sales_order_id_idx" ON "delivery_cost_allocations"("sales_order_id");

-- AddForeignKey
ALTER TABLE "delivery_cost_allocations" ADD CONSTRAINT "delivery_cost_allocations_accounts_payable_id_fkey" FOREIGN KEY ("accounts_payable_id") REFERENCES "accounts_payable"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "delivery_cost_allocations" ADD CONSTRAINT "delivery_cost_allocations_sales_order_id_fkey" FOREIGN KEY ("sales_order_id") REFERENCES "sales_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;
