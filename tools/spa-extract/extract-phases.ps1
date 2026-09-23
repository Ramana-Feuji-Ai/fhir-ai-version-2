# Normalize / re-extract SPA phases JSON
# Usage: powershell -File scripts/extract-phases.ps1

$ErrorActionPreference = 'Stop'
$src = Join-Path $PSScriptRoot '..\..\FHI_FHIR_Learning_SPA 2.html'
if (-not (Test-Path $src)) {
  $src = Join-Path $PSScriptRoot '..\..\..\FHI_FHIR_Learning_SPA 2.html'
}
$out = Join-Path $PSScriptRoot '..\data\phases.spa.json'

$text = [System.IO.File]::ReadAllText((Resolve-Path $src))
$marker = 'const phases = '
$start = $text.IndexOf($marker)
if ($start -lt 0) { throw 'phases marker not found' }
$start += $marker.Length
$end = $text.IndexOf("];`r`n", $start)
if ($end -lt 0) { $end = $text.IndexOf("];`n", $start) }
$json = $text.Substring($start, $end - $start + 1)
$obj = $json | ConvertFrom-Json
$pretty = $obj | ConvertTo-Json -Depth 100
[System.IO.File]::WriteAllText((Resolve-Path (Split-Path $out -Parent)) + '\phases.spa.json', $pretty)
Write-Host "Wrote $out ($($obj.Count) phases)"
