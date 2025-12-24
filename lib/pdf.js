import jsPDF from 'jspdf'

/**
 * Gera um PDF do pedido de venda
 * @param {Object} salesOrder - Dados do pedido de venda
 */
export function generateSalesOrderPDF(salesOrder) {
  const doc = new jsPDF()
  
  // Configurações
  const pageWidth = doc.internal.pageSize.getWidth()
  const margin = 20
  const maxWidth = pageWidth - (margin * 2)
  let yPosition = margin

  // Função auxiliar para adicionar texto com quebra de linha
  const addText = (text, x, y, options = {}) => {
    const { fontSize = 10, fontStyle = 'normal', align = 'left', maxWidth: textMaxWidth = maxWidth } = options
    doc.setFontSize(fontSize)
    doc.setFont('helvetica', fontStyle)
    
    const lines = doc.splitTextToSize(text, textMaxWidth)
    doc.text(lines, x, y, { align })
    return y + (lines.length * (fontSize * 0.4))
  }

  // Cabeçalho
  doc.setFillColor(0, 178, 153) // #00B299
  doc.rect(margin, yPosition, maxWidth, 15, 'F')
  
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(18)
  doc.setFont('helvetica', 'bold')
  doc.text('PEDIDO DE VENDA', margin + 5, yPosition + 10)
  
  yPosition += 25

  // Informações do Pedido
  doc.setTextColor(0, 0, 0)
  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.text(`Pedido #${salesOrder.id.slice(0, 8)}`, margin, yPosition)
  yPosition += 8

  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  
  // Status
  const statusLabels = {
    DRAFT: 'Rascunho',
    CONFIRMED: 'Confirmado',
    DELIVERED: 'Entregue',
    CANCELED: 'Cancelado',
  }
  yPosition = addText(`Status: ${statusLabels[salesOrder.status] || salesOrder.status}`, margin, yPosition, { fontSize: 10 })
  yPosition += 5

  // Data da Venda
  const saleDate = salesOrder.saleDate ? new Date(salesOrder.saleDate).toLocaleDateString('pt-BR') : '-'
  yPosition = addText(`Data da Venda: ${saleDate}`, margin, yPosition, { fontSize: 10 })
  yPosition += 5

  // Criado em
  const createdAt = salesOrder.createdAt ? new Date(salesOrder.createdAt).toLocaleDateString('pt-BR') : '-'
  yPosition = addText(`Criado em: ${createdAt}`, margin, yPosition, { fontSize: 10 })
  yPosition += 10

  // Informações do Cliente
  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.text('DADOS DO CLIENTE', margin, yPosition)
  yPosition += 8

  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  
  if (salesOrder.customer) {
    yPosition = addText(`Nome: ${salesOrder.customer.name || '-'}`, margin, yPosition, { fontSize: 10 })
    yPosition += 5
    
    if (salesOrder.customer.document) {
      yPosition = addText(`Documento: ${salesOrder.customer.document}`, margin, yPosition, { fontSize: 10 })
      yPosition += 5
    }
    
    if (salesOrder.customer.email) {
      yPosition = addText(`Email: ${salesOrder.customer.email}`, margin, yPosition, { fontSize: 10 })
      yPosition += 5
    }
    
    if (salesOrder.customer.phone) {
      yPosition = addText(`Telefone: ${salesOrder.customer.phone}`, margin, yPosition, { fontSize: 10 })
      yPosition += 5
    }
  }
  
  yPosition += 5

  // Verificar se precisa de nova página
  if (yPosition > 250) {
    doc.addPage()
    yPosition = margin
  }

  // Itens do Pedido
  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.text('ITENS DO PEDIDO', margin, yPosition)
  yPosition += 8

  // Cabeçalho da tabela
  doc.setFontSize(9)
  doc.setFont('helvetica', 'bold')
  doc.text('Produto', margin, yPosition)
  doc.text('Qtd', margin + 80, yPosition)
  doc.text('Preço Unit.', margin + 110, yPosition)
  doc.text('Total', margin + 160, yPosition)
  yPosition += 5

  // Linha divisória
  doc.setLineWidth(0.5)
  doc.line(margin, yPosition, pageWidth - margin, yPosition)
  yPosition += 5

  // Itens
  doc.setFont('helvetica', 'normal')
  if (salesOrder.items && salesOrder.items.length > 0) {
    salesOrder.items.forEach((item, index) => {
      // Verificar se precisa de nova página
      if (yPosition > 250) {
        doc.addPage()
        yPosition = margin
      }

      const productName = item.product?.name || 'Produto não encontrado'
      const quantity = Number(item.quantity) || 0
      const unit = item.product?.unit || 'un'
      const unitPrice = Number(item.unitPrice) || 0
      const total = Number(item.total) || 0

      // Nome do produto (pode ser longo, então quebra linha)
      const productLines = doc.splitTextToSize(productName, 70)
      doc.setFontSize(9)
      doc.text(productLines, margin, yPosition)
      
      const productHeight = productLines.length * 4
      
      // Quantidade
      doc.text(`${quantity} ${unit}`, margin + 80, yPosition)
      
      // Preço unitário
      doc.text(new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(unitPrice), margin + 110, yPosition)
      
      // Total
      doc.text(new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(total), margin + 160, yPosition)
      
      yPosition += Math.max(productHeight, 6)
      
      // SKU se disponível
      if (item.product?.sku) {
        doc.setFontSize(8)
        doc.setTextColor(128, 128, 128)
        doc.text(`SKU: ${item.product.sku}`, margin + 5, yPosition)
        doc.setTextColor(0, 0, 0)
        yPosition += 4
      }
      
      yPosition += 2
    })
  } else {
    doc.setFontSize(9)
    doc.text('Nenhum item encontrado', margin, yPosition)
    yPosition += 6
  }

  yPosition += 5

  // Linha divisória antes do total
  doc.setLineWidth(0.5)
  doc.line(margin, yPosition, pageWidth - margin, yPosition)
  yPosition += 8

  // Total
  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  const total = Number(salesOrder.total) || 0
  doc.text('TOTAL:', margin, yPosition)
  doc.text(new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(total), margin + 160, yPosition)
  yPosition += 10

  // Contas a Receber (se houver)
  if (salesOrder.accountsReceivable && salesOrder.accountsReceivable.length > 0) {
    // Verificar se precisa de nova página
    if (yPosition > 220) {
      doc.addPage()
      yPosition = margin
    }

    doc.setFontSize(12)
    doc.setFont('helvetica', 'bold')
    doc.text('CONTAS A RECEBER', margin, yPosition)
    yPosition += 8

    doc.setFontSize(9)
    doc.setFont('helvetica', 'normal')
    
    salesOrder.accountsReceivable.forEach((ar) => {
      // Verificar se precisa de nova página
      if (yPosition > 250) {
        doc.addPage()
        yPosition = margin
      }

      const dueDate = ar.dueDate ? new Date(ar.dueDate).toLocaleDateString('pt-BR') : '-'
      const amount = Number(ar.amount) || 0
      const status = ar.status === 'OPEN' ? 'Aberto' : ar.status === 'PAID' ? 'Pago' : ar.status
      const paymentDays = ar.paymentDays ? `${ar.paymentDays} dias` : ''
      
      yPosition = addText(`${ar.description || 'Sem descrição'}`, margin, yPosition, { fontSize: 9 })
      yPosition += 4
      const paymentInfo = `Vencimento: ${dueDate}${paymentDays ? ` | Prazo: ${paymentDays}` : ''} | Status: ${status} | Valor: ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(amount)}`
      yPosition = addText(paymentInfo, margin + 5, yPosition, { fontSize: 8 })
      yPosition += 6
    })
  }

  yPosition += 10

  // Espaço para assinatura do cliente
  // Verificar se precisa de nova página
  if (yPosition > 200) {
    doc.addPage()
    yPosition = margin
  }

  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.setLineWidth(0.5)
  
  // Linha divisória antes da assinatura
  doc.line(margin, yPosition, pageWidth - margin, yPosition)
  yPosition += 15

  // Área de assinatura
  const signatureWidth = (pageWidth - (margin * 2)) / 2
  const signatureHeight = 40

  // Assinatura do Cliente (esquerda)
  doc.setFontSize(9)
  doc.setFont('helvetica', 'bold')
  doc.text('ASSINATURA DO CLIENTE', margin, yPosition)
  yPosition += 5
  
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  if (salesOrder.customer) {
    doc.text(salesOrder.customer.name || 'Cliente', margin, yPosition)
    yPosition += 4
    if (salesOrder.customer.document) {
      doc.text(`CPF/CNPJ: ${salesOrder.customer.document}`, margin, yPosition)
    }
  }
  
  // Linha para assinatura
  yPosition += 8
  doc.setLineWidth(0.3)
  doc.line(margin, yPosition, margin + signatureWidth - 10, yPosition)
  yPosition += 2
  doc.setFontSize(7)
  doc.setTextColor(128, 128, 128)
  doc.text('Nome e Assinatura', margin, yPosition)
  doc.setTextColor(0, 0, 0)

  // Assinatura da Empresa (direita)
  yPosition = yPosition - 20
  doc.setFontSize(9)
  doc.setFont('helvetica', 'bold')
  doc.text('ASSINATURA DA EMPRESA', margin + signatureWidth + 10, yPosition)
  yPosition += 5
  
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.text('Empresa', margin + signatureWidth + 10, yPosition)
  
  // Linha para assinatura
  yPosition += 8
  doc.setLineWidth(0.3)
  doc.line(margin + signatureWidth + 10, yPosition, pageWidth - margin - 10, yPosition)
  yPosition += 2
  doc.setFontSize(7)
  doc.setTextColor(128, 128, 128)
  doc.text('Nome e Assinatura', margin + signatureWidth + 10, yPosition)
  doc.setTextColor(0, 0, 0)

  // Rodapé
  const pageCount = doc.internal.getNumberOfPages()
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    doc.setFontSize(8)
    doc.setFont('helvetica', 'italic')
    doc.setTextColor(128, 128, 128)
    doc.text(
      `Página ${i} de ${pageCount}`,
      pageWidth - margin - 30,
      doc.internal.pageSize.getHeight() - 10,
      { align: 'right' }
    )
    doc.text(
      `Gerado em ${new Date().toLocaleString('pt-BR')}`,
      margin,
      doc.internal.pageSize.getHeight() - 10
    )
  }

  return doc
}

