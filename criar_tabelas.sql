-- Script SQL para criar todas as tabelas no Supabase
-- Execute este script no SQL Editor do Supabase

-- Criar Enums
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'FINANCEIRO', 'COMPRAS', 'VENDAS', 'ESTOQUE');
CREATE TYPE "ProductType" AS ENUM ('MP', 'PA', 'SERVICO');
CREATE TYPE "PurchaseOrderStatus" AS ENUM ('DRAFT', 'APPROVED', 'RECEIVED', 'CANCELED');
CREATE TYPE "SalesOrderStatus" AS ENUM ('DRAFT', 'CONFIRMED', 'DELIVERED', 'CANCELED');
CREATE TYPE "StockMovementType" AS ENUM ('IN', 'OUT', 'ADJUST');
CREATE TYPE "ReferenceType" AS ENUM ('PURCHASE', 'SALE', 'INVENTORY', 'MANUAL');
CREATE TYPE "AccountStatus" AS ENUM ('OPEN', 'PAID', 'RECEIVED', 'CANCELED');
CREATE TYPE "CashTransactionType" AS ENUM ('IN', 'OUT');
CREATE TYPE "CashTransactionOrigin" AS ENUM ('AR', 'AP', 'MANUAL');
CREATE TYPE "CategoryKind" AS ENUM ('INCOME', 'EXPENSE');
CREATE TYPE "AuditAction" AS ENUM ('CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT', 'APPROVE', 'CANCEL');

-- Tabela de Usuários
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'ESTOQUE',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- Tabela de Fornecedores
CREATE TABLE "suppliers" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "document" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "address_json" JSONB,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "suppliers_pkey" PRIMARY KEY ("id")
);

-- Tabela de Clientes
CREATE TABLE "customers" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "document" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "address_json" JSONB,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "customers_pkey" PRIMARY KEY ("id")
);

