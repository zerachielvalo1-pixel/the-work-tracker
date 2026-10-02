# Writes the commit message for the tracker feature pass as UTF-8 without a BOM
# and commits. ASCII-only source on purpose: Windows PowerShell reads .ps1 as
# ANSI, and git strips a BOM (which previously flattened the message).
$ErrorActionPreference = 'Stop'
$repo = Split-Path -Parent $PSScriptRoot
$msgPath = Join-Path $PSScriptRoot '.commitmsg.tmp'

$lines = @(
  'Wire up the app: board, calendar, pitches, settings and task details',
  ''
  'The app had one shipped action that could not be reached: NewTask.tsx was'
  'fully written but App.tsx never rendered it, so "New task" showed a'
  'placeholder. Six other nav items dead-ended the same way. This makes the'
  'whole tracker usable and makes navigation honest about what exists.',
  ''
  'Schema first'
  '- There was no schema file or generated types, so before writing any query I'
  '  probed the live database column by column (PostgREST returns 200 for a'
  '  valid column and 42703 for an invalid one, so each probe is a definitive'
  '  existence test and no secret key is needed).'
  '- Confirmed: tasks has description, target_word_count, external_link,'
  '  completed_at and issue_id, none of which the UI ever displayed.'
  '- Confirmed absent: assignee_id, tags, notes on tasks; email and role on'
  '  profiles. Those are therefore not modelled and not queried.',
  ''
  'New and rewritten screens'
  '- Board: kanban by workflow status with per-column counts and a one-tap'
  '  "Next" to advance a task, plus a collapsed Killed section.'
  '- Calendar: month grid from 720px, chronological agenda on phones, with'
  '  month navigation.'
  '- Pitch box: everything still at pitched, showing descriptions.'
  '- Settings: account, three-way theme choice, manual refresh.'
  '- Task drawer: full detail and edit sheet. Surfaces the fields above, moves'
  '  a task between statuses, and deletes behind a confirmation.',
  ''
  'Data layer'
  '- One shared task store (TaskProvider + useTasks) replaces the separate'
  '  per-page Supabase queries. Tasks load once and every panel reads the same'
  '  data, so the board and the list can no longer disagree.',
  '- Mutations are optimistic and roll back on failure, so the UI never shows'
  '  unsaved state as saved.',
  '',
  'Navigation and robustness'
  '- Panel selection moved into the URL hash: refresh keeps your place, the'
  '  back button works, and #/board is shareable.',
  '- Planned panels (Issues, Team) are labelled "soon" and explain exactly'
  '  which columns they are missing instead of rendering a blank page.',
  '- Error boundary so a render failure shows a retry rather than a white'
  '  screen; skip link; aria-current on nav; Escape and scroll-lock on both'
  '  the drawer and the task sheet.',
  '',
  'Theming'
  '- Light, dark, or match-device, stored under tw-tracker-theme and applied'
  '  before first paint so there is no flash of the wrong theme.',
  '- color-scheme is set per theme so native select and date controls are never'
  '  drawn dark-on-white.',
  '',
  'Also fixed: the overdue highlight was losing to a later single-class colour'
  'rule. It now uses a doubled class for specificity and is asserted in the'
  'verification script.',
  '',
  'Verification'
  '- tsc -b, eslint and vite build all pass.'
  '- check-all.mjs renders four preview pages at four viewports in both themes'
  '  via the Chrome DevTools Protocol and fails on horizontal overflow,'
  '  undersized touch targets, or a wrong overdue colour: 16 combinations, no'
  '  overflow anywhere, 16px inputs, 44px nav targets.'
  '- The only remaining sub-44px targets are the calendar event pills at 28px,'
  '  which is a deliberate trade for month-grid density.',
  '- Superseded one-off verification scripts folded into check-all.mjs;'
  '  regenerated screenshots are gitignored.'
)

$noBom = New-Object System.Text.UTF8Encoding($false)
[System.IO.File]::WriteAllLines($msgPath, $lines, $noBom)

& git -C $repo add -A
& git -C $repo commit -F $msgPath
$code = $LASTEXITCODE
Remove-Item $msgPath -Force
Write-Host "commit exit: $code"
Write-Host '--- subject ---'
& git -C $repo log -1 --format=%s
Write-Host '--- summary ---'
& git -C $repo show --stat --oneline HEAD | Select-Object -First 14
