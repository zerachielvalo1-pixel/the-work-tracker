import { useMemo, useState } from 'react'
import { PriorityBadge, StatusBadge } from '../components/Badges'
import TaskDrawer from '../components/TaskDrawer'
import { useTasks } from '../lib/useTasks'
import { formatDate, isOverdue } from '../lib/types'
import type { Task } from '../lib/types'

/**
 * The pitch box: everything still in the ideas stage (pitched, unassigned).
 * This is a filtered view of the shared task list, not a separate table.
 */
export default function Pitches() {
  const { tasks, loading } = useTasks()
  const [selected, setSelected] = useState<Task | null>(null)

  const pitches = useMemo(
    () =>
      tasks
        .filter((t) => t.status === 'pitched')
        .sort((a, b) => (b.created_at ?? '').localeCompare(a.created_at ?? '')),
    [tasks],
  )

  const selectedTask = selected ? tasks.find((t) => t.id === selected.id) ?? selected : null

  return (
    <div>
      <div className="page__head">
        <h1 className="page__title">Pitch box</h1>
        <p className="page__sub">
          Ideas waiting to be picked up. Advance one to Assigned on the board
          when it is greenlit.
        </p>
      </div>

      {loading ? (
        <div className="card">
          <div className="skeleton skeleton--card" />
          <div className="skeleton skeleton--card" />
        </div>
      ) : pitches.length === 0 ? (
        <div className="empty-state">
          <p className="empty-state__title">No open pitches</p>
          <p className="muted-note">
            Anything you add with New task starts here at Pitched.
          </p>
        </div>
      ) : (
        <div className="pitch-list">
          {pitches.map((t) => (
            <article className="pitch" key={t.id}>
              <button
                type="button"
                className="pitch__main"
                onClick={() => setSelected(t)}
              >
                <h2 className="pitch__title">{t.title}</h2>
                {t.description && (
                  <p className="pitch__desc">{t.description}</p>
                )}
                <div className="pitch__meta">
                  <StatusBadge status={t.status} />
                  <PriorityBadge priority={t.priority} />
                  <span className="pitch__type">{t.type.replace(/_/g, ' ')}</span>
                  {t.due_date && (
                    <span className={isOverdue(t) ? 'is-overdue' : undefined}>
                      Due {formatDate(t.due_date)}
                    </span>
                  )}
                </div>
              </button>
            </article>
          ))}
        </div>
      )}

      {selectedTask && (
        <TaskDrawer task={selectedTask} onClose={() => setSelected(null)} />
      )}
    </div>
  )
}
