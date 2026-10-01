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
    <span className="badge" style={{ background: c.bg, color: c.fg }}>
      {status.replace('_', ' ')}
    </span>
  )
}

function PriorityBadge({ priority }: { priority: string }) {
  const c = PRIORITY_COLORS[priority] ?? { bg: '#F2EDFB', fg: '#3D2E5C' }
  return (
    <span className="badge" style={{ background: c.bg, color: c.fg }}>
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
      <div className="page__head">
        <h1 className="page__title">All tasks</h1>
        <p className="page__sub">
          Every story, photo, and layout in one place.
        </p>
      </div>

      <div className="toolbar">
        <label className="sr-only" htmlFor="task-search">
          Search tasks by title
        </label>
        <input
          id="task-search"
          className="input"
          type="search"
          inputMode="search"
          enterKeyHint="search"
          autoComplete="off"
          placeholder="Search by title…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <label className="sr-only" htmlFor="task-status">
          Filter by status
        </label>
        <select
          id="task-status"
          className="select"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
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

      <div className="task-card table-scroll">
        <table className="tasktable">
          <caption className="sr-only">
            Tasks with type, status, priority and due date
          </caption>
          <thead>
            <tr>
              <th scope="col">Title</th>
              <th scope="col">Type</th>
              <th scope="col">Status</th>
              <th scope="col">Priority</th>
              <th scope="col">Due</th>
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
              <tr key={t.id}>
                <td data-label="Title">{t.title}</td>
                <td data-label="Type" style={{ color: '#6B5B8E', textTransform: 'capitalize' }}>
                  {t.type.replace('_', ' ')}
                </td>
                <td data-label="Status">
                  <StatusBadge status={t.status} />
                </td>
                <td data-label="Priority">
                  <PriorityBadge priority={t.priority} />
                </td>
                <td data-label="Due" style={{ color: '#6B5B8E', whiteSpace: 'nowrap' }}>
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

      <p className="foot-note">
        {filtered.length} of {tasks.length} tasks
      </p>
    </div>
  )
}
