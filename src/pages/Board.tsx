import { useMemo, useState } from 'react'
import { PriorityBadge } from '../components/Badges'
import TaskDrawer from '../components/TaskDrawer'
import { useTasks } from '../lib/useTasks'
import { BOARD_STATUSES, formatDate, isOverdue, statusLabel } from '../lib/types'
import type { Task } from '../lib/types'

/** The status a card moves to when you tap "next". */
function nextStatus(status: string): string | null {
  const i = BOARD_STATUSES.indexOf(status as (typeof BOARD_STATUSES)[number])
  if (i === -1 || i === BOARD_STATUSES.length - 1) return null
  return BOARD_STATUSES[i + 1]
}

export default function Board() {
  const { tasks, loading, updateTask } = useTasks()
  const [selected, setSelected] = useState<Task | null>(null)
  const [showKilled, setShowKilled] = useState(false)

  const columns = useMemo(
    () =>
      BOARD_STATUSES.map((status) => ({
        status,
        items: tasks.filter((t) => t.status === status),
      })),
    [tasks],
  )

  const killed = useMemo(() => tasks.filter((t) => t.status === 'killed'), [tasks])

  // Keep the open drawer in sync with the store after an edit.
  const selectedTask = selected ? tasks.find((t) => t.id === selected.id) ?? selected : null

  if (loading) {
    return (
      <div>
        <div className="page__head">
          <h1 className="page__title">Board</h1>
          <p className="page__sub">Loading the workflow…</p>
        </div>
        <div className="board">
          {BOARD_STATUSES.slice(0, 4).map((s) => (
            <div className="board__col" key={s}>
              <div className="skeleton skeleton--title" />
              <div className="skeleton skeleton--card" />
              <div className="skeleton skeleton--card" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="page__head">
        <h1 className="page__title">Board</h1>
        <p className="page__sub">
          Every task by stage of the workflow. Tap a card for details, or use
          Next to advance it.
        </p>
      </div>

      <div className="board">
        {columns.map(({ status, items }) => (
          <section className="board__col" key={status} aria-labelledby={`col-${status}`}>
            <h2 className="board__head" id={`col-${status}`}>
              <span>{statusLabel(status)}</span>
              <span className="board__count">{items.length}</span>
            </h2>

            {items.length === 0 ? (
              <p className="board__empty">Nothing here</p>
            ) : (
              items.map((task) => {
                const next = nextStatus(task.status)
                return (
                  <article className="tcard" key={task.id}>
                    <button
                      type="button"
                      className="tcard__main"
                      onClick={() => setSelected(task)}
                    >
                      <span className="tcard__title">{task.title}</span>
                      <span className="tcard__meta">
                        {task.type.replace(/_/g, ' ')}
                        {task.due_date && (
                          <>
                            {' · '}
                            <span className={isOverdue(task) ? 'is-overdue' : undefined}>
                              {formatDate(task.due_date)}
                            </span>
                          </>
                        )}
                      </span>
                    </button>

                    <div className="tcard__foot">
                      <PriorityBadge priority={task.priority} />
                      {next && (
                        <button
                          type="button"
                          className="tcard__next"
                          onClick={() => void updateTask(task.id, { status: next })}
                        >
                          Next: {statusLabel(next)}
                        </button>
                      )}
                    </div>
                  </article>
                )
              })
            )}
          </section>
        ))}
      </div>

      {killed.length > 0 && (
        <section className="board__killed">
          <button
            type="button"
            className="disclosure"
            aria-expanded={showKilled}
            onClick={() => setShowKilled((v) => !v)}
          >
            <span className={`disclosure__caret${showKilled ? ' is-open' : ''}`} aria-hidden="true">
              ▸
            </span>
            Killed ({killed.length})
          </button>

          {showKilled && (
            <div className="board board--killed">
              {killed.map((task) => (
                <article className="tcard tcard--muted" key={task.id}>
                  <button
                    type="button"
                    className="tcard__main"
                    onClick={() => setSelected(task)}
                  >
                    <span className="tcard__title">{task.title}</span>
                    <span className="tcard__meta">{task.type.replace(/_/g, ' ')}</span>
                  </button>
                </article>
              ))}
            </div>
          )}
        </section>
      )}

      {selectedTask && (
        <TaskDrawer task={selectedTask} onClose={() => setSelected(null)} />
      )}
    </div>
  )
}
