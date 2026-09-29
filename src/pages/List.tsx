import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

type Task = {
  id: string
  title: string
  type: string
  status: string
  priority: string
  due_date: string | null
}

const STATUS_COLORS: Record<string, { bg: string; fg: string }> = {
  pitched:     { bg: '#F3EFEA', fg: '#7A6E64' },
  assigned:    { bg: '#E7F0FB', fg: '#1F5FA8' },
  in_progress: { bg: '#EFE8FA', fg: '#7C3AED' },
  in_review:   { bg: '#F0EAF7', fg: '#6A4C93' },
  copyread:    { bg: '#FCEFFE', fg: '#B01FA8' },
  layout:      { bg: '#FFF4E5', fg: '#9A5B00' },
  approval:    { bg: '#FFF9DB', fg: '#8A6D00' },
  done:        { bg: '#E6F4EC', fg: '#1F7A4D' },
  killed:      { bg: '#FDECEA', fg: '#8F1D17' },
}

const PRIORITY_COLORS: Record<string, { bg: string; fg: string }> = {
  low:    { bg: '#F2EDFB', fg: '#6B5B8E' },
  normal: { bg: '#F2EDFB', fg: '#3D2E5C' },
  high:   { bg: '#FFF4E5', fg: '#9A5B00' },
  urgent: { bg: '#FDECEA', fg: '#8F1D17' },
}

function StatusBadge({ status }: { status: string }) {
  const c = STATUS_COLORS[status] ?? { bg: '#F2EDFB', fg: '#3D2E5C' }
  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: 5,
      padding: '3px 10px',
      borderRadius: 999,
      fontFamily: 'system-ui',
      fontSize: 11,
      fontWeight: 700,
      background: c.bg,
      color: c.fg,
      whiteSpace: 'nowrap',
      textTransform: 'capitalize',
    }}>
      {status.replace('_', ' ')}
    </span>
  )
}

function PriorityBadge({ priority }: { priority: string }) {
  const c = PRIORITY_COLORS[priority] ?? { bg: '#F2EDFB', fg: '#3D2E5C' }
  return (
    <span style={{
      display: 'inline-flex',
      padding: '3px 10px',
      borderRadius: 999,
      fontFamily: 'system-ui',
      fontSize: 11,
      fontWeight: 700,
      background: c.bg,
      color: c.fg,
      textTransform: 'capitalize',
    }}>
      {priority}
    </span>
  )
}

export default function List() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')

  useEffect(() => {
    supabase
      .from('tasks')
      .select('id,title,type,status,priority,due_date')
      .order('created_at', { ascending: false })
      .then(({ data, error }) => {
        if (error) console.error(error)
        setTasks((data as Task[]) ?? [])
        setLoading(false)
      })
  }, [])

  const filtered = tasks.filter((t) => {
    if (statusFilter && t.status !== statusFilter) return false
    if (search && !t.title.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  return (
    <div>
      <h1 style={{
        fontFamily: 'Georgia, serif',
        fontSize: 26,
        fontWeight: 900,
        margin: '0 0 6px',
        letterSpacing: '-0.02em',
      }}>
        All tasks
      </h1>
      <p style={{ fontSize: 13, color: '#6B5B8E', margin: '0 0 24px' }}>
        Every story, photo, and layout in one place.
      </p>

      <div style={{
        display: 'flex',
        gap: 12,
        marginBottom: 16,
        flexWrap: 'wrap',
      }}>
        <input
          type="text"
          placeholder="Search by title…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            flex: 1,
            minWidth: 220,
            padding: '10px 14px',
            fontSize: 14,
            border: '1.5px solid #E5DDF5',
            borderRadius: 6,
            outline: 'none',
            fontFamily: 'system-ui',
          }}
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          style={{
            padding: '10px 14px',
            fontSize: 14,
            border: '1.5px solid #E5DDF5',
            borderRadius: 6,
            outline: 'none',
            fontFamily: 'system-ui',
            background: '#fff',
            minWidth: 160,
          }}
        >
          <option value="">All statuses</option>
          <option value="pitched">Pitched</option>
          <option value="assigned">Assigned</option>
          <option value="in_progress">In progress</option>
          <option value="in_review">In review</option>
          <option value="copyread">Copyread</option>
          <option value="layout">Layout</option>
          <option value="approval">Approval</option>
          <option value="done">Done</option>
          <option value="killed">Killed</option>
        </select>
      </div>

      <div style={{
        background: '#fff',
        border: '1px solid #E5DDF5',
        borderRadius: 12,
        overflow: 'hidden',
      }}>
        <table style={{
          width: '100%',
          borderCollapse: 'collapse',
          fontFamily: 'system-ui',
        }}>
          <thead>
            <tr style={{
              background: '#F2EDFB',
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              color: '#6B5B8E',
            }}>
              <th style={{ textAlign: 'left', padding: '12px 16px' }}>Title</th>
              <th style={{ textAlign: 'left', padding: '12px 16px' }}>Type</th>
              <th style={{ textAlign: 'left', padding: '12px 16px' }}>Status</th>
              <th style={{ textAlign: 'left', padding: '12px 16px' }}>Priority</th>
              <th style={{ textAlign: 'left', padding: '12px 16px' }}>Due</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={5} style={{ padding: 32, textAlign: 'center', color: '#9A8EB8', fontSize: 13 }}>
                  Loading…
                </td>
              </tr>
            )}
            {!loading && filtered.length === 0 && (
              <tr>
                <td colSpan={5} style={{ padding: 40, textAlign: 'center', color: '#9A8EB8', fontSize: 13 }}>
                  No tasks match.
                </td>
              </tr>
            )}
            {!loading && filtered.map((t) => (
              <tr
                key={t.id}
                style={{
                  borderTop: '1px solid #EFE8FA',
                  fontSize: 13,
                }}
              >
                <td style={{
                  padding: '14px 16px',
                  fontWeight: 600,
                  color: '#1A0E2E',
                  maxWidth: 360,
                }}>
                  {t.title}
                </td>
                <td style={{ padding: '14px 16px', color: '#6B5B8E', textTransform: 'capitalize' }}>
                  {t.type.replace('_', ' ')}
                </td>
                <td style={{ padding: '14px 16px' }}>
                  <StatusBadge status={t.status} />
                </td>
                <td style={{ padding: '14px 16px' }}>
                  <PriorityBadge priority={t.priority} />
                </td>
                <td style={{ padding: '14px 16px', color: '#6B5B8E', whiteSpace: 'nowrap' }}>
                  {t.due_date
                    ? new Date(t.due_date).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })
                    : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p style={{ fontSize: 12, color: '#9A8EB8', marginTop: 12 }}>
        {filtered.length} of {tasks.length} tasks
      </p>
    </div>
  )
}