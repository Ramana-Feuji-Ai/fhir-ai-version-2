$ErrorActionPreference = 'Stop'
$path = 'c:\Users\venkata.mahendrakar\Downloads\fhir\fhir-learning-academy\data\phases.spa.json'
$j = [System.IO.File]::ReadAllText($path)
$markers = @('â€“', 'â€”', 'â€œ', 'â€', 'Ã')
foreach ($m in $markers) {
  $n = ([regex]::Matches($j, [regex]::Escape($m))).Count
  Write-Host ("marker=$m count=$n")
}

# Find phase 15 and sample corrupted strings
$phases = $j | ConvertFrom-Json
$p15 = $phases | Where-Object { $_.id -eq 15 }
Write-Host "Phase 15 title: $($p15.title)"
Write-Host "Phase 15 duration: $($p15.duration)"

function Find-Bad([object]$obj, [string]$path) {
  if ($null -eq $obj) { return }
  if ($obj -is [string]) {
    if ($obj -match 'â€|Ã') {
      Write-Host ("BAD $path => " + $obj.Substring(0, [Math]::Min(120, $obj.Length)))
    }
    return
  }
  if ($obj -is [System.Collections.IEnumerable] -and -not ($obj -is [string])) {
    $i = 0
    foreach ($item in $obj) {
      Find-Bad $item ($path + "[$i]")
      $i++
      if ($i -gt 200) { break }
    }
    return
  }
  foreach ($prop in $obj.PSObject.Properties) {
    Find-Bad $prop.Value ($path + '.' + $prop.Name)
  }
}

Write-Host '--- Phase 15 bad strings ---'
Find-Bad $p15 'p15'

Write-Host '--- All phases durations ---'
foreach ($p in $phases) {
  if ($p.duration -match 'â€|–|—') {
    Write-Host ("id=$($p.id) duration=$($p.duration)")
  }
}
