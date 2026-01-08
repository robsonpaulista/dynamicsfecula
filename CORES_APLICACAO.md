# Paleta de Cores da Aplicação

Este documento detalha todas as cores utilizadas na aplicação, incluindo onde e como são usadas.

## Cores Principais

### 🟢 Verde Principal (#00B299)
**HSL:** `172 100% 35.5%` (Teal/Cyan)  
**Uso:** Cor primária da aplicação, representando ações positivas, elementos principais e a identidade visual.

#### Onde é usado:
- **Sidebar/Navegação:**
  - Título da sidebar (`app/dashboard/layout.jsx`)
  - Ícones do menu lateral
  - Bordas da sidebar (`border-[#00B299]/20`)
  - Hover nos itens do menu (`hover:bg-[#00B299]/10`)
  - Botão de toggle da sidebar

- **Dashboard:**
  - Títulos principais (`text-[#00B299]`)
  - Card "Contas a Receber" (ícone e valores)
  - Card "Saldo de Caixa"
  - Card "Estoque dos Produtos"
  - Badge de contas abertas

- **Botões:**
  - Botões primários (`bg-[#00B299]`)
  - Botões de ação principal (hover: `hover:bg-[#00B299]/90`)
  - Botão de baixar contas a receber
  - Botão de instalação PWA

- **Cards e Componentes:**
  - Bordas de cards (`border-[#00B299]/20`)
  - Títulos de cards
  - Backgrounds sutis (`bg-[#00B299]/5`, `bg-[#00B299]/10`)
  - Estados de sucesso/completado

- **Produtos:**
  - Informações principais de produtos
  - Valores de estoque
  - Títulos e labels importantes

- **Financeiro:**
  - Valores de contas a receber
  - Status de contas recebidas (`bg-[#00B299]/10 text-[#00B299]`)
  - Headers e títulos da página financeira

- **Loaders e Spinners:**
  - Animação de carregamento (`border-[#00B299]`)

- **Shadows (Sombras):**
  - `shadow-glow`: Sombra com brilho verde (rgba(0, 178, 153, 0.15))
  - `shadow-glow-lg`: Sombra grande com brilho verde (rgba(0, 178, 153, 0.25))

### 🟠 Laranja/Salmon (#FF8C00)
**HSL:** `30 100% 50%` (Dark Orange)  
**Uso:** Cor secundária, usada para alertas, valores negativos, contas a pagar e ações de atenção.

#### Onde é usado:
- **Financeiro:**
  - Card "Contas a Pagar" (ícone e valores)
  - Valores de despesas
  - Headers e títulos de contas a pagar
  - Botões de ação para contas a pagar

- **Produtos:**
  - Botão "Ajustar Estoque"
  - Título do modal de ajuste de estoque
  - Alertas de estoque baixo

- **Status e Badges:**
  - Indicadores de estoque baixo
  - Badge de contas a pagar abertas

### ⚪ Cinza Claro (#F5F5F5)
**HSL:** `0 0% 96.1%`  
**Uso:** Background principal da aplicação, cards e espaços neutros.

#### Onde é usado:
- **Background Global:**
  - Cor de fundo do body (`bg-[#F5F5F5]`)
  - Background de páginas
  - Loading screens

- **Cards:**
  - Gradiente de cards (`gradient-card`: `from-white to-[#F5F5F5]`)
  - Backgrounds secundários
  - Sidebar inferior (gradiente)

- **Espaçamentos:**
  - Dividers sutis
  - Áreas de separação visual

## Cores Semânticas (Tailwind)

### Verde (green-*)
**Uso:** Ações de sucesso, valores positivos, confirmações.

- `bg-green-500`: Ícone de "Receitas Recebidas"
- `bg-green-50`, `bg-green-100`: Backgrounds de cards de receitas
- `text-green-600`, `text-green-700`: Valores de receitas
- `border-green-100/50`: Bordas de cards de receitas

**Onde:**
- Dashboard: Card "Receitas Recebidas"
- Financeiro: Indicadores de valores recebidos
- Status: Contas a receber recebidas

### Vermelho (red-*)
**Uso:** Ações destrutivas, alertas críticos, despesas.

- `bg-red-500`: Ícone de "Despesas Pagas"
- `bg-red-50`, `bg-red-100`: Backgrounds de cards de despesas
- `text-red-600`, `text-red-700`: Valores de despesas
- `border-red-100/50`: Bordas de cards de despesas
- `bg-red-600`, `hover:bg-red-700`: Botões destrutivos

**Onde:**
- Dashboard: Card "Despesas Pagas"
- Financeiro: Indicadores de despesas
- Botões de exclusão
- Alertas críticos

### Amarelo (yellow-*)
**Uso:** Avisos, pendências, estados intermediários.

- `bg-yellow-100`, `text-yellow-800`: Status "Aberta" (contas)
- `bg-yellow-500`: Alertas visuais

**Onde:**
- Financeiro: Badge de status "Aberta" em contas
- Dashboard: Indicadores de pendências
- Alertas de aviso

### Laranja (orange-*)
**Uso:** Alertas de atenção, estoque baixo.

- `bg-orange-500`: Badge de estoque baixo
- `text-orange-500`, `text-orange-600`: Textos de alerta de estoque
- `from-orange-50 to-red-50`: Gradiente para produtos com estoque baixo
- `border-orange-200/50`: Bordas de alerta

**Onde:**
- Produtos: Indicadores de estoque baixo
- Dashboard: Card de "Estoque Baixo"
- Cards de produtos com estoque crítico

### Azul (blue-*)
**Uso:** Informações, links, elementos secundários.

