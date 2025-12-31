const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed do banco de dados...');

  // Criar usuário admin
  const adminPassword = await bcrypt.hash('senha123', 10);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      email: 'admin@example.com',
      name: 'Administrador',
      passwordHash: adminPassword,
      role: 'ADMIN',
      isActive: true,
    },
  });

  console.log('✅ Usuário admin criado:', admin.email);

  // Criar categorias
  const categories = await Promise.all([
    prisma.category.upsert({
      where: { id: 'cat-income-1' },
      update: {},
      create: {
        id: 'cat-income-1',
        name: 'Vendas',
        kind: 'INCOME',
      },
    }),
    prisma.category.upsert({
      where: { id: 'cat-expense-1' },
      update: {},
      create: {
        id: 'cat-expense-1',
        name: 'Compras',
        kind: 'EXPENSE',
      },
    }),
  ]);

  console.log('✅ Categorias criadas');

  // Criar formas de pagamento
  const paymentMethods = await Promise.all([
    prisma.paymentMethod.upsert({
      where: { id: 'pm-1' },
      update: {},
      create: {
        id: 'pm-1',
        name: 'PIX',
      },
    }),
    prisma.paymentMethod.upsert({
      where: { id: 'pm-2' },
      update: {},
      create: {
        id: 'pm-2',
        name: 'Dinheiro',
      },
    }),
    prisma.paymentMethod.upsert({
      where: { id: 'pm-3' },
      update: {},
      create: {
        id: 'pm-3',
        name: 'Cartão de Crédito',
      },
    }),
    prisma.paymentMethod.upsert({
      where: { id: 'pm-4' },
      update: {},
      create: {
        id: 'pm-4',
        name: 'Boleto',
      },
    }),
  ]);

  console.log('✅ Formas de pagamento criadas');

  // Criar fornecedor exemplo
  const supplier = await prisma.supplier.upsert({
    where: { id: 'supplier-1' },
    update: {},
    create: {
      id: 'supplier-1',
      name: 'Fornecedor Exemplo LTDA',
      document: '12.345.678/0001-90',
      phone: '(11) 99999-9999',
      email: 'contato@fornecedor.com',
      isActive: true,
    },
  });

  console.log('✅ Fornecedor exemplo criado');

  // Criar cliente exemplo
  const customer = await prisma.customer.upsert({
    where: { id: 'customer-1' },
    update: {},
    create: {
      id: 'customer-1',
      name: 'Cliente Exemplo',
      document: '123.456.789-00',
      phone: '(11) 88888-8888',
      email: 'cliente@example.com',
      isActive: true,
    },
  });

  console.log('✅ Cliente exemplo criado');

  // Criar produtos exemplo
  const products = await Promise.all([
    prisma.product.upsert({
      where: { sku: 'PROD-001' },
      update: {},
      create: {
        sku: 'PROD-001',
        name: 'Produto Exemplo 1',
        type: 'PA',
        unit: 'un',
        minStock: 10,
        costPrice: 15.50,
        salePrice: 25.00,
        isActive: true,
      },
    }),
    prisma.product.upsert({
      where: { sku: 'PROD-002' },
      update: {},
      create: {
        sku: 'PROD-002',
        name: 'Matéria-Prima Exemplo',
        type: 'MP',
        unit: 'kg',
        minStock: 50,
        costPrice: 8.00,
        isActive: true,
      },
    }),
  ]);

  // Criar saldos iniciais
  for (const product of products) {
    await prisma.stockBalance.upsert({
      where: { productId: product.id },
      update: {},
      create: {
        productId: product.id,
        quantity: 100,
      },
    });
  }

  console.log('✅ Produtos e estoques criados');

  console.log('🎉 Seed concluído com sucesso!');
}

main()
  .catch((e) => {
    console.error('❌ Erro no seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });












