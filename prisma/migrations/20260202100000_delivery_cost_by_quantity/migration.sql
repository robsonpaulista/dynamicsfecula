-- Add is_delivery_cost to accounts_payable (despesas selecionadas para rateio por quantidade entregue)
ALTER TABLE "accounts_payable" ADD COLUMN IF NOT EXISTS "is_delivery_cost" BOOLEAN NOT NULL DEFAULT false;

-- Drop old allocation table (rateio agora é calculado: total despesas / qtd total entregue * qtd do pedido)
DROP TABLE IF EXISTS "delivery_cost_allocations";
