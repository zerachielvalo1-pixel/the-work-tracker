# Repairs the verify/ preview HTML: re-points every preview at the stylesheet
# the current build produced, and restores the month arrows that an earlier
# ASCII-encoded rewrite destroyed.
#
# NOTE: this file is deliberately pure ASCII. Windows PowerShell reads .ps1
# files as ANSI unless they carry a UTF-8 BOM, so non-ASCII characters here
# would be mangled before the script ever runs. Unicode is emitted via
# [char]0x.... instead.
#
# Run from anywhere:  powershell -File verify/fix-previews.ps1
$ErrorActionPreference = 'Stop'

$repo = Split-Path -Parent $PSScriptRoot
$dir = Join-Path $repo 'verify'
$assets = Join-Path $repo 'dist\assets'

$css = (Get-ChildItem $assets -Filter 'index-*.css' | Select-Object -First 1).Name
if (-not $css) { throw "No built stylesheet found in $assets - run npm run build first." }

$noBom = New-Object System.Text.UTF8Encoding($false)
$lArrow = [char]0x2190   # left arrow
$rArrow = [char]0x2192   # right arrow

# Rewrite everything between the tag and its closing tag, so it does not matter
# which byte the ASCII mangling produced.
$prevPattern = '(<button[^>]*aria-label="Previous month"[^>]*>).*?(</button>)'
$nextPattern = '(<button[^>]*aria-label="Next month"[^>]*>).*?(</button>)'

$changed = 0
foreach ($file in Get-ChildItem $dir -Filter '*.html') {
  $text = [System.Text.Encoding]::UTF8.GetString([System.IO.File]::ReadAllBytes($file.FullName))
  $before = $text

  $text = [regex]::Replace($text, $prevPattern, { param($m) $m.Groups[1].Value + $lArrow + $m.Groups[2].Value })
  $text = [regex]::Replace($text, $nextPattern, { param($m) $m.Groups[1].Value + $rArrow + $m.Groups[2].Value })
  $text = $text -replace '/assets/index-[A-Za-z0-9_-]+\.css', "/assets/$css"

  if ($text -ne $before) {
    [System.IO.File]::WriteAllText($file.FullName, $text, $noBom)
    Write-Host "updated $($file.Name)"
    $changed++
  } else {
    Write-Host "unchanged $($file.Name)"
  }
}

Write-Host "css: $css"
Write-Host "files updated: $changed"
