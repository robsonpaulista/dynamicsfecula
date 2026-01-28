# Ícones do PWA

Esta pasta contém os ícones necessários para o Progressive Web App (PWA).

## Tamanhos necessários:
- 72x72.png
- 96x96.png
- 128x128.png
- 144x144.png
- 152x152.png
- 192x192.png
- 384x384.png
- 512x512.png

## Como gerar os ícones:

1. **Opção 1: Usar o script automático**
   - Coloque uma imagem base `icon-base.png` (512x512 pixels) nesta pasta
   - Execute: `node scripts/generate-icons.js`
   - Os ícones serão gerados automaticamente

2. **Opção 2: Gerar manualmente**
   - Use uma ferramenta online como https://realfavicongenerator.net/
   - Ou use o PWA Asset Generator: https://github.com/onderceylan/pwa-asset-generator

3. **Opção 3: Criar placeholders**
   - O script `generate-icons.js` criará placeholders automaticamente se não encontrar a imagem base

## Nota:
Os ícones devem ter fundo transparente ou usar a cor do tema (#00B299) como fundo.







