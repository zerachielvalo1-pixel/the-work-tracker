/**
 * Determine which columns actually exist on the tables this app uses.
 *
 * RLS returns zero rows to an anonymous client, but PostgREST still validates
 * the requested columns first: a valid column answers 200 with [], an invalid
 * one answers 400 / 42703. Each probe is therefore a definitive existence test
 * and no secret key is needed.
 *
 * Usage: node verify/schema.mjs
 */
import { readFile, writeFile } from 'node:fs/promises'

const env = Object.fromEntries(
  (await readFile(new URL('../.env.local', import.meta.url), 'utf8'))
    .split(/\r?\n/)
    .filter((l) => l.includes('='))
    .map((l) => {
      const i = l.indexOf('=')
      return [l.slice(0, i).trim(), l.slice(i + 1).trim()]
    }),
)

const url = env.VITE_SUPABASE_URL
const headers = { apikey: env.VITE_SUPABASE_ANON_KEY, Authorization: `Bearer ${env.VITE_SUPABASE_ANON_KEY}` }

const CANDIDATES = {
  tasks: [
    'id', 'title', 'description', 'type', 'status', 'priority', 'section_id',
    'due_date', 'target_word_count', 'external_link', 'created_by',
    'created_at', 'updated_at', 'assignee_id', 'assignee', 'published_at',
    'completed_at', 'notes', 'tags', 'issue_id', 'sort_order',
  ],
  sections: ['id', 'name', 'sort_order', 'created_at'],
  profiles: ['id', 'full_name', 'email', 'role', 'avatar_url', 'created_at'],
}

async function columnExists(table, column) {
  const res = await fetch(
    `${url}/rest/v1/${table}?select=${encodeURIComponent(column)}&limit=1`,
    { headers },
  )
  if (res.status === 200) return true
  const body = await res.json().catch(() => ({}))
  // 42703 = undefined_column. Anything else (e.g. permission denied) is
  // reported so it is not silently mistaken for a missing column.
  if (body.code === '42703') return false
  return `? (HTTP ${res.status} ${body.code ?? ''} ${body.message ?? ''})`
}

const report = {}
for (const [table, columns] of Object.entries(CANDIDATES)) {
  const present = []
  const absent = []
  for (const column of columns) {
    const result = await columnExists(table, column)
    if (result === true) present.push(column)
    else if (result === false) absent.push(column)
    else absent.push(`${column} ${result}`)
  }
  report[table] = { present, absent }
}

await writeFile(new URL('./schema-report.json', import.meta.url), JSON.stringify(report, null, 2))

for (const [table, { present, absent }] of Object.entries(report)) {
  console.log(`\n${table}`)
  console.log(`  EXISTS : ${present.join(', ') || '-'}`)
  console.log(`  MISSING: ${absent.join(', ') || '-'}`)
}
