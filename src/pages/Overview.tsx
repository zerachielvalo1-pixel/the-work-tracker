import { useMemo, useState } from 'react'
import { StatusBadge } from '../components/Badges'
import TaskDrawer from '../components/TaskDrawer'
import { useTasks } from '../lib/useTasks'
import { formatDate, isOverdue, isOpen, statusLabel } from '../lib/types'
import type { Task } from '../lib/types'

export default function Overview({
  userName,
  onNewTask,
  onOpenBoard,
}: {
  userName: string
  onNewTask: () => void
  onOpenBoard: () => void
}) {
  const { tasks, loading, error, clearError } = useTasks()
  const [selected, setSelected] = useState<Task | null>(null)

  const stats = useMemo(() => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const in7 = new Date(today)
    in7.setDate(in7.getDate() + 7)

    const open = tasks.filter(isOpen)
    return [
      { value: open.length, label: 'Total open' },
      { value: tasks.filter((t) => t.status === 'in_progress').length, label: 'In progress' },
      {
        value: open.filter((t) => {
          if (!t.due_date) return false
          const d = new Date(t.due_date)
          return d >= today && d <= in7
        }).length,
        label: 'Due this week',
      },
      { value: open.filter(isOverdue).length, label: 'Overdue' },
    ]
  }, [tasks])

  const upcoming = useMemo(
    () =>
      tasks
        .filter((t) => isOpen(t) && t.due_date)
        .sort((a, b) => (a.due_date ?? '').localeCompare(b.due_date ?? ''))
        .slice(0, 6),
    [tasks],
  )

  const overdueList = useMemo(
    () =>
      tasks
        .filter(isOverdue)
        .sort((a, b) => (a.due_date ?? '').localeCompare(b.due_date ?? '')),
    [tasks],
  )

  const selectedTask = selected ? tasks.find((t) => t.id === selected.id) ?? selected : null

  return (
    <div>
      <div className="page__head page__head--row">
        <div>
          <h1 className="page__title">Welcome back, {userName}.</h1>
          <p className="page__sub">Here's what's happening with The Work's content.</p>
        </div>
        <button type="button" className="btn btn--primary" onClick={onNewTask}>
          New task
        </button>
      </div>

      {error && (
        <div className="alert alert--row" role="alert">
          <span>{error}</span>
          <button type="button" className="alert__dismiss" onClick={clearError}>
            Dismiss
          </button>
        </div>
      )}

      <div className="stats">
        {stats.map((s) => (
          <div className="stat" key={s.label}>
            <b className="stat__value">{loading ? '—' : s.value}</b>
            <span className="stat__label">{s.label}</span>
          </div>
        ))}
      </div>

      {!loading && overdueList.length > 0 && (
        <div className="card card--alert" style={{ marginBottom: 20 }}>
          <h2 className="card__title">
            {overdueList.length} overdue {overdueList.length === 1 ? 'task' : 'tasks'}
          </h2>
          <p className="card__sub">These are past their due date and still open.</p>
          <div className="rows">
            {overdueList.slice(0, 5).map((t) => (
              <button
                type="button"
                className="row-item row-item--button"
                key={t.id}
                onClick={() => setSelected(t)}
              >
                <span style={{ minWidth: 0 }}>
                  <span className="row-item__title">{t.title}</span>
                  <span className="row-item__meta">{statusLabel(t.status)}</span>
                </span>
                <span className="row-item__date is-overdue">
                  {formatDate(t.due_date)}
                </span>
              </button>
            ))}
          </div>
          {overdueList.length > 5 && (
            <button type="button" className="foot-link" onClick={onOpenBoard}>
              See all {overdueList.length} on the board
            </button>
          )}
        </div>
      )}

      <div className="card">
        <h2 className="card__title">Upcoming deadlines</h2>
        <p className="card__sub">The next tasks by due date.</p>

        {loading ? (
          <>
            <div className="skeleton skeleton--row" />
            <div className="skeleton skeleton--row" />
            <div className="skeleton skeleton--row" />
          </>
        ) : upcoming.length === 0 ? (
          <div className="empty-state">
            <p className="empty-state__title">No deadlines scheduled</p>
            <p className="muted-note">
              Add a due date when you create a task and it will show up here.
            </p>
            <button type="button" className="btn btn--ghost" onClick={onNewTask}>
              Create a task
            </button>
          </div>
        ) : (
          <div className="rows">
            {upcoming.map((t) => (
              <button
                type="button"
                className="row-item row-item--button"
                key={t.id}
                onClick={() => setSelected(t)}
              >
                <span style={{ minWidth: 0 }}>
                  <span className="row-item__title">{t.title}</span>
                  <span className="row-item__meta">
                    <StatusBadge status={t.status} /> {t.priority}
                  </span>
                </span>
                <span className={`row-item__date${isOverdue(t) ? ' is-overdue' : ''}`}>
                  {formatDate(t.due_date)}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      {selectedTask && (
        <TaskDrawer task={selectedTask} onClose={() => setSelected(null)} />
      )}
    </div>
  )
}
