import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

type Task = {
  id: string
  title: string
  status: string
  due_date: string | null
  priority: string
}

export default function Overview({ userName }: { userName: string }) {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase
      .from('tasks')
      .select('id,title,status,due_date,priority')
      .order('due_date', { ascending: true, nullsFirst: false })
      .then(({ data }) => {
        setTasks((data as Task[]) ?? [])
        setLoading(false)
      })
  }, [])

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const in7 = new Date(today)
  in7.setDate(in7.getDate() + 7)

  const open = tasks.filter((t) => t.status !== 'done' && t.status !== 'killed')
  const inProgress = tasks.filter((t) => t.status === 'in_progress')
  const dueThisWeek = open.filter((t) => {
    if (!t.due_date) return false
    const d = new Date(t.due_date)
    return d >= today && d <= in7
  })
  const overdue = open.filter((t) => {
    if (!t.due_date) return false
    return new Date(t.due_date) < today
  })

  const upcoming = open.filter((t) => t.due_date).slice(0, 6)

  const stats = [
    { value: open.length,        label: 'Total open' },
    { value: inProgress.length,  label: 'In progress' },
    { value: dueThisWeek.length, label: 'Due this week' },
    { value: overdue.length,     label: 'Overdue' },
  ]

  return (
    <div>
      <div className="page__head">
        <h1 className="page__title">Welcome back, {userName}.</h1>
        <p className="page__sub">
          Here's what's happening with The Work's content.
        </p>
      </div>

      <div className="stats">
        {stats.map((s) => (
          <div className="stat" key={s.label}>
            <b className="stat__value">{loading ? '—' : s.value}</b>
            <span className="stat__label">{s.label}</span>
          </div>
        ))}
      </div>

      <div className="card">
        <h2 className="card__title">Upcoming deadlines</h2>
        <p className="card__sub">The next tasks by due date.</p>

        {loading ? (
          <p className="muted-note">Loading…</p>
        ) : upcoming.length === 0 ? (
          <p className="muted-note">No deadlines scheduled.</p>
        ) : (
          <div className="rows">
            {upcoming.map((t) => (
              <div className="row-item" key={t.id}>
                <div style={{ minWidth: 0 }}>
                  <div className="row-item__title">{t.title}</div>
                  <div className="row-item__meta">
                    {t.status.replace('_', ' ')} · {t.priority}
                  </div>
                </div>
                <div className="row-item__date">
                  {t.due_date
                    ? new Date(t.due_date).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                      })
                    : '—'}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
