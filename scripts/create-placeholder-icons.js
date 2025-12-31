/**
 * Script simples para criar ícones placeholder do PWA
 * Cria SVGs que podem ser usados temporariamente até que ícones reais sejam criados
 */

const fs = require('fs')
const path = require('path')

const sizes = [72, 96, 128, 144, 152, 192, 384, 512]
const outputDir = path.join(__dirname, '../public/icons')

// Criar diretório se não existir
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true })
}

// Função para criar SVG placeholder
function createPlaceholderSVG(size) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${size}" height="${size}" fill="#00B299" rx="${size * 0.1}"/>
  <text x="50%" y="50%" font-family="Arial, sans-serif" font-size="${size * 0.35}" font-weight="bold" fill="white" text-anchor="middle" dominant-baseline="central">DA</text>
</svg>`
}

console.log('🎨 Criando ícones placeholder do PWA...\n')

sizes.forEach(size => {
  const svgContent = createPlaceholderSVG(size)
  const filePath = path.join(outputDir, `icon-${size}x${size}.svg`)
  
  // Criar SVG
  fs.writeFileSync(filePath, svgContent)
  console.log(`✅ Criado: icon-${size}x${size}.svg`)
  
  // Nota: Para produção, você deve converter esses SVGs para PNG
  // Use uma ferramenta online como https://cloudconvert.com/svg-to-png
  // ou instale sharp: npm install --save-dev sharp
})

console.log('\n✅ Ícones placeholder criados!')
console.log('📝 Nota: Para produção, converta os SVGs para PNG.')
console.log('💡 Você pode usar: https://realfavicongenerator.net/ ou https://www.pwabuilder.com/imageGenerator')



