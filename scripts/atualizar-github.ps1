# Atualizar o repositório no GitHub (após você mudar código em Gateway/)
param(
  [string]$Mensagem = "chore: atualização"
)
$git = "${env:ProgramFiles}\Git\bin\git.exe"
if (-not (Test-Path $git)) { $git = "git" }
Set-Location $PSScriptRoot\..
& $git add -A
& $git status --short
& $git commit -m $Mensagem
if ($LASTEXITCODE -ne 0) { Write-Host "Nada para commitar ou erro acima."; exit $LASTEXITCODE }
& $git push origin main
