# Gera data.js a partir do arquivo .md (Parte 2). Mantido ASCII por compatibilidade com PowerShell 5.
$ErrorActionPreference = 'Stop'
$root = $PSScriptRoot
$lines = Get-Content (Join-Path $root 'Analise_Completa_Debate_Globo_2026.md') -Encoding UTF8

$start = 0; $end = $lines.Count
for ($i = 0; $i -lt $lines.Count; $i++) {
  if ($lines[$i] -match '^# PARTE 2') { $start = $i }
  if ($lines[$i] -match '^# PARTE 3') { $end = $i; break }
}

$out = New-Object System.Collections.ArrayList
$block = ''; $theme = ''; $speaker = ''; $t1 = ''; $t2 = ''; $resposta = $false
$cur = $null

function Flush {
  if ($script:cur) { [void]$script:out.Add([pscustomobject]$script:cur); $script:cur = $null }
}

for ($i = $start; $i -lt $end; $i++) {
  $l = $lines[$i]
  if ($l -match '^# \d.{1,2}BLOCO . (.+)$') { Flush; $block = $Matches[1].Trim(); continue }
  if ($l -match '^## (.+)$') {
    Flush
    $h = $Matches[1]
    $h = ($h -replace '\s*\(`.*$', '')
    if ($h -match 'Tema: (.+)$') { $theme = $Matches[1].Trim() } else { $theme = $h.Trim() }
    continue
  }
  if ($l -match '^### (.+)$') {
    Flush
    $h = $Matches[1]
    if ($h -match '^Fl') { $speaker = 'flavio' } elseif ($h -match '^Lu') { $speaker = 'lula' }
    $resposta = ($h -match 'Direito de Resposta')
    if ($h -match '\[`(\d\d:\d\d:\d\d)`.+`(\d\d:\d\d:\d\d)`\]') { $t1 = $Matches[1]; $t2 = $Matches[2] }
    continue
  }
  if ($l -match '^\*\*(\d+)\.\*\*$') {
    Flush
    $cur = [ordered]@{
      id = [int]$Matches[1]; candidato = $speaker; bloco = $block; tema = $theme
      inicio = $t1; fim = $t2; resposta = $resposta
      trecho = ''; classificacao = ''; motivo = ''; fontes = @()
    }
    continue
  }
  if (-not $cur) { continue }
  if ($l -match '^\* \*\*Trecho:\*\* "(.*)"\s*$') { $cur.trecho = $Matches[1]; continue }
  if ($l -match '^\* \*\*Classifica.+?:\*\* (.+)$') { $cur.classificacao = $Matches[1].Trim(); continue }
  if ($l -match '^\* \*\*Motivo.+?:\*\* (.+)$') { $cur.motivo = $Matches[1].Trim(); continue }
  if ($l -match '^\s+\d+\. (.+?) \S \*\*(.+?) confiabilidade\*\*\s*$') {
    $cur.fontes += [pscustomobject]@{ nome = $Matches[1].Trim(); confianca = $Matches[2].Trim() }
    continue
  }
}
Flush

# Verificacao contra a Parte 3
$grp = $out | Group-Object candidato, classificacao | Sort-Object Name
$grp | ForEach-Object { "{0}: {1}" -f $_.Name, $_.Count } | Write-Host
Write-Host ("Total: " + $out.Count)
$bad = $out | Where-Object { -not $_.trecho -or -not $_.classificacao -or -not $_.motivo -or $_.fontes.Count -lt 1 -or -not $_.candidato }
Write-Host ("Incompletos: " + @($bad).Count)

$json = ConvertTo-Json -InputObject @($out) -Depth 6 -Compress
$js = "window.FALAS = " + $json + ";"
[IO.File]::WriteAllText((Join-Path $root 'data.js'), $js, (New-Object Text.UTF8Encoding($false)))
