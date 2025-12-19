import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

/**
 * API Route para executar seed do banco de dados
 * 
 * SEGURANÇA: Esta rota só deve ser executada uma vez após o deploy.
 * Ela verifica se já existe um usuário admin antes de executar.
 * 
 * GET /api/seed - Retorna página HTML para executar seed
 * POST /api/seed - Executa o seed (requer header X-Seed-Token)
 */

// Método GET: Retorna página HTML simples
export async function GET() {
  const html = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>🌱 Executar Seed do Banco</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: #f3f4f6;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      padding: 20px;
    }
    .container {
      background: white;
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      padding: 32px;
      max-width: 500px;
      width: 100%;
    }
    h1 { font-size: 24px; margin-bottom: 8px; color: #111827; }
    .subtitle { color: #6b7280; font-size: 14px; margin-bottom: 24px; }
    .form-group { margin-bottom: 20px; }
    label {
      display: block;
      font-weight: 500;
      margin-bottom: 8px;
      color: #374151;
      font-size: 14px;
    }
    input {
      width: 100%;
      padding: 10px 12px;
      border: 1px solid #d1d5db;
      border-radius: 6px;
      font-size: 14px;
    }
    input:focus {
      outline: none;
      border-color: #3b82f6;
      box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
    }
    .hint {
      font-size: 12px;
      color: #6b7280;
      margin-top: 4px;
    }
    button {
      width: 100%;
      padding: 12px;
      background: #3b82f6;
      color: white;
      border: none;
      border-radius: 6px;
      font-size: 16px;
      font-weight: 500;
      cursor: pointer;
      transition: background 0.2s;
    }
    button:hover:not(:disabled) { background: #2563eb; }
    button:disabled {
      background: #9ca3af;
      cursor: not-allowed;
    }
    .result {
      margin-top: 20px;
      padding: 16px;
      border-radius: 6px;
      font-size: 14px;
    }
    .success {
      background: #d1fae5;
      border: 1px solid #10b981;
      color: #065f46;
    }
    .error {
      background: #fee2e2;
      border: 1px solid #ef4444;
      color: #991b1b;
    }
    .info {
      background: #dbeafe;
      border: 1px solid #3b82f6;
      color: #1e40af;
      margin-top: 16px;
    }
    pre {
      background: white;
      padding: 12px;
      border-radius: 4px;
      overflow-x: auto;
      font-size: 12px;
      margin-top: 8px;
    }
    .warning {
      margin-top: 24px;
      padding-top: 24px;
      border-top: 1px solid #e5e7eb;
      font-size: 12px;
      color: #6b7280;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>🌱 Executar Seed do Banco</h1>
    <p class="subtitle">Cria o usuário admin e dados iniciais do sistema</p>
    
    <div class="form-group">
      <label for="token">Token de Segurança (X-Seed-Token)</label>
      <input
        type="text"
        id="token"
        value="seed-initial-setup-2024"
        placeholder="seed-initial-setup-2024"
      />
      <p class="hint">Configure a variável SEED_TOKEN no Vercel com este valor</p>
    </div>
    
    <button id="executeBtn" onclick="executeSeed()">Executar Seed</button>
    
    <div id="result"></div>
    
    <div class="warning">
      <strong>⚠️ Aviso:</strong> Esta página só deve ser acessada após o deploy inicial.
      O seed não será executado novamente se já existir um usuário admin.
    </div>
  </div>
  
  <script>
    async function executeSeed() {
      const btn = document.getElementById('executeBtn');
      const resultDiv = document.getElementById('result');
      const token = document.getElementById('token').value;
      
      btn.disabled = true;
      btn.textContent = 'Executando...';
      resultDiv.innerHTML = '';
      
      try {
        const response = await fetch('/api/seed', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Seed-Token': token,
          },
        });
        
        const data = await response.json();
        
        if (response.ok) {
          resultDiv.innerHTML = \`
            <div class="result success">
              <strong>✅ Sucesso!</strong>
              <p>Status: \${response.status}</p>
              <pre>\${JSON.stringify(data, null, 2)}</pre>
            </div>
            <div class="result info">
              <strong>📋 Credenciais de Login:</strong>
              <p><strong>Email:</strong> admin@example.com<br>
              <strong>Senha:</strong> senha123</p>
              <p style="margin-top: 8px;"><strong>⚠️</strong> Altere a senha após o primeiro login!</p>
            </div>
          \`;
        } else {
          resultDiv.innerHTML = \`
            <div class="result error">
              <strong>❌ Erro</strong>
              <p>Status: \${response.status}</p>
              <pre>\${JSON.stringify(data, null, 2)}</pre>
            </div>
          \`;
        }
      } catch (error) {
        resultDiv.innerHTML = \`
          <div class="result error">
            <strong>❌ Erro de Rede</strong>
            <p>\${error.message}</p>
          </div>
        \`;
      } finally {
        btn.disabled = false;
        btn.textContent = 'Executar Seed';
      }
    }
  </script>
</body>
</html>
  `
  
  return new NextResponse(html, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
    },
  })
}

export async function POST(request) {
  try {
    // Verificar token de segurança (opcional, mas recomendado)
    const seedToken = request.headers.get('x-seed-token')
    const expectedToken = process.env.SEED_TOKEN || 'seed-initial-setup-2024'
    
    if (seedToken !== expectedToken) {
      return NextResponse.json(
        { 
          success: false, 
          error: { 
            message: 'Token inválido. Use o header X-Seed-Token com o valor correto.',
            code: 'UNAUTHORIZED' 
          } 
        },
        { status: 401 }
      )
    }

    // Verificar se já existe usuário admin
    const existingAdmin = await prisma.user.findFirst({
      where: { 
        email: 'admin@example.com',
        role: 'ADMIN'
      }
    })

    if (existingAdmin) {
      return NextResponse.json(
        { 
          success: false, 
          error: { 
            message: 'Seed já foi executado. Usuário admin já existe.',
            code: 'ALREADY_SEEDED' 
          } 
        },
        { status: 400 }
      )
    }

    console.log('🌱 Iniciando seed do banco de dados...')

    // Criar usuário admin
    const adminPassword = await bcrypt.hash('senha123', 10)
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
    })

    console.log('✅ Usuário admin criado:', admin.email)

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
    ])

    console.log('✅ Categorias criadas')

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
    ])

    console.log('✅ Formas de pagamento criadas')

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
    })

    console.log('✅ Fornecedor exemplo criado')

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
    })

    console.log('✅ Cliente exemplo criado')

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
    ])

    // Criar saldos iniciais
    for (const product of products) {
      await prisma.stockBalance.upsert({
        where: { productId: product.id },
        update: {},
        create: {
          productId: product.id,
          quantity: 100,
        },
      })
    }

    console.log('✅ Produtos e estoques criados')
    console.log('🎉 Seed concluído com sucesso!')

    return NextResponse.json(
      {
        success: true,
        message: 'Seed executado com sucesso!',
        data: {
          admin: {
            email: admin.email,
            name: admin.name,
          },
          categories: categories.length,
          paymentMethods: paymentMethods.length,
          products: products.length,
        },
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('❌ Erro no seed:', error)
    return NextResponse.json(
      {
        success: false,
        error: {
          message: error.message || 'Erro ao executar seed',
          code: 'SEED_ERROR',
        },
      },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}
