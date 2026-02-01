'use client'

import { formatCurrency, formatDate } from '@/lib/utils'

/**
 * Layout profissional para exportação PDF - relatório executivo
 * Fonte compacta, tabelas limpas, alto padrão
 */
export default function ReportPDF({ data, periodLabel }) {
  const c = data?.compras ?? {}
  const p = data?.produtos ?? {}
  const v = data?.vendas ?? {}
  const f = data?.financeiro ?? {}

  const tableBase = { width: '100%', borderCollapse: 'collapse', fontSize: 7 }
  const thStyle = { padding: '3px 5px', textAlign: 'left', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', fontWeight: 600, color: '#334155', wordWrap: 'break-word' }
  const tdStyle = { padding: '2px 5px', borderBottom: '1px solid #f1f5f9', color: '#475569', wordWrap: 'break-word', lineHeight: 1.3 }
  const tdRight = { padding: '2px 5px', borderBottom: '1px solid #f1f5f9', textAlign: 'right', color: '#475569', whiteSpace: 'nowrap' }
  const sectionTitle = { fontSize: 11, fontWeight: 700, color: '#0f172a', margin: '14px 0 8px', paddingBottom: 6, marginBottom: 6, borderBottom: '1px solid #e2e8f0', pageBreakAfter: 'avoid', pageBreakInside: 'avoid' }
  const subsectionTitle = { fontSize: 9, fontWeight: 600, color: '#334155', margin: '12px 0 6px', paddingBottom: 3, pageBreakAfter: 'avoid' }
  const tableWrapper = { marginBottom: 16, pageBreakInside: 'avoid', breakInside: 'avoid' }
  const descriptionStyle = { ...tdStyle, wordWrap: 'break-word', lineHeight: 1.2, hyphens: 'auto' }

  return (
    <div
      id="report-pdf-content"
      style={{
        width: '210mm',
        minHeight: '297mm',
        padding: '12mm 12mm 16mm 12mm',
        backgroundColor: '#fff',
        fontFamily: "'Segoe UI', system-ui, sans-serif",
        fontSize: '9px',
        color: '#334155',
        boxSizing: 'border-box',
        overflow: 'visible',
      }}
    >
      {/* Cabeçalho */}
      <div style={{ marginBottom: 16, borderBottom: '2px solid #00B299', paddingBottom: 12 }}>
        <h1 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: '#00B299' }}>
          Relatório Executivo — Raio X da Operação
        </h1>
        <p style={{ margin: '4px 0 0', fontSize: 10, color: '#64748b' }}>
          Visão consolidada para CEOs e investidores
        </p>
        <p style={{ margin: '8px 0 0', fontSize: 9, color: '#94a3b8' }}>
          Período: {periodLabel} | Emitido em: {formatDate(new Date())}
        </p>
      </div>

      {/* COMPRAS */}
      <div style={sectionTitle}>Compras</div>
      <p style={{ margin: '0 0 8px', fontSize: 8, color: '#64748b', lineHeight: 1.5, wordWrap: 'break-word' }}>
        Pedidos recebidos ou aprovados no período — fornecedor, valor, fonte pagadora e status.
      </p>
      <div style={tableWrapper}>
      <table style={tableBase}>
        <thead>
          <tr>
            <th style={{ ...thStyle, width: '10%' }}>Pedido</th>
            <th style={{ ...thStyle, width: '25%' }}>Fornecedor</th>
            <th style={{ ...thStyle, width: '10%' }}>Data</th>
            <th style={{ ...thStyle, textAlign: 'right', width: '15%' }}>Total</th>
            <th style={{ ...thStyle, width: '25%' }}>Fonte</th>
            <th style={{ ...thStyle, width: '15%' }}>Status</th>
          </tr>
        </thead>
        <tbody>
          {(!c.pedidos || c.pedidos.length === 0) ? (
            <tr><td colSpan={6} style={{ ...tdStyle, textAlign: 'center', padding: 12 }}>Nenhum pedido</td></tr>
          ) : (
            c.pedidos.map((po) => (
              <tr key={po.id}>
                <td style={{ ...tdStyle, fontFamily: 'monospace', fontSize: 6 }}>#{po.id.slice(0, 8)}</td>
                <td style={tdStyle}>{po.fornecedor}</td>
                <td style={{ ...tdStyle, fontSize: 6 }}>{formatDate(po.data)}</td>
                <td style={tdRight}>{formatCurrency(po.total)}</td>
                <td style={{ ...tdStyle, fontSize: 6, lineHeight: 1.2 }}>{po.fontePagadora || '-'}</td>
                <td style={{ ...tdStyle, fontSize: 6 }}>{po.statusLabel || po.status}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
      </div>

      {/* PRODUTOS */}
      <div style={sectionTitle}>Produtos</div>
      <p style={{ margin: '0 0 6px', fontSize: 8, color: '#64748b', lineHeight: 1.4 }}>
        Resumo por produto: comprado, saídas (vendas/ajustes/bonificações) e saldo atual.
      </p>
      <div style={tableWrapper}>
      <table style={tableBase}>
        <thead>
          <tr>
            <th style={{ ...thStyle, width: '12%' }}>SKU</th>
            <th style={{ ...thStyle, width: '35%' }}>Nome</th>
            <th style={{ ...thStyle, textAlign: 'right', width: '13%' }}>Comprada</th>
            <th style={{ ...thStyle, textAlign: 'right', width: '13%' }}>Saídas</th>
            <th style={{ ...thStyle, textAlign: 'right', width: '13%' }}>Saldo</th>
            <th style={{ ...thStyle, width: '10%' }}>Un.</th>
          </tr>
        </thead>
        <tbody>
          {(!p.detalhes || p.detalhes.length === 0) ? (
            <tr><td colSpan={6} style={{ ...tdStyle, textAlign: 'center', padding: 12 }}>Nenhum produto com movimentação</td></tr>
          ) : (
            p.detalhes.map((prod) => (
              <tr key={prod.id}>
                <td style={{ ...tdStyle, fontFamily: 'monospace', fontSize: 6 }}>{prod.sku}</td>
                <td style={tdStyle}>{prod.name}</td>
                <td style={tdRight}>{prod.comprada}</td>
                <td style={tdRight}>{prod.saidas}</td>
                <td style={{ ...tdRight, fontWeight: 600, color: '#0f172a' }}>{prod.saldo}</td>
                <td style={tdStyle}>{prod.unit}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
      </div>

      {/* VENDAS */}
      <div style={sectionTitle}>Vendas</div>
      <div style={{ display: 'flex', gap: 24, marginBottom: 8, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 8 }}><strong>Pedidos:</strong> {v.qtdePedidos ?? 0}</span>
        <span style={{ fontSize: 8 }}><strong>Total vendido:</strong> {formatCurrency(v.totalVendido ?? 0)}</span>
        <span style={{ fontSize: 8 }}><strong>Custo:</strong> {formatCurrency(v.custo ?? 0)}</span>
        <span style={{ fontSize: 8, color: '#059669' }}><strong>Lucro:</strong> {formatCurrency(v.lucro ?? 0)}</span>
        <span style={{ fontSize: 8, color: '#059669' }}><strong>Margem:</strong> {(v.margemPercent ?? 0).toFixed(1)}%</span>
      </div>
      <div style={tableWrapper}>
      <table style={tableBase}>
        <colgroup>
          <col style={{ width: '9%' }} />
          <col style={{ width: '20%' }} />
          <col style={{ width: '8%' }} />
          <col style={{ width: '10%' }} />
          <col style={{ width: '13%' }} />
          <col style={{ width: '13%' }} />
          <col style={{ width: '13%' }} />
          <col style={{ width: '10%' }} />
        </colgroup>
        <thead>
          <tr>
            <th style={thStyle}>Pedido</th>
            <th style={thStyle}>Cliente</th>
            <th style={thStyle}>Data</th>
            <th style={thStyle}>Status</th>
            <th style={{ ...thStyle, textAlign: 'right' }}>Total</th>
            <th style={{ ...thStyle, textAlign: 'right' }}>Custo</th>
            <th style={{ ...thStyle, textAlign: 'right' }}>Lucro</th>
            <th style={{ ...thStyle, textAlign: 'right' }}>Margem</th>
          </tr>
        </thead>
        <tbody>
          {(!v.pedidos || v.pedidos.length === 0) ? (
            <tr><td colSpan={8} style={{ ...tdStyle, textAlign: 'center', padding: 12 }}>Nenhum pedido</td></tr>
          ) : (
            v.pedidos.map((pv) => (
              <tr key={pv.id}>
                <td style={tdStyle}>#{pv.id.slice(0, 8)}</td>
                <td style={tdStyle}>{pv.cliente}</td>
                <td style={tdStyle}>{formatDate(pv.data)}</td>
                <td style={tdStyle}>{pv.statusLabel || pv.status}</td>
                <td style={tdRight}>{formatCurrency(pv.total)}</td>
                <td style={tdRight}>{formatCurrency(pv.custo)}</td>
                <td style={{ ...tdRight, color: '#059669' }}>{formatCurrency(pv.lucro)}</td>
                <td style={{ ...tdRight, color: '#059669' }}>{(pv.margem ?? 0).toFixed(1)}%</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
      </div>

      {/* FINANCEIRO */}
      <div style={sectionTitle}>Financeiro</div>
      <div style={{ display: 'flex', gap: 24, marginBottom: 12, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 8 }}><strong>Contas pagas:</strong> {formatCurrency(f.contasPagas ?? 0)}</span>
        <span style={{ fontSize: 8 }}><strong>Contas recebidas:</strong> {formatCurrency(f.contasRecebidas ?? 0)}</span>
        <span style={{ fontSize: 8, color: (f.saldoCaixa ?? 0) >= 0 ? '#00B299' : '#dc2626' }}><strong>Saldo caixa:</strong> {formatCurrency(f.saldoCaixa ?? 0)}</span>
        <span style={{ fontSize: 8, color: '#ea580c' }}><strong>A pagar:</strong> {formatCurrency(f.contasAPagar ?? 0)}</span>
        <span style={{ fontSize: 8, color: '#00B299' }}><strong>A receber:</strong> {formatCurrency(f.contasAReceber ?? 0)}</span>
      </div>

      <div style={subsectionTitle}>Contas Pagas</div>
      <div style={tableWrapper}>
      <table style={tableBase}>
        <thead>
          <tr>
            <th style={{ ...thStyle, width: '38%' }}>Descrição</th>
            <th style={{ ...thStyle, width: '28%' }}>Fornecedor</th>
            <th style={{ ...thStyle, width: '16%' }}>Pagamento</th>
            <th style={{ ...thStyle, textAlign: 'right', width: '18%' }}>Valor</th>
          </tr>
        </thead>
        <tbody>
          {(!f.detalhesAPPagas || f.detalhesAPPagas.length === 0) ? (
            <tr><td colSpan={4} style={{ ...tdStyle, textAlign: 'center', padding: 8 }}>Nenhuma</td></tr>
          ) : (
            f.detalhesAPPagas.map((ap) => (
              <tr key={ap.id}>
                <td style={descriptionStyle}>{ap.descricao}</td>
                <td style={tdStyle}>{ap.fornecedor}</td>
                <td style={{ ...tdStyle, fontSize: 6 }}>{formatDate(ap.pagamento)}</td>
                <td style={tdRight}>{formatCurrency(ap.valor)}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
      </div>

      <div style={subsectionTitle}>Contas a Pagar (abertas)</div>
      <div style={tableWrapper}>
      <table style={tableBase}>
        <thead>
          <tr>
            <th style={{ ...thStyle, width: '38%' }}>Descrição</th>
            <th style={{ ...thStyle, width: '28%' }}>Fornecedor</th>
            <th style={{ ...thStyle, width: '18%' }}>Vencimento</th>
            <th style={{ ...thStyle, textAlign: 'right', width: '16%' }}>Valor</th>
          </tr>
        </thead>
        <tbody>
          {(!f.detalhesAP || f.detalhesAP.length === 0) ? (
            <tr><td colSpan={4} style={{ ...tdStyle, textAlign: 'center', padding: 8 }}>Nenhuma</td></tr>
          ) : (
            f.detalhesAP.map((ap) => (
              <tr key={ap.id}>
                <td style={descriptionStyle}>{ap.descricao}</td>
                <td style={tdStyle}>{ap.fornecedor}</td>
                <td style={{ ...tdStyle, fontSize: 6 }}>{formatDate(ap.vencimento)}</td>
                <td style={tdRight}>{formatCurrency(ap.valor)}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
      </div>

      <div style={subsectionTitle}>Contas Recebidas</div>
      <div style={tableWrapper}>
      <table style={tableBase}>
        <thead>
          <tr>
            <th style={{ ...thStyle, width: '38%' }}>Descrição</th>
            <th style={{ ...thStyle, width: '28%' }}>Cliente</th>
            <th style={{ ...thStyle, width: '16%' }}>Recebimento</th>
            <th style={{ ...thStyle, textAlign: 'right', width: '18%' }}>Valor</th>
          </tr>
        </thead>
        <tbody>
          {(!f.detalhesARRecebidas || f.detalhesARRecebidas.length === 0) ? (
            <tr><td colSpan={4} style={{ ...tdStyle, textAlign: 'center', padding: 8 }}>Nenhuma</td></tr>
          ) : (
            f.detalhesARRecebidas.map((ar) => (
              <tr key={ar.id}>
                <td style={descriptionStyle}>{ar.descricao}</td>
                <td style={tdStyle}>{ar.cliente}</td>
                <td style={{ ...tdStyle, fontSize: 6 }}>{formatDate(ar.recebimento)}</td>
                <td style={tdRight}>{formatCurrency(ar.valor)}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
      </div>

      <div style={subsectionTitle}>Contas a Receber (abertas)</div>
      <div style={tableWrapper}>
      <table style={tableBase}>
        <thead>
          <tr>
            <th style={{ ...thStyle, width: '38%' }}>Descrição</th>
            <th style={{ ...thStyle, width: '28%' }}>Cliente</th>
            <th style={{ ...thStyle, width: '18%' }}>Vencimento</th>
            <th style={{ ...thStyle, textAlign: 'right', width: '16%' }}>Valor</th>
          </tr>
        </thead>
        <tbody>
          {(!f.detalhesAR || f.detalhesAR.length === 0) ? (
            <tr><td colSpan={4} style={{ ...tdStyle, textAlign: 'center', padding: 8 }}>Nenhuma</td></tr>
          ) : (
            f.detalhesAR.map((ar) => (
              <tr key={ar.id}>
                <td style={descriptionStyle}>{ar.descricao}</td>
                <td style={tdStyle}>{ar.cliente}</td>
                <td style={{ ...tdStyle, fontSize: 6 }}>{formatDate(ar.vencimento)}</td>
                <td style={tdRight}>{formatCurrency(ar.valor)}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
      </div>

      <div style={{ marginTop: 16, paddingBottom: 16, fontSize: 7, color: '#94a3b8', textAlign: 'center' }}>
        Relatório gerado automaticamente — Sistema de Gestão Empresarial
      </div>
    </div>
  )
}
