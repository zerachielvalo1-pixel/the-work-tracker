import { useMemo, useState } from 'react'
import { PriorityBadge, StatusBadge } from '../components/Badges'
import TaskDrawer from '../components/TaskDrawer'
import { useTasks } from '../lib/useTasks'
import { formatDate, isOverdue, statusLabel } from '../lib/types'
import type { Task } from '../lib/types'

type SortKey = 'newest' | 'due' | 'priority'

const PRIORITY_RANK: Record<string, number> = { urgent: 0, high: 1, normal: 2, low: 3 }

const SORTS: { key: SortKey; label: string }[] = [
  { key: 'newest', label: 'Newest' },
  { key: 'due', label: 'Due date' },
  { key: 'priority', label: 'Priority' },
]

export default function List() {
  const { tasks, loading } = useTasks()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [sort, setSort] = useState<SortKey>('newest')
  const [selected, setSelected] = useState<Task | null>(null)

  const filtered = useMemo(() => {
    const needle = search.trim().toLowerCase()
    const rows = tasks.filter((t) => {
      if (statusFilter && t.status !== statusFilter) return false
      if (needle && !t.title.toLowerCase().includes(needle)) return false
      return true
    })

    const sorted = [...rows]
    if (sort === 'due') {
      // Undated tasks sort last rather than first.
      sorted.sort((a, b) => {
        if (!a.due_date && !b.due_date) return 0
        if (!a.due_date) return 1
        if (!b.due_date) return -1
        return a.due_date.localeCompare(b.due_date)
      })
    } else if (sort === 'priority') {
      sorted.sort(
        (a, b) => (PRIORITY_RANK[a.priority] ?? 9) - (PRIORITY_RANK[b.priority] ?? 9),
      )
    } else {
      sorted.sort((a, b) => (b.created_at ?? '').localeCompare(a.created_at ?? ''))
    }
    return sorted
  }, [tasks, search, statusFilter, sort])

  const statusOptions = useMemo(
    () => [...new Set(tasks.map((t) => t.status))].sort(),
    [tasks],
  )

  const selectedTask = selected ? tasks.find((t) => t.id === selected.id) ?? selected : null

  return (
    <div>
      <div className="page__head">
        <h1 className="page__title">All tasks</h1>
        <p className="page__sub">Every story, photo, and layout in one place.</p>
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
          {statusOptions.map((s) => (
            <option key={s} value={s}>{statusLabel(s)}</option>
          ))}
        </select>

        <label className="sr-only" htmlFor="task-sort">
          Sort tasks
        </label>
        <select
          id="task-sort"
          className="select"
          value={sort}
          onChange={(e) => setSort(e.target.value as SortKey)}
        >
          {SORTS.map((s) => (
            <option key={s.key} value={s.key}>Sort: {s.label}</option>
          ))}
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
                <td colSpan={5} className="table-empty">Loading…</td>
              </tr>
            )}
            {!loading && filtered.length === 0 && (
              <tr>
                <td colSpan={5} className="table-empty">
                  {tasks.length === 0
                    ? 'No tasks yet. Use New task to add the first one.'
                    : 'No tasks match these filters.'}
                </td>
              </tr>
            )}
            {!loading && filtered.map((t) => (
              <tr key={t.id}>
                <td data-label="Title">
                  <button type="button" className="rowlink" onClick={() => setSelected(t)}>
                    {t.title}
                  </button>
                </td>
                <td data-label="Type" style={{ color: 'var(--muted)', textTransform: 'capitalize' }}>
                  {t.type.replace(/_/g, ' ')}
                </td>
                <td data-label="Status">
                  <StatusBadge status={t.status} />
                </td>
                <td data-label="Priority">
                  <PriorityBadge priority={t.priority} />
                </td>
                <td
                  data-label="Due"
                  className={isOverdue(t) ? 'is-overdue' : undefined}
                  style={{ color: 'var(--muted)', whiteSpace: 'nowrap' }}
                >
                  {formatDate(t.due_date, true)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="foot-note">
        {filtered.length} of {tasks.length} tasks
        {statusFilter && ` · filtered to ${statusLabel(statusFilter)}`}
      </p>

      {selectedTask && (
        <TaskDrawer task={selectedTask} onClose={() => setSelected(null)} />
      )}
    </div>
  )
}