-- Tabela de Produtos
CREATE TABLE "products" (
    "id" TEXT NOT NULL,
    "sku" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "ProductType" NOT NULL DEFAULT 'MP',
    "unit" TEXT NOT NULL,
    "min_stock" DECIMAL(10,2),
    "cost_price" DECIMAL(10,2),
    "sale_price" DECIMAL(10,2),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "products_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "products_sku_key" ON "products"("sku");

-- Tabela de Saldo de Estoque
CREATE TABLE "stock_balances" (
    "id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "quantity" DECIMAL(10,2) NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "stock_balances_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "stock_balances_product_id_key" ON "stock_balances"("product_id");

-- Tabela de Movimentações de Estoque
CREATE TABLE "stock_movements" (
    "id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "type" "StockMovementType" NOT NULL,
    "quantity" DECIMAL(10,2) NOT NULL,
    "unit_cost" DECIMAL(10,2),
    "reference_type" "ReferenceType",
    "reference_id" TEXT,
    "note" TEXT,
    "created_by" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "stock_movements_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "stock_movements_product_id_idx" ON "stock_movements"("product_id");
CREATE INDEX "stock_movements_created_at_idx" ON "stock_movements"("created_at");

-- Tabela de Categorias
CREATE TABLE "categories" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "kind" "CategoryKind" NOT NULL,

    CONSTRAINT "categories_pkey" PRIMARY KEY ("id")
);

-- Tabela de Formas de Pagamento
CREATE TABLE "payment_methods" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "payment_methods_pkey" PRIMARY KEY ("id")
);

-- Tabela de Pedidos de Compra
CREATE TABLE "purchase_orders" (
    "id" TEXT NOT NULL,
    "supplier_id" TEXT NOT NULL,
    "status" "PurchaseOrderStatus" NOT NULL DEFAULT 'DRAFT',
    "issue_date" TIMESTAMP(3) NOT NULL,
    "total" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "notes" TEXT,
    "created_by" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "purchase_orders_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "purchase_orders_supplier_id_idx" ON "purchase_orders"("supplier_id");
CREATE INDEX "purchase_orders_status_idx" ON "purchase_orders"("status");

-- Tabela de Itens de Compra
CREATE TABLE "purchase_items" (
    "id" TEXT NOT NULL,
    "purchase_order_id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "quantity" DECIMAL(10,2) NOT NULL,
    "unit_price" DECIMAL(10,2) NOT NULL,
    "total" DECIMAL(10,2) NOT NULL DEFAULT 0,

    CONSTRAINT "purchase_items_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "purchase_items_purchase_order_id_idx" ON "purchase_items"("purchase_order_id");

-- Tabela de Recebimentos de Compra
CREATE TABLE "purchase_receipts" (
    "id" TEXT NOT NULL,
    "purchase_order_id" TEXT NOT NULL,
    "receipt_date" TIMESTAMP(3) NOT NULL,
    "invoice_number" TEXT,
    "total" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "created_by" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "purchase_receipts_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "purchase_receipts_purchase_order_id_idx" ON "purchase_receipts"("purchase_order_id");

-- Tabela de Pedidos de Venda
CREATE TABLE "sales_orders" (
    "id" TEXT NOT NULL,
    "customer_id" TEXT NOT NULL,
    "status" "SalesOrderStatus" NOT NULL DEFAULT 'DRAFT',
    "sale_date" TIMESTAMP(3) NOT NULL,
    "total" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "created_by" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sales_orders_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "sales_orders_customer_id_idx" ON "sales_orders"("customer_id");
CREATE INDEX "sales_orders_status_idx" ON "sales_orders"("status");

-- Tabela de Itens de Venda
CREATE TABLE "sales_items" (
    "id" TEXT NOT NULL,
    "sales_order_id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "quantity" DECIMAL(10,2) NOT NULL,
    "unit_price" DECIMAL(10,2) NOT NULL,
    "total" DECIMAL(10,2) NOT NULL DEFAULT 0,

    CONSTRAINT "sales_items_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "sales_items_sales_order_id_idx" ON "sales_items"("sales_order_id");

-- Tabela de Contas a Pagar
CREATE TABLE "accounts_payable" (
    "id" TEXT NOT NULL,
    "supplier_id" TEXT,
    "purchase_order_id" TEXT,
    "description" TEXT NOT NULL,
    "category_id" TEXT,
    "due_date" TIMESTAMP(3) NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "status" "AccountStatus" NOT NULL DEFAULT 'OPEN',
    "paid_at" TIMESTAMP(3),
    "payment_method_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "accounts_payable_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "accounts_payable_status_idx" ON "accounts_payable"("status");
CREATE INDEX "accounts_payable_due_date_idx" ON "accounts_payable"("due_date");

-- Tabela de Contas a Receber
CREATE TABLE "accounts_receivable" (
    "id" TEXT NOT NULL,
    "customer_id" TEXT,
    "sales_order_id" TEXT,
    "description" TEXT NOT NULL,
    "category_id" TEXT,
    "due_date" TIMESTAMP(3) NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "status" "AccountStatus" NOT NULL DEFAULT 'OPEN',
    "received_at" TIMESTAMP(3),
    "payment_method_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "accounts_receivable_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "accounts_receivable_status_idx" ON "accounts_receivable"("status");
CREATE INDEX "accounts_receivable_due_date_idx" ON "accounts_receivable"("due_date");

-- Tabela de Transações de Caixa
CREATE TABLE "cash_transactions" (
    "id" TEXT NOT NULL,
    "type" "CashTransactionType" NOT NULL,
    "origin" "CashTransactionOrigin" NOT NULL,
    "origin_id" TEXT,
    "date" TIMESTAMP(3) NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "description" TEXT NOT NULL,
    "category_id" TEXT,
    "created_by" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cash_transactions_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "cash_transactions_date_idx" ON "cash_transactions"("date");
CREATE INDEX "cash_transactions_type_idx" ON "cash_transactions"("type");

-- Tabela de Logs de Auditoria
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "action" "AuditAction" NOT NULL,
    "entity" TEXT NOT NULL,
    "entity_id" TEXT,
    "metadata_json" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "audit_logs_user_id_idx" ON "audit_logs"("user_id");
CREATE INDEX "audit_logs_entity_idx" ON "audit_logs"("entity");
CREATE INDEX "audit_logs_created_at_idx" ON "audit_logs"("created_at");

-- Adicionar Foreign Keys
ALTER TABLE "stock_balances" ADD CONSTRAINT "stock_balances_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "purchase_orders" ADD CONSTRAINT "purchase_orders_supplier_id_fkey" FOREIGN KEY ("supplier_id") REFERENCES "suppliers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "purchase_orders" ADD CONSTRAINT "purchase_orders_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "purchase_items" ADD CONSTRAINT "purchase_items_purchase_order_id_fkey" FOREIGN KEY ("purchase_order_id") REFERENCES "purchase_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "purchase_items" ADD CONSTRAINT "purchase_items_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "purchase_receipts" ADD CONSTRAINT "purchase_receipts_purchase_order_id_fkey" FOREIGN KEY ("purchase_order_id") REFERENCES "purchase_orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "purchase_receipts" ADD CONSTRAINT "purchase_receipts_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "sales_orders" ADD CONSTRAINT "sales_orders_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "sales_orders" ADD CONSTRAINT "sales_orders_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "sales_items" ADD CONSTRAINT "sales_items_sales_order_id_fkey" FOREIGN KEY ("sales_order_id") REFERENCES "sales_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "sales_items" ADD CONSTRAINT "sales_items_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "accounts_payable" ADD CONSTRAINT "accounts_payable_supplier_id_fkey" FOREIGN KEY ("supplier_id") REFERENCES "suppliers"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "accounts_payable" ADD CONSTRAINT "accounts_payable_purchase_order_id_fkey" FOREIGN KEY ("purchase_order_id") REFERENCES "purchase_orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "accounts_payable" ADD CONSTRAINT "accounts_payable_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "accounts_payable" ADD CONSTRAINT "accounts_payable_payment_method_id_fkey" FOREIGN KEY ("payment_method_id") REFERENCES "payment_methods"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "accounts_receivable" ADD CONSTRAINT "accounts_receivable_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "accounts_receivable" ADD CONSTRAINT "accounts_receivable_sales_order_id_fkey" FOREIGN KEY ("sales_order_id") REFERENCES "sales_orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "accounts_receivable" ADD CONSTRAINT "accounts_receivable_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "accounts_receivable" ADD CONSTRAINT "accounts_receivable_payment_method_id_fkey" FOREIGN KEY ("payment_method_id") REFERENCES "payment_methods"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "cash_transactions" ADD CONSTRAINT "cash_transactions_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "cash_transactions" ADD CONSTRAINT "cash_transactions_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;










