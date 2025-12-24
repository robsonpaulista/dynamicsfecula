/**
 * Script para gerar ícones do PWA
 * 
 * Para usar este script, você precisa ter uma imagem base (icon.png) de 512x512 pixels
 * na pasta public/icons/
 * 
 * Instale as dependências necessárias:
 * npm install --save-dev sharp
 * 
 * Execute: node scripts/generate-icons.js
 */

const sharp = require('sharp')
const fs = require('fs')
const path = require('path')

const sizes = [72, 96, 128, 144, 152, 192, 384, 512]
const inputPath = path.join(__dirname, '../public/icons/icon-base.png')
const outputDir = path.join(__dirname, '../public/icons')

async function generateIcons() {
  // Verificar se a imagem base existe
  if (!fs.existsSync(inputPath)) {
    console.log('⚠️  Imagem base não encontrada em:', inputPath)
    console.log('📝 Criando ícone placeholder...')
    
    // Criar um ícone placeholder simples usando SVG
    const placeholderSvg = `
      <svg width="512" height="512" xmlns="http://www.w3.org/2000/svg">
        <rect width="512" height="512" fill="#00B299"/>
        <text x="256" y="280" font-family="Arial, sans-serif" font-size="200" font-weight="bold" fill="white" text-anchor="middle">DA</text>
      </svg>
    `
    
    // Salvar SVG temporário
    const tempSvgPath = path.join(outputDir, 'temp-icon.svg')
    fs.writeFileSync(tempSvgPath, placeholderSvg)
    
    // Converter SVG para PNG usando sharp
    for (const size of sizes) {
      await sharp(tempSvgPath)
        .resize(size, size)
        .png()
        .toFile(path.join(outputDir, `icon-${size}x${size}.png`))
      console.log(`✅ Gerado: icon-${size}x${size}.png`)
    }
    
    // Remover SVG temporário
    fs.unlinkSync(tempSvgPath)
    console.log('✅ Ícones placeholder criados com sucesso!')
    console.log('💡 Para usar seus próprios ícones, coloque uma imagem icon-base.png (512x512) em public/icons/ e execute este script novamente.')
    return
  }

  console.log('🎨 Gerando ícones a partir de:', inputPath)
  
  for (const size of sizes) {
    try {
      await sharp(inputPath)
        .resize(size, size, {
          fit: 'contain',
          background: { r: 0, g: 178, b: 153, alpha: 1 }
        })
        .png()
        .toFile(path.join(outputDir, `icon-${size}x${size}.png`))
      console.log(`✅ Gerado: icon-${size}x${size}.png`)
    } catch (error) {
      console.error(`❌ Erro ao gerar icon-${size}x${size}.png:`, error.message)
    }
  }
  
  console.log('✅ Todos os ícones foram gerados com sucesso!')
}

generateIcons().catch(console.error)
