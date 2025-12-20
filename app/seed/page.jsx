'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

export default function SeedPage() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [token, setToken] = useState('seed-initial-setup-2024')

  const executeSeed = async () => {
    setLoading(true)
    setResult(null)

    try {
      const response = await fetch('/api/seed', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Seed-Token': token,
        },
      })

      const data = await response.json()
      setResult({
        success: response.ok,
        status: response.status,
        data,
      })
    } catch (error) {
      setResult({
        success: false,
        status: 500,
        data: {
          error: {
            message: error.message,
            code: 'NETWORK_ERROR',
          },
        },
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-md p-6">
        <h1 className="text-2xl font-bold mb-4">🌱 Executar Seed do Banco</h1>
        <p className="text-sm text-gray-600 mb-6">
          Esta página executa o seed inicial do banco de dados, criando o usuário admin e dados de exemplo.
        </p>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              Token de Segurança (X-Seed-Token)
            </label>
            <input
              type="text"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="seed-initial-setup-2024"
            />
            <p className="text-xs text-gray-500 mt-1">
              Configure a variável SEED_TOKEN no Vercel com este valor
            </p>
          </div>

          <Button
            onClick={executeSeed}
            disabled={loading}
            className="w-full"
          >
            {loading ? 'Executando...' : 'Executar Seed'}
          </Button>

          {result && (
            <div
              className={`p-4 rounded-md ${
                result.success
                  ? 'bg-green-50 border border-green-200'
                  : 'bg-red-50 border border-red-200'
              }`}
            >
              <h3 className="font-semibold mb-2">
                {result.success ? '✅ Sucesso' : '❌ Erro'}
              </h3>
              <p className="text-sm mb-2">
                Status: {result.status}
              </p>
              <pre className="text-xs overflow-auto bg-white p-2 rounded border">
                {JSON.stringify(result.data, null, 2)}
              </pre>
            </div>
          )}

          {result?.success && (
            <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-md">
              <h4 className="font-semibold mb-2">📋 Credenciais de Login:</h4>
              <p className="text-sm">
                <strong>Email:</strong> admin@example.com<br />
                <strong>Senha:</strong> senha123
              </p>
              <p className="text-xs text-gray-600 mt-2">
                ⚠️ Altere a senha após o primeiro login!
              </p>
            </div>
          )}
        </div>

        <div className="mt-6 pt-6 border-t border-gray-200">
          <p className="text-xs text-gray-500">
            <strong>⚠️ Aviso:</strong> Esta página só deve ser acessada após o deploy inicial.
            O seed não será executado novamente se já existir um usuário admin.
          </p>
        </div>
      </Card>
    </div>
  )
}

