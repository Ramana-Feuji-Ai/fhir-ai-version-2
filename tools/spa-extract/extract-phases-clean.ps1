# Re-extract clean phases JSON from the SPA HTML (keeps \uXXXX escapes; no ConvertTo-Json).
$ErrorActionPreference = 'Stop'
$htmlPath = Resolve-Path (Join-Path $PSScriptRoot '..\..\FHI_FHIR_Learning_SPA 2.html')

$text = [System.IO.File]::ReadAllText($htmlPath)
$marker = 'const phases = '
$start = $text.IndexOf($marker)
if ($start -lt 0) { throw 'phases marker not found' }
$start += $marker.Length
$end = $text.IndexOf("];`r`n", $start)
if ($end -lt 0) { $end = $text.IndexOf("];`n", $start) }
if ($end -lt 0) { throw 'phases end not found' }

$json = $text.Substring($start, $end - $start + 1)

$outPrettyFull = [System.IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..\data\phases.spa.json'))
$outCpFull = [System.IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..\apps\api\src\main\resources\db\seed\phases.spa.json'))
$utf8 = New-Object System.Text.UTF8Encoding $false
[System.IO.File]::WriteAllText($outPrettyFull, $json, $utf8)
[System.IO.File]::WriteAllText($outCpFull, $json, $utf8)

# Count classic mojibake pattern: U+00E2 U+20AC (â€)
$bad = 0
for ($i = 0; $i -lt $json.Length - 1; $i++) {
  if ([int][char]$json[$i] -eq 0x00E2 -and [int][char]$json[$i+1] -eq 0x20AC) { $bad++ }
}
Write-Host "Wrote clean seed"
Write-Host "  $outPrettyFull"
Write-Host "  $outCpFull"
Write-Host "bytes=$($json.Length) mojibakePairs=$bad"
