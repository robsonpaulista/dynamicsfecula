'use client'

import { useEffect, useState } from 'react'
import api from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatCurrency, formatDate } from '@/lib/utils'
import { DollarSign, TrendingUp, TrendingDown } from 'lucide-react'

export default function FinancePage() {
  const [accountsPayable, setAccountsPayable] = useState([])
  const [accountsReceivable, setAccountsReceivable] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadFinance()
  }, [])

  const loadFinance = async () => {
    try {
      const [apResponse, arResponse] = await Promise.all([
        api.get('/finance/ap'),
        api.get('/finance/ar'),
      ])
      setAccountsPayable(apResponse.data.data)
      setAccountsReceivable(arResponse.data.data)
    } catch (error) {
      console.error('Erro ao carregar financeiro:', error)
    } finally {
      setLoading(false)
    }
  }

  const totalAP = accountsPayable
    .filter((ap) => ap.status === 'OPEN')
    .reduce((sum, ap) => sum + ap.amount.toNumber(), 0)

  const totalAR = accountsReceivable
    .filter((ar) => ar.status === 'OPEN')
    .reduce((sum, ar) => sum + ar.amount.toNumber(), 0)

  return (
    <div className="p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Financeiro</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingDown className="h-5 w-5 text-red-600" />
                Contas a Pagar
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-red-600">
                {formatCurrency(totalAP)}
              </p>
              <p className="text-sm text-gray-600 mt-2">
                {accountsPayable.filter((ap) => ap.status === 'OPEN').length} contas abertas
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-green-600" />
                Contas a Receber
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-green-600">
                {formatCurrency(totalAR)}
              </p>
              <p className="text-sm text-gray-600 mt-2">
                {accountsReceivable.filter((ar) => ar.status === 'OPEN').length} contas abertas
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Contas a Pagar</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {accountsPayable.slice(0, 10).map((ap) => (
                  <div
                    key={ap.id}
                    className="flex justify-between items-center p-3 bg-gray-50 rounded"
                  >
                    <div>
                      <p className="font-medium">{ap.description}</p>
                      <p className="text-sm text-gray-600">
                        {formatDate(ap.dueDate)} • {ap.supplier?.name || '-'}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">{formatCurrency(ap.amount.toNumber())}</p>
                      <span className={`text-xs px-2 py-1 rounded ${
                        ap.status === 'OPEN' ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'
                      }`}>
                        {ap.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Contas a Receber</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {accountsReceivable.slice(0, 10).map((ar) => (
                  <div
                    key={ar.id}
                    className="flex justify-between items-center p-3 bg-gray-50 rounded"
                  >
                    <div>
                      <p className="font-medium">{ar.description}</p>
                      <p className="text-sm text-gray-600">
                        {formatDate(ar.dueDate)} • {ar.customer?.name || '-'}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">{formatCurrency(ar.amount.toNumber())}</p>
                      <span className={`text-xs px-2 py-1 rounded ${
                        ar.status === 'OPEN' ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'
                      }`}>
                        {ar.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}