/**
 * Salva o PDF do pedido
 * @param {Object} salesOrder - Dados do pedido de venda
 * @param {string} filename - Nome do arquivo (opcional)
 */
export function saveSalesOrderPDF(salesOrder, filename = null) {
  const doc = generateSalesOrderPDF(salesOrder)
  const defaultFilename = `pedido-${salesOrder.id.slice(0, 8)}-${new Date().toISOString().split('T')[0]}.pdf`
  doc.save(filename || defaultFilename)
}

/**
 * Imprime o pedido de venda
 * @param {Object} salesOrder - Dados do pedido de venda
 */
export function printSalesOrder(salesOrder) {
  // Criar uma nova janela para impressão
  const printWindow = window.open('', '_blank')
  
  if (!printWindow) {
    alert('Por favor, permita pop-ups para esta funcionalidade funcionar.')
    return
  }

  const statusLabels = {
    DRAFT: 'Rascunho',
    CONFIRMED: 'Confirmado',
    DELIVERED: 'Entregue',
    CANCELED: 'Cancelado',
  }

  const saleDate = salesOrder.saleDate ? new Date(salesOrder.saleDate).toLocaleDateString('pt-BR') : '-'
  const createdAt = salesOrder.createdAt ? new Date(salesOrder.createdAt).toLocaleDateString('pt-BR') : '-'

  let html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Pedido de Venda #${salesOrder.id.slice(0, 8)}</title>
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        body {
          font-family: Arial, sans-serif;
          padding: 20px;
          color: #333;
        }
        .header {
          background-color: #00B299;
          color: white;
          padding: 20px;
          margin-bottom: 20px;
          border-radius: 5px;
        }
        .header h1 {
          font-size: 24px;
          margin-bottom: 10px;
        }
        .section {
          margin-bottom: 20px;
        }
        .section-title {
          font-size: 16px;
          font-weight: bold;
          margin-bottom: 10px;
          color: #00B299;
          border-bottom: 2px solid #00B299;
          padding-bottom: 5px;
        }
        .info-row {
          margin-bottom: 8px;
        }
        .info-label {
          font-weight: bold;
          display: inline-block;
          width: 150px;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 10px;
        }
        table th {
          background-color: #f0f0f0;
          padding: 10px;
          text-align: left;
          border: 1px solid #ddd;
        }
        table td {
          padding: 8px;
          border: 1px solid #ddd;
        }
        .total {
          text-align: right;
          font-size: 18px;
          font-weight: bold;
          margin-top: 10px;
          color: #00B299;
        }
        .accounts-receivable {
          margin-top: 20px;
        }
        .account-item {
          padding: 10px;
          margin-bottom: 10px;
          background-color: #f9f9f9;
          border-left: 4px solid #00B299;
        }
        .footer {
          margin-top: 30px;
          padding-top: 20px;
          border-top: 1px solid #ddd;
          font-size: 12px;
          color: #666;
          text-align: center;
        }
        @media print {
          body {
            padding: 0;
          }
          .no-print {
            display: none;
          }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>PEDIDO DE VENDA</h1>
        <p>Pedido #${salesOrder.id.slice(0, 8)}</p>
      </div>

      <div class="section">
        <div class="section-title">Informações do Pedido</div>
        <div class="info-row">
          <span class="info-label">Status:</span>
          <span>${statusLabels[salesOrder.status] || salesOrder.status}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Data da Venda:</span>
          <span>${saleDate}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Criado em:</span>
          <span>${createdAt}</span>
        </div>
      </div>

      <div class="section">
        <div class="section-title">Dados do Cliente</div>
  `

  if (salesOrder.customer) {
    html += `
        <div class="info-row">
          <span class="info-label">Nome:</span>
          <span>${salesOrder.customer.name || '-'}</span>
        </div>
    `
    if (salesOrder.customer.document) {
      html += `
        <div class="info-row">
          <span class="info-label">Documento:</span>
          <span>${salesOrder.customer.document}</span>
        </div>
      `
    }
    if (salesOrder.customer.email) {
      html += `
        <div class="info-row">
          <span class="info-label">Email:</span>
          <span>${salesOrder.customer.email}</span>
        </div>
      `
    }
    if (salesOrder.customer.phone) {
      html += `
        <div class="info-row">
          <span class="info-label">Telefone:</span>
          <span>${salesOrder.customer.phone}</span>
        </div>
      `
    }
  }

  html += `
      </div>

      <div class="section">
        <div class="section-title">Itens do Pedido</div>
        <table>
          <thead>
            <tr>
              <th>Produto</th>
              <th>Quantidade</th>
              <th>Preço Unitário</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
  `

  if (salesOrder.items && salesOrder.items.length > 0) {
    salesOrder.items.forEach((item) => {
      const productName = item.product?.name || 'Produto não encontrado'
      const quantity = Number(item.quantity) || 0
      const unit = item.product?.unit || 'un'
      const unitPrice = Number(item.unitPrice) || 0
      const total = Number(item.total) || 0
      const sku = item.product?.sku || ''

      html += `
            <tr>
              <td>
                ${productName}
                ${sku ? `<br><small style="color: #666;">SKU: ${sku}</small>` : ''}
              </td>
              <td>${quantity} ${unit}</td>
              <td>${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(unitPrice)}</td>
              <td>${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(total)}</td>
            </tr>
      `
    })
  } else {
    html += `
            <tr>
              <td colspan="4" style="text-align: center; padding: 20px;">Nenhum item encontrado</td>
            </tr>
    `
  }

  const total = Number(salesOrder.total) || 0
  html += `
          </tbody>
        </table>
        <div class="total">
          TOTAL: ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(total)}
        </div>
      </div>
  `

  // Contas a Receber
  if (salesOrder.accountsReceivable && salesOrder.accountsReceivable.length > 0) {
    html += `
      <div class="section accounts-receivable">
        <div class="section-title">Contas a Receber</div>
    `
    
    salesOrder.accountsReceivable.forEach((ar) => {
      const dueDate = ar.dueDate ? new Date(ar.dueDate).toLocaleDateString('pt-BR') : '-'
      const amount = Number(ar.amount) || 0
      const status = ar.status === 'OPEN' ? 'Aberto' : ar.status === 'PAID' ? 'Pago' : ar.status
      const paymentDays = ar.paymentDays ? ` | Prazo: ${ar.paymentDays} dias` : ''
      
      html += `
        <div class="account-item">
          <div><strong>${ar.description || 'Sem descrição'}</strong></div>
          <div style="margin-top: 5px; font-size: 14px;">
            Vencimento: ${dueDate}${paymentDays} | Status: ${status} | Valor: ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(amount)}
          </div>
        </div>
      `
    })
    
    html += `
      </div>
    `
  }

  // Espaço para assinaturas
  html += `
      <div class="section" style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #ddd;">
        <div style="display: flex; justify-content: space-between; gap: 40px;">
          <div style="flex: 1;">
            <div style="font-weight: bold; margin-bottom: 10px; font-size: 14px;">ASSINATURA DO CLIENTE</div>
            ${salesOrder.customer ? `
              <div style="margin-bottom: 5px;">${salesOrder.customer.name || 'Cliente'}</div>
              ${salesOrder.customer.document ? `<div style="font-size: 12px; color: #666;">CPF/CNPJ: ${salesOrder.customer.document}</div>` : ''}
            ` : ''}
            <div style="margin-top: 30px; border-top: 1px solid #333; padding-top: 5px; font-size: 11px; color: #666;">
              Nome e Assinatura
            </div>
          </div>
          <div style="flex: 1;">
            <div style="font-weight: bold; margin-bottom: 10px; font-size: 14px;">ASSINATURA DA EMPRESA</div>
            <div style="margin-bottom: 5px;">Empresa</div>
            <div style="margin-top: 30px; border-top: 1px solid #333; padding-top: 5px; font-size: 11px; color: #666;">
              Nome e Assinatura
            </div>
          </div>
        </div>
      </div>
  `

  html += `
      <div class="footer">
        <p>Gerado em ${new Date().toLocaleString('pt-BR')}</p>
      </div>
    </body>
    </html>
  `

  printWindow.document.write(html)
  printWindow.document.close()
  
  // Aguardar o conteúdo carregar antes de imprimir
  printWindow.onload = () => {
    setTimeout(() => {
      printWindow.print()
    }, 250)
  }
}
