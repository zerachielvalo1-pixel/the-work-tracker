import { useMemo, useState } from 'react'
import TaskDrawer from '../components/TaskDrawer'
import { useTasks } from '../lib/useTasks'
import { dueDate, formatDate, isOpen, statusLabel } from '../lib/types'
import type { Task } from '../lib/types'

function toKey(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function monthLabel(d: Date): string {
  return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
}

/**
 * Month calendar of due dates, built from the shared task list.
 *
 * Mobile gets a chronological agenda (a 7-column grid is unusable on a phone);
 * the month grid starts at 720px.
 */
export default function Calendar() {
  const { tasks, loading } = useTasks()
  const [cursor, setCursor] = useState(() => {
    const d = new Date()
    return new Date(d.getFullYear(), d.getMonth(), 1)
  })
  const [selected, setSelected] = useState<Task | null>(null)

  const byDay = useMemo(() => {
    const map = new Map<string, Task[]>()
    for (const task of tasks) {
      const d = dueDate(task)
      if (!d) continue
      const key = toKey(d)
      const list = map.get(key)
      if (list) list.push(task)
      else map.set(key, [task])
    }
    return map
  }, [tasks])

  /** Six weeks of cells covering the cursor month, starting Monday. */
  const cells = useMemo(() => {
    const first = new Date(cursor.getFullYear(), cursor.getMonth(), 1)
    const offset = (first.getDay() + 6) % 7
    const start = new Date(first)
    start.setDate(first.getDate() - offset)

    return Array.from({ length: 42 }, (_, i) => {
      const d = new Date(start)
      d.setDate(start.getDate() + i)
      return d
    })
  }, [cursor])

  const scheduled = useMemo(
    () =>
      tasks
        .filter((t) => dueDate(t) !== null && isOpen(t))
        .sort((a, b) => (dueDate(a)!.getTime() - dueDate(b)!.getTime())),
    [tasks],
  )

  const todayKey = toKey(new Date())
  const monthPrefix = `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, '0')}`
  const thisMonth = scheduled.filter((t) => toKey(dueDate(t)!) .startsWith(monthPrefix))

  const selectedTask = selected ? tasks.find((t) => t.id === selected.id) ?? selected : null

  function shiftMonth(delta: number) {
    setCursor((c) => new Date(c.getFullYear(), c.getMonth() + delta, 1))
  }

  return (
    <div>
      <div className="page__head">
        <h1 className="page__title">Calendar</h1>
        <p className="page__sub">Due dates for every open task.</p>
      </div>

      <div className="cal__bar">
        <button
          type="button"
          className="btn btn--ghost btn--icon"
          onClick={() => shiftMonth(-1)}
          aria-label="Previous month"
        >
          ←
        </button>
        <h2 className="cal__month" aria-live="polite">{monthLabel(cursor)}</h2>
        <button
          type="button"
          className="btn btn--ghost btn--icon"
          onClick={() => shiftMonth(1)}
          aria-label="Next month"
        >
          →
        </button>
        <button
          type="button"
          className="btn btn--ghost cal__today"
          onClick={() => {
            const now = new Date()
            setCursor(new Date(now.getFullYear(), now.getMonth(), 1))
          }}
        >
          Today
        </button>
      </div>

      {loading ? (
        <div className="card">
          <p className="muted-note">Loading due dates…</p>
        </div>
      ) : (
        <>
          {/* Month grid, tablet and up */}
          <div className="cal__grid-wrap card">
            <div className="cal__grid" role="grid" aria-label={`${monthLabel(cursor)} due dates`}>
              {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((d) => (
                <div className="cal__dow" key={d} role="columnheader">{d}</div>
              ))}

              {cells.map((d) => {
                const key = toKey(d)
                const items = byDay.get(key) ?? []
                const outside = d.getMonth() !== cursor.getMonth()
                return (
                  <div
                    className={[
                      'cal__cell',
                      outside ? 'is-outside' : '',
                      key === todayKey ? 'is-today' : '',
                      items.length ? 'has-items' : '',
                    ].filter(Boolean).join(' ')}
                    key={key}
                  >
                    <span className="cal__daynum">{d.getDate()}</span>
                    {items.slice(0, 3).map((t) => (
                      <button
                        type="button"
                        className="cal__pill"
                        key={t.id}
                        onClick={() => setSelected(t)}
                        title={t.title}
                      >
                        {t.title}
                      </button>
                    ))}
                    {items.length > 3 && (
                      <span className="cal__more">+{items.length - 3} more</span>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          {/* Agenda, mobile */}
          <div className="cal__agenda">
            <h2 className="card__title" style={{ marginBottom: 10 }}>
              {monthLabel(cursor)}
            </h2>
            {thisMonth.length === 0 ? (
              <p className="muted-note">No open tasks due this month.</p>
            ) : (
              thisMonth.map((t) => (
                <button
                  type="button"
                  className="agenda__row"
                  key={t.id}
                  onClick={() => setSelected(t)}
                >
                  <span className="agenda__date">{formatDate(t.due_date)}</span>
                  <span className="agenda__body">
                    <span className="row-item__title">{t.title}</span>
                    <span className="row-item__meta">{statusLabel(t.status)}</span>
                  </span>
                </button>
              ))
            )}
          </div>
        </>
      )}

      {selectedTask && (
        <TaskDrawer task={selectedTask} onClose={() => setSelected(null)} />
      )}
    </div>
  )
}
