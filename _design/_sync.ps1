# 변환 → 빌드용 로컬 복사본 동기화 (Y: 네트워크 드라이브에서는 next build 가 실패하므로)
param([string]$Dest = "C:\Users\11HOME~1\AppData\Local\Temp\claude\C--Users-11HOME-AHCI\3292e39f-d7ab-4227-a455-64c399128e08\scratchpad\ichi-build")

$Root = Split-Path $PSScriptRoot -Parent
Push-Location $PSScriptRoot
node _convert.mjs | Out-Null
node _build.mjs
Pop-Location

robocopy "$Root\src" "$Dest\src" /E /PURGE /NFL /NDL /NJH /NJS /NC /NS | Out-Null
robocopy "$Root\public" "$Dest\public" /E /NFL /NDL /NJH /NJS /NC /NS | Out-Null
Write-Output "동기화 완료 -> $Dest"