- `bg-blue-50`, `bg-blue-100`: Backgrounds informativos
- `text-blue-800`, `text-blue-600`: Textos informativos
- `bg-blue-100 text-blue-800`: Badge de venda relacionada (AP)

**Onde:**
- Modais: Backgrounds de informações
- Badges: Tags de relacionamento (ex: "Venda: #...")
- Links e elementos interativos secundários

### Cinza (gray-*)
**Uso:** Textos secundários, bordas, backgrounds neutros.

- `text-gray-600`, `text-gray-700`: Textos secundários
- `text-gray-500`, `text-gray-400`: Textos terciários/muted
- `bg-gray-50`: Backgrounds neutros
- `border-gray-200`, `border-gray-300`: Bordas neutras

**Onde:**
- Todo o sistema: Textos descritivos
- Cards: Backgrounds neutros
- Inputs: Bordas e placeholders
- Dividers e separadores

### Preto/Branco
**Uso:** Textos principais e backgrounds.

- `text-gray-900`: Texto principal/negrito
- `text-white`: Texto sobre fundos coloridos
- `bg-white`: Background de cards e modais
- `bg-black/50`: Overlay de modais

## Classes Utilitárias Customizadas

Definidas em `app/globals.css`:

### Classes de Cores
```css
.bg-teal        → bg-[#00B299]
.text-teal      → text-[#00B299]
.border-teal    → border-[#00B299]
.bg-orange      → bg-[#FF8C00]
.text-orange    → text-[#FF8C00]
.border-orange  → border-[#FF8C00]
.bg-light       → bg-[#F5F5F5]
```

### Classes de Efeitos
```css
.gradient-primary  → bg-[#00B299]
.gradient-card     → bg-gradient-to-br from-white to-[#F5F5F5]
.shadow-glow       → box-shadow: 0 0 20px rgba(0, 178, 153, 0.15)
.shadow-glow-lg    → box-shadow: 0 0 30px rgba(0, 178, 153, 0.25)
.glass-effect      → bg-white/80 backdrop-blur-md border border-white/20
```

## Variáveis CSS (HSL)

Definidas em `app/globals.css` no `:root`:

| Variável | HSL | Cor | Uso |
|----------|-----|-----|-----|
| `--primary` | `172 100% 35.5%` | #00B299 | Cor primária |
| `--primary-foreground` | `0 0% 100%` | Branco | Texto sobre primária |
| `--accent` | `30 100% 50%` | #FF8C00 | Cor de destaque |
| `--accent-foreground` | `0 0% 100%` | Branco | Texto sobre accent |
| `--background` | `0 0% 96.1%` | #F5F5F5 | Background principal |
| `--foreground` | `0 0% 20%` | Cinza escuro | Texto principal |
| `--destructive` | `0 84.2% 60.2%` | Vermelho | Ações destrutivas |
| `--muted` | `0 0% 95.7%` | Cinza muito claro | Backgrounds muted |
| `--muted-foreground` | `0 0% 45%` | Cinza médio | Textos muted |

## Padrões de Uso

### Hierarquia Visual
1. **Primária (#00B299)**: Elementos principais, ações primárias, títulos importantes
2. **Secundária (#FF8C00)**: Alertas, valores negativos, ações secundárias
3. **Semânticas (green/red/yellow)**: Estados e feedbacks
4. **Neutras (gray)**: Textos, backgrounds, elementos de apoio

### Estados de Interação
- **Hover**: Usa `/90` ou `/10` de opacidade (ex: `hover:bg-[#00B299]/90`)
- **Active**: Usa `active:scale-95` para feedback tátil
- **Disabled**: Usa `disabled:opacity-50` ou `disabled:cursor-not-allowed`

### Transparências Comuns
- `/10`: Backgrounds sutis em hover (ex: `hover:bg-[#00B299]/10`)
- `/20`: Bordas sutis (ex: `border-[#00B299]/20`)
- `/50`: Overlays de modais (ex: `bg-black/50`)
- `/90`: Hover em botões coloridos (ex: `hover:bg-[#00B299]/90`)

## Exemplos por Contexto

### Dashboard
- Títulos: `text-[#00B299]`
- Cards: `gradient-card border-[#00B299]/20`
- Valores positivos: `text-[#00B299]`
- Valores negativos: `text-[#FF8C00]`
- Background: `bg-[#F5F5F5]`

### Financeiro
- Contas a Receber: `bg-[#00B299]`, `text-[#00B299]`
- Contas a Pagar: `bg-[#FF8C00]`, `text-[#FF8C00]`
- Status Aberta: `bg-yellow-100 text-yellow-800`
- Status Recebida/Paga: `bg-[#00B299]/10 text-[#00B299]`

### Produtos
- Informações principais: `text-[#00B299]`
- Botão ajustar estoque: `bg-[#FF8C00]`
- Estoque baixo: `bg-orange-500`, `from-orange-50 to-red-50`
- Cards: `border-[#00B299]/20`

### Sidebar
- Background: `from-white via-white to-[#F5F5F5]`
- Título: `text-[#00B299]`
- Ícones: `text-[#00B299]`
- Hover: `hover:bg-[#00B299]/10`
- Bordas: `border-[#00B299]/20`

## Notas Importantes

1. **Consistência**: Sempre use as classes utilitárias ou valores hexadecimais definidos acima
2. **Acessibilidade**: Garanta contraste suficiente entre texto e background
3. **Dark Mode**: As variáveis CSS suportam dark mode, mas ainda não está totalmente implementado
4. **Responsividade**: As cores se adaptam bem a diferentes tamanhos de tela
5. **Manutenção**: Para alterar cores globalmente, edite as variáveis CSS em `app/globals.css`
