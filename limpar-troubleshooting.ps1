# Script PowerShell para limpar arquivos de troubleshooting

Write-Host "🧹 Limpando arquivos de troubleshooting..." -ForegroundColor Yellow

# Lista de arquivos a remover
$arquivosParaRemover = @(
    "COMANDOS_GIT_SEGUROS.md",
    "COMANDOS_VERCEL_CORRETOS.md",
    "CONFIGURAR_DASHBOARD_VERCEL.md",
    "CORRECAO_404_VERCEL_ATUALIZADA.md",
    "DIAGNOSTICO_404_DETALHADO.md",
    "FIX_404_VERCEL.md",
    "RESUMO_CORRECAO_404.md",
    "SOLUCAO_404_VERCEL.md",
    "SOLUCAO_DEFINITIVA_404.md",
    "SOLUCAO_RAPIDA.md",
    "LIMPAR_REPOSITORIO.md"
)

# Remover arquivos
foreach ($arquivo in $arquivosParaRemover) {
    if (Test-Path $arquivo) {
        Write-Host "Removendo: $arquivo" -ForegroundColor Gray
        git rm $arquivo 2>$null
    }
}

Write-Host "✅ Limpeza concluída!" -ForegroundColor Green
Write-Host ""
Write-Host "Próximos passos:" -ForegroundColor Cyan
Write-Host "1. git status (verificar mudanças)"
Write-Host "2. git commit -m 'Limpar arquivos de troubleshooting'"
Write-Host "3. git push origin main"


